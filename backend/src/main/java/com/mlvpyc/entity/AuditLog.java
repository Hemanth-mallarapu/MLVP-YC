package com.mlvpyc.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_log")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String entityType; // "LOAN", "CONTRIBUTION", etc.

    @Column(nullable = false)
    private Long entityId;

    @Column(nullable = false)
    private String action; // "APPLIED", "APPROVED", "REJECTED", "REPAID"

    private Long performedByMemberId;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column(length = 1000)
    private String notes;
}
