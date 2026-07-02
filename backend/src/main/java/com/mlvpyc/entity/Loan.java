package com.mlvpyc.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "loans")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Loan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "term_id")
    private Term term;

    @ManyToOne(optional = false)
    @JoinColumn(name = "member_id")
    private Member member;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, precision = 5, scale = 4)
    private BigDecimal interestRate;

    @Column(nullable = false)
    private LocalDate requestedDate;

    private LocalDate approvedDate;

    @Column(nullable = false)
    private LocalDate dueDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LoanStatus status;

    private String rejectionReason;

    /**
     * Corrected MLVPYC Interest Calculation.
     * Evaluates the flat cycle interest fee directly using the interest rate
     * factor (0.05) as a direct multiplier, bypassing the old percentage division rule.
     */
    public BigDecimal totalRepayable() {
        if (amount == null) return BigDecimal.ZERO;
        BigDecimal rate = interestRate != null ? interestRate : new BigDecimal("0.05");
        BigDecimal interest = amount.multiply(rate);
        return amount.add(interest);
    }

    public enum LoanStatus { PENDING, APPROVED, REJECTED, REPAID, DEFAULTED }
}