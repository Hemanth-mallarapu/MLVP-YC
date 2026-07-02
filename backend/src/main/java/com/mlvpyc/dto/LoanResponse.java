package com.mlvpyc.dto;

import com.mlvpyc.entity.Loan;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
public class LoanResponse {
    private Long id;
    private Long memberId;
    private String memberName;
    private Long termId;
    private BigDecimal amount;
    private BigDecimal interestRate;
    private BigDecimal totalRepayable;
    private String status;
    private LocalDate requestedDate;
    private LocalDate dueDate;

    public static LoanResponse from(Loan loan) {
        return LoanResponse.builder()
            .id(loan.getId())
            .memberId(loan.getMember().getId())
            .memberName(loan.getMember().getName())
            .termId(loan.getTerm().getId())
            .amount(loan.getAmount())
            .interestRate(loan.getInterestRate())
            .totalRepayable(loan.totalRepayable())
            .status(loan.getStatus().name())
            .requestedDate(loan.getRequestedDate())
            .dueDate(loan.getDueDate())
            .build();
    }
}
