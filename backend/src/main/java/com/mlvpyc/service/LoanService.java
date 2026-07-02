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

    @Value("${app.loan.max-amount-per-term}")
    private BigDecimal maxAmountPerTerm;

    @Value("${app.loan.default-interest-rate}")
    private BigDecimal defaultInterestRate;

    @Value("${app.loan.term-months}")
    private int termMonths;

    /**
     * Applies hard eligibility rules and, if passed, creates a PENDING loan
     * awaiting admin/committee approval. Throws LoanNotEligibleException with
     * a specific reason code the frontend maps to a fallback message.
     */
    @Transactional
    public LoanResponse applyForLoan(LoanApplicationRequest request) {
        Member member = memberRepository.findById(request.getMemberId())
            .orElseThrow(() -> new IllegalArgumentException("Member not found"));
        Term term = termRepository.findById(request.getTermId())
            .orElseThrow(() -> new IllegalArgumentException("Term not found"));

        if (term.getStatus() != Term.TermStatus.ACTIVE) {
            throw new LoanNotEligibleException(LoanEligibilityReason.TERM_NOT_ACTIVE);
        }
        if (member.getStatus() != Member.MemberStatus.ACTIVE) {
            throw new LoanNotEligibleException(LoanEligibilityReason.MEMBER_INACTIVE);
        }
        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new LoanNotEligibleException(LoanEligibilityReason.INVALID_AMOUNT);
        }
        if (request.getAmount().compareTo(maxAmountPerTerm) > 0) {
            throw new LoanNotEligibleException(LoanEligibilityReason.EXCEEDS_TERM_LIMIT);
        }
        // Rule: already has an active loan (this or an earlier unpaid term)
        if (priorityService.hasActiveUnpaidLoan(member.getId())) {
            throw new LoanNotEligibleException(LoanEligibilityReason.ALREADY_HAS_ACTIVE_LOAN);
        }
        // Rule: pool availability
        PoolSummaryResponse pool = getPoolSummary(term.getId());
        if (request.getAmount().compareTo(pool.getAvailable()) > 0) {
            throw new LoanNotEligibleException(LoanEligibilityReason.EXCEEDS_AVAILABLE_POOL);
        }

        // Soft rules (cooldown / new member / lower priority) don't block application —
        // they affect approval ordering. The applicant is queued as PENDING either way,
        // and admin approves in priority order. This mirrors real-world flexibility
        // (e.g. nobody else applies this cycle) while still being transparent.

        Loan loan = Loan.builder()
            .term(term)
            .member(member)
            .amount(request.getAmount())
            .interestRate(defaultInterestRate)
            .requestedDate(LocalDate.now())
            .dueDate(LocalDate.now().plusMonths(termMonths))
            .status(Loan.LoanStatus.PENDING)
            .build();

        loan = loanRepository.save(loan);
        logAudit("LOAN", loan.getId(), "APPLIED", member.getId(),
            "Applied for ₹" + request.getAmount());

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
        // Simplified: full-repayment check. A production version would track
        // per-installment repayments in loan_repayments and sum them.
        if (amount.compareTo(loan.totalRepayable()) >= 0) {
            loan.setStatus(Loan.LoanStatus.REPAID);
        }
        loan = loanRepository.save(loan);
        logAudit("LOAN", loanId, "REPAYMENT", loan.getMember().getId(),
            "Repaid ₹" + amount);
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
