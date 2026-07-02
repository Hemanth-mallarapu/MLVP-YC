package com.mlvpyc.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class PoolSummaryResponse {
    private Long termId;
    private BigDecimal totalCollected;
    private BigDecimal totalLent;
    private BigDecimal available;
}
