package com.mlvpyc.service;

import com.mlvpyc.dto.LoanApplicationRequest;
import com.mlvpyc.dto.LoanResponse;
import com.mlvpyc.dto.PoolSummaryResponse;
import com.mlvpyc.dto.PriorityQueueEntry;
import com.mlvpyc.entity.*;
import com.mlvpyc.exception.LoanEligibilityReason;
import com.mlvpyc.exception.LoanNotEligibleException;
import com.mlvpyc.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LoanService {

    private final LoanRepository loanRepository;
    private final MemberRepository memberRepository;
    private final TermRepository termRepository;
    private final ContributionRepository contributionRepository;
    private final AuditLogRepository auditLogRepository;
    private final PriorityService priorityService;

    @Value("${app.loan.max-amount-per-term:200000.00}")
    private BigDecimal maxAmountPerTerm;

    @Value("${app.loan.default-interest-rate:0.05}")
    private BigDecimal defaultInterestRate;

    @Value("${app.loan.term-months:6}")
    private int termMonths;

    /**
     * Applies hard eligibility rules and, if passed, creates a PENDING loan
     * awaiting admin/committee approval. Throws LoanNotEligibleException with
     * a specific reason code or explicit rule checks.
     */
    @Transactional
    public LoanResponse applyForLoan(LoanApplicationRequest request) {
        Member member = memberRepository.findById(request.getMemberId())
                                        .orElseThrow(() -> new IllegalArgumentException("Member profile not found."));
        Term term = termRepository.findById(request.getTermId())
                                  .orElseThrow(() -> new IllegalArgumentException("Target term not found."));

        if (term.getStatus() != Term.TermStatus.ACTIVE) {
            throw new IllegalStateException("Cannot apply: The selected operational term rotation cycle is not active.");
        }
        if (member.getStatus() != Member.MemberStatus.ACTIVE) {
            throw new IllegalStateException("Application rejected: Member profile signature is currently inactive.");
        }
        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Requested loan amount must be a valid value greater than zero.");
        }

        // Enforce strict MLVPYC Individual Max Micro-Capital Hard Cap
        if (request.getAmount().compareTo(maxAmountPerTerm) > 0) {
            throw new IllegalArgumentException("Requested amount violates individual max cap constraints (Limit: ₹" + maxAmountPerTerm + ").");
        }

        // Enforce overlap rule: member already has an active or pending unresolved loan
        if (priorityService.hasActiveUnpaidLoan(member.getId())) {
            throw new IllegalStateException("Cannot process application: Member already holds an active or un-settled balance.");
        }

        // Pool availability check
        PoolSummaryResponse pool = getPoolSummary(term.getId());
        if (request.getAmount().compareTo(pool.getAvailable()) > 0) {
            throw new IllegalStateException("Insufficient capital: Requested amount exceeds current available club vault liquidity.");
        }

        // Apply MLVPYC Flat 5% Interest Rate Rule
        BigDecimal flatInterestMultiplier = new BigDecimal("0.05");
        BigDecimal calculatedInterest = request.getAmount().multiply(flatInterestMultiplier);

        Loan loan = Loan.builder()
                        .term(term)
                        .member(member)
                        .amount(request.getAmount())
                        .interestRate(flatInterestMultiplier)
                        .requestedDate(LocalDate.now())
                        .dueDate(LocalDate.now().plusMonths(termMonths))
                        .status(Loan.LoanStatus.PENDING)
                        .build();

        loan = loanRepository.save(loan);
        logAudit("LOAN", loan.getId(), "APPLIED", member.getId(),
                "Applied for loan principal of ₹" + request.getAmount() + " with dynamic cycle interest calculated at ₹" + calculatedInterest);

        return LoanResponse.from(loan);
    }

    @Transactional
    public LoanResponse approveLoan(Long loanId, Long approvedByMemberId) {
        Loan loan = getLoanOrThrow(loanId);
        loan.setStatus(Loan.LoanStatus.APPROVED);
        loan.setApprovedDate(LocalDate.now());
        loan = loanRepository.save(loan);
        logAudit("LOAN", loanId, "APPROVED", approvedByMemberId, "Loan approved");
        return LoanResponse.from(loan);
    }

    @Transactional
    public LoanResponse rejectLoan(Long loanId, Long rejectedByMemberId, String reason) {
        Loan loan = getLoanOrThrow(loanId);
        loan.setStatus(Loan.LoanStatus.REJECTED);
        loan.setRejectionReason(reason);
        loan = loanRepository.save(loan);
        logAudit("LOAN", loanId, "REJECTED", rejectedByMemberId, reason);
        return LoanResponse.from(loan);
    }

    @Transactional
    public LoanResponse recordRepayment(Long loanId, BigDecimal amount) {
        Loan loan = getLoanOrThrow(loanId);
        // Full-repayment check matching total repayment asset subtotal
        if (amount.compareTo(loan.totalRepayable()) >= 0) {
            loan.setStatus(Loan.LoanStatus.REPAID);
        }
        loan = loanRepository.save(loan);
        logAudit("LOAN", loanId, "REPAYMENT", loan.getMember().getId(),
                "Repaid vault balance amount of ₹" + amount);
        return LoanResponse.from(loan);
    }

    public PoolSummaryResponse getPoolSummary(Long termId) {
        BigDecimal totalCollected = contributionRepository.findByTermId(termId).stream()
                                                          .map(Contribution::getAmount)
                                                          .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalLent = loanRepository.findByTermId(termId).stream()
                                             .filter(l -> l.getStatus() == Loan.LoanStatus.APPROVED || l.getStatus() == Loan.LoanStatus.PENDING)
                                             .map(Loan::getAmount)
                                             .reduce(BigDecimal.ZERO, BigDecimal::add);

        return PoolSummaryResponse.builder()
                                  .termId(termId)
                                  .totalCollected(totalCollected)
                                  .totalLent(totalLent)
                                  .available(totalCollected.subtract(totalLent))
                                  .build();
    }

    /**
     * Ranks all pending applicants for a term by priority score (lowest = first).
     * Used by the admin UI to decide who to approve first when demand > pool.
     */
    public List<PriorityQueueEntry> getPriorityQueue(Long termId) {
        Term term = termRepository.findById(termId)
                                  .orElseThrow(() -> new IllegalArgumentException("Term not found"));

        Long previousTermId = findPreviousTermId(term);

        List<Loan> pendingLoans = loanRepository.findByTermIdAndStatus(termId, Loan.LoanStatus.PENDING);

        List<PriorityQueueEntry> ranked = pendingLoans.stream()
                                                      .map(loan -> {
                                                          Member m = loan.getMember();
                                                          double score = priorityService.computeScore(m, previousTermId);
                                                          String note = priorityService.borrowedInTerm(m.getId(), previousTermId == null ? -1L : previousTermId)
                                                                  ? "cooldown: borrowed last term"
                                                                  : (priorityService.isNewMember(m, 2) ? "new member: lower priority" : "standard priority");
                                                          return PriorityQueueEntry.builder()
                                                                                   .memberId(m.getId())
                                                                                   .memberName(m.getName())
                                                                                   .priorityScore(score)
                                                                                   .eligibilityNote(note)
                                                                                   .build();
                                                      })
                                                      .sorted(Comparator.comparingDouble(PriorityQueueEntry::getPriorityScore))
                                                      .collect(Collectors.toList());

        for (int i = 0; i < ranked.size(); i++) {
            ranked.get(i).setRank(i + 1);
        }
        return ranked;
    }

    private Long findPreviousTermId(Term currentTerm) {
        return termRepository.findAll().stream()
                             .filter(t -> t.getEndDate().isBefore(currentTerm.getStartDate()))
                             .max(Comparator.comparing(Term::getEndDate))
                             .map(Term::getId)
                             .orElse(null);
    }

    public List<LoanResponse> getLoansByTerm(Long termId) {
        return loanRepository.findByTermId(termId).stream()
                             .map(LoanResponse::from)
                             .collect(Collectors.toList());
    }

    private Loan getLoanOrThrow(Long loanId) {
        return loanRepository.findById(loanId)
                             .orElseThrow(() -> new IllegalArgumentException("Loan not found"));
    }

    private void logAudit(String entityType, Long entityId, String action, Long performedBy, String notes) {
        auditLogRepository.save(AuditLog.builder()
                                        .entityType(entityType)
                                        .entityId(entityId)
                                        .action(action)
                                        .performedByMemberId(performedBy)
                                        .timestamp(LocalDateTime.now())
                                        .notes(notes)
                                        .build());
    }
}