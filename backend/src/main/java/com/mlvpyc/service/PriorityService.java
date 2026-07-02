package com.mlvpyc.service;

import com.mlvpyc.entity.Loan;
import com.mlvpyc.entity.Member;
import com.mlvpyc.repository.LoanRepository;
import com.mlvpyc.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Computes sorting priority metrics for members.
 * Enforces the strict MLVPYC precedence logic:
 * 1. Debt status (unpaid/pending active accounts drop to the lowest tier)
 * 2. Total frequency drawn since 2017 (fewest draws prioritized)
 * 3. Total principal amount borrowed (lowest historic lifetime volume breaks ties)
 */
@Service
@RequiredArgsConstructor
public class PriorityService {

    private final LoanRepository loanRepository;
    private final MemberRepository memberRepository;

    /**
     * Computes a deterministic priority score by running a tiered rank sorting
     * across all members. Lower scores represent higher queue priority.
     */
    public double computeScore(Member member, Long previousTermId) {
        List<Member> allMembers = memberRepository.findAll();
        Long prevTermIdQuery = (previousTermId != null) ? previousTermId : -1L;

        // Build a pre-sorted list using our strict multi-tier rule engine
        List<Member> sortedQueue = allMembers.stream()
                                             .sorted(
                                                     Comparator.comparing((Member m) -> hasActiveUnpaidLoan(m.getId())) // Unpaid/pending debt drops to bottom
                                                               .thenComparing(m -> borrowedInTerm(m.getId(), prevTermIdQuery)) // Immediate past cycle users drop next
                                                               .thenComparingInt(this::getHistoricalBorrowCount)              // Fewest lifetime draws prioritized
                                                               .thenComparing(this::getHistoricalTotalPrincipal)               // Lowest cumulative principal breaks ties
                                             )
                                             .collect(Collectors.toList());

        // Return the clean sequential 1-based index rank of the requested member
        int rankIndex = sortedQueue.indexOf(member);
        return rankIndex != -1 ? (double) (rankIndex + 1) : 99.0;
    }

    public boolean borrowedInTerm(Long memberId, Long termId) {
        if (termId == null || termId == -1L) return false;
        return loanRepository.findByMemberId(memberId).stream()
                             .anyMatch(l -> l.getTerm().getId().equals(termId)
                                     && l.getStatus() != Loan.LoanStatus.REJECTED);
    }

    public boolean hasActiveUnpaidLoan(Long memberId) {
        return !loanRepository.findByMemberIdAndStatusIn(
                memberId,
                List.of(Loan.LoanStatus.PENDING, Loan.LoanStatus.APPROVED, Loan.LoanStatus.DEFAULTED)
        ).isEmpty();
    }

    public boolean isNewMember(Member member, int completedTermsThreshold) {
        long termsSinceJoin = java.time.temporal.ChronoUnit.MONTHS.between(
                member.getJoinDate(), java.time.LocalDate.now()) / 6;
        return termsSinceJoin < completedTermsThreshold;
    }

    // --- Helper Metrics Gatherers to support the Tiered Comparator ---

    private int getHistoricalBorrowCount(Member member) {
        return (int) loanRepository.findByMemberId(member.getId()).stream()
                                   .filter(l -> l.getStatus() == Loan.LoanStatus.REPAID || l.getStatus() == Loan.LoanStatus.APPROVED)
                                   .count();
    }

    private BigDecimal getHistoricalTotalPrincipal(Member member) {
        return loanRepository.findByMemberId(member.getId()).stream()
                             .filter(l -> l.getStatus() == Loan.LoanStatus.REPAID || l.getStatus() == Loan.LoanStatus.APPROVED)
                             .map(Loan::getAmount)
                             .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}