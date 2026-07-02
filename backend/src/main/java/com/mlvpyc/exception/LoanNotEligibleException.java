package com.mlvpyc.exception;

import lombok.Getter;

@Getter
public class LoanNotEligibleException extends RuntimeException {

    private final LoanEligibilityReason reason;

    public LoanNotEligibleException(LoanEligibilityReason reason) {
        super(reason.getMessage());
        this.reason = reason;
    }
}
