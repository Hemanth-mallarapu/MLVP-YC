package com.mlvpyc.repository;

import com.mlvpyc.entity.Loan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LoanRepository extends JpaRepository<Loan, Long> {
    List<Loan> findByTermId(Long termId);
    List<Loan> findByMemberId(Long memberId);
    List<Loan> findByMemberIdAndStatusIn(Long memberId, List<Loan.LoanStatus> statuses);
    List<Loan> findByTermIdAndStatus(Long termId, Loan.LoanStatus status);
}
