package com.mlvpyc.controller;

import com.mlvpyc.dto.LoanApplicationRequest;
import com.mlvpyc.dto.LoanResponse;
import com.mlvpyc.dto.PriorityQueueEntry;
import com.mlvpyc.service.LoanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/loans")
@RequiredArgsConstructor
public class LoanController {

    private final LoanService loanService;

    @PostMapping("/apply")
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
}
