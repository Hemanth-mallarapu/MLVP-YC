package com.mlvpyc.controller;

import com.mlvpyc.dto.LoanApplicationRequest;
import com.mlvpyc.dto.LoanResponse;
import com.mlvpyc.dto.PriorityQueueEntry;
import com.mlvpyc.service.LoanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/loans")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // Allows seamless API calls from your local React Vite server
public class LoanController {

    private final LoanService loanService;

    @PostMapping("/apply")
    @ResponseStatus(HttpStatus.CREATED)
    public LoanResponse apply(@Valid @RequestBody LoanApplicationRequest request) {
        return loanService.applyForLoan(request);
    }

    @GetMapping
    public List<LoanResponse> getByTerm(@RequestParam Long termId) {
        return loanService.getLoansByTerm(termId);
    }

    @GetMapping("/priority-queue")
    public List<PriorityQueueEntry> priorityQueue(@RequestParam Long termId) {
        return loanService.getPriorityQueue(termId);
    }

    @PutMapping("/{id}/approve")
    public LoanResponse approve(@PathVariable Long id, @RequestParam Long approvedBy) {
        return loanService.approveLoan(id, approvedBy);
    }

    @PutMapping("/{id}/reject")
    public LoanResponse reject(@PathVariable Long id, @RequestParam Long rejectedBy,
                               @RequestBody Map<String, String> body) {
        return loanService.rejectLoan(id, rejectedBy, body.getOrDefault("reason", "Not specified"));
    }

    @PostMapping("/{id}/repay")
    public LoanResponse repay(@PathVariable Long id, @RequestBody Map<String, BigDecimal> body) {
        return loanService.recordRepayment(id, body.get("amount"));
    }

    /**
     * Exception Handler Matrix.
     * Catches business policy failures thrown by the service layer (e.g., amount > ₹2,00,000
     * or existing outstanding debt balances) and maps them cleanly into structured JSON
     * objects so the frontend's FallbackNotice layout displays the exact restriction smoothly.
     */
    @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class})
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ResponseBody
    public Map<String, String> handleBusinessRuleViolations(RuntimeException exception) {
        return Map.of(
                "code", "CREDIT_POLICY_VIOLATION",
                "message", exception.getMessage()
        );
    }
}