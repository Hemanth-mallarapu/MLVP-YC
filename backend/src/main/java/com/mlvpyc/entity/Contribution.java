package com.mlvpyc.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "contributions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Contribution {

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
    private Integer monthNumber; // 1..6 within the term

    @Column(nullable = false)
    private BigDecimal amount;

    private LocalDateTime paidDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ContributionStatus status;

    public enum ContributionStatus { PAID, LATE, PENDING }
}
