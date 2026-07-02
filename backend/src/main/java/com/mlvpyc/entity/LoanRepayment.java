package com.mlvpyc.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "loan_repayments")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LoanRepayment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "loan_id")
    private Loan loan;

    @Column(nullable = false)
    private Integer installmentNumber; // 1..6

    @Column(nullable = false)
    private BigDecimal amountDue;

    private BigDecimal amountPaid;

    private LocalDate paidDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RepaymentStatus status;

    public enum RepaymentStatus { PAID, LATE, PENDING }
}
