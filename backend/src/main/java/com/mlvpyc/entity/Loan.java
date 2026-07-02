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

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(nullable = false)
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

    public BigDecimal totalRepayable() {
        BigDecimal interest = amount.multiply(interestRate).divide(BigDecimal.valueOf(100));
        return amount.add(interest);
    }

    public enum LoanStatus { PENDING, APPROVED, REJECTED, REPAID, DEFAULTED }
}
