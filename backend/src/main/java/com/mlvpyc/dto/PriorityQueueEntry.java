package com.mlvpyc.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PriorityQueueEntry {
    private Long memberId;
    private String memberName;
    private double priorityScore; // lower = higher priority
    private int rank;
    private String eligibilityNote; // e.g. "cooldown - last term borrower"
}
