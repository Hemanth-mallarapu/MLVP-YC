package com.mlvpyc.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class LoanApplicationRequest {
    @NotNull
    private Long memberId;

    @NotNull
    private Long termId;

    @NotNull
    @Positive
    private BigDecimal amount;
}
