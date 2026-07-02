package com.mlvpyc.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(LoanNotEligibleException.class)
    public ResponseEntity<Map<String, Object>> handleLoanNotEligible(LoanNotEligibleException ex) {
        Map<String, Object> body = Map.of(
            "errorCode", ex.getReason().name(),
            "message", ex.getMessage(),
            "timestamp", LocalDateTime.now().toString()
        );
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
        Map<String, Object> body = Map.of(
            "errorCode", "BAD_REQUEST",
            "message", ex.getMessage(),
            "timestamp", LocalDateTime.now().toString()
        );
        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneric(Exception ex) {
        Map<String, Object> body = Map.of(
            "errorCode", "INTERNAL_ERROR",
            "message", "Something went wrong. Please try again or contact the admin.",
            "timestamp", LocalDateTime.now().toString()
        );
        return ResponseEntity.internalServerError().body(body);
    }
}
