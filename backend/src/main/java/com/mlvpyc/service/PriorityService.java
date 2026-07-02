package com.mlvpyc.service;

import com.mlvpyc.entity.Loan;
import com.mlvpyc.entity.Member;
import com.mlvpyc.repository.LoanRepository;
import com.mlvpyc.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Computes a priority score per member so loans are offered to those who've
 * borrowed the least (amount + frequency) first. Lower score = higher priority.
 *
 * score = 0.5 * (memberTotalBorrowed / groupMaxBorrowed)
 *       + 0.4 * (memberTimesBorrowed / groupMaxTimesBorrowed)
 *       + 0.1 * (borrowedInImmediatelyPrecedingTerm ? 1 : 0)
 */
@Service
@RequiredArgsConstructor
public class PriorityService {

    private static final double WEIGHT_AMOUNT = 0.5;
    private static final double WEIGHT_FREQUENCY = 0.4;
    private static final double WEIGHT_COOLDOWN = 0.1;

    private final LoanRepository loanRepository;
    private final MemberRepository memberRepository;

    public double computeScore(Member member, Long previousTermId) {
        List<Loan> allLoans = loanRepository.findByMemberId(member.getId())
            .stream()
            .filter(l -> l.getStatus() != Loan.LoanStatus.REJECTED)
            .collect(Collectors.toList());

        BigDecimal memberTotalBorrowed = allLoans.stream()
            .map(Loan::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        int memberTimesBorrowed = allLoans.size();

        boolean borrowedLastTerm = previousTermId != null && allLoans.stream()
            .anyMatch(l -> l.getTerm().getId().equals(previousTermId));

        Map<Long, BigDecimal> allMembersTotals = groupTotalsByMember();
        Map<Long, Integer> allMembersCounts = groupCountsByMember();

        BigDecimal groupMaxBorrowed = allMembersTotals.values().stream()
            .max(BigDecimal::compareTo).orElse(BigDecimal.ONE);
        int groupMaxTimes = allMembersCounts.values().stream()
            .max(Integer::compareTo).orElse(1);

        // avoid divide-by-zero
        double amountRatio = groupMaxBorrowed.compareTo(BigDecimal.ZERO) == 0
            ? 0
            : memberTotalBorrowed.divide(groupMaxBorrowed, 6, java.math.RoundingMode.HALF_UP).doubleValue();

        double freqRatio = groupMaxTimes == 0
            ? 0
            : (double) memberTimesBorrowed / groupMaxTimes;

        double cooldown = borrowedLastTerm ? 1.0 : 0.0;

        return WEIGHT_AMOUNT * amountRatio
             + WEIGHT_FREQUENCY * freqRatio
             + WEIGHT_COOLDOWN * cooldown;
    }

    public boolean borrowedInTerm(Long memberId, Long termId) {
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
        // Simplification: count how many terms this member has fully participated in
        // via loan or contribution history. In a full implementation this would query
        // contributions grouped by term since join date.
        long termsSinceJoin = java.time.temporal.ChronoUnit.MONTHS.between(
            member.getJoinDate(), java.time.LocalDate.now()) / 6;
        return termsSinceJoin < completedTermsThreshold;
    }

    private Map<Long, BigDecimal> groupTotalsByMember() {
        return loanRepository.findAll().stream()
            .filter(l -> l.getStatus() != Loan.LoanStatus.REJECTED)
            .collect(Collectors.groupingBy(
                l -> l.getMember().getId(),
                Collectors.reducing(BigDecimal.ZERO, Loan::getAmount, BigDecimal::add)
            ));
    }

    private Map<Long, Integer> groupCountsByMember() {
        return loanRepository.findAll().stream()
            .filter(l -> l.getStatus() != Loan.LoanStatus.REJECTED)
            .collect(Collectors.groupingBy(
                l -> l.getMember().getId(),
                Collectors.reducing(0, l -> 1, Integer::sum)
            ));
    }
}
