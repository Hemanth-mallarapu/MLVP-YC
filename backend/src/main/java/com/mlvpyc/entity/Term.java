package com.mlvpyc.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "terms")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Term {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String termName; // e.g. "Feb-Aug 2026"

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate endDate;

    @Column(nullable = false)
    private BigDecimal monthlyContribution;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TermStatus status;

    public enum TermStatus { ACTIVE, CLOSED }
}
