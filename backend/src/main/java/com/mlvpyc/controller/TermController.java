package com.mlvpyc.controller;

import com.mlvpyc.dto.PoolSummaryResponse;
import com.mlvpyc.entity.Term;
import com.mlvpyc.repository.TermRepository;
import com.mlvpyc.service.LoanService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/terms")
@RequiredArgsConstructor
public class TermController {

    private final TermRepository termRepository;
    private final LoanService loanService;

    @PostMapping
    public Term create(@RequestBody Term term) {
        term.setStatus(Term.TermStatus.ACTIVE);
        return termRepository.save(term);
    }

    @GetMapping("/{id}")
    public Term get(@PathVariable Long id) {
        return termRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Term not found"));
    }

    @GetMapping("/active")
    public Term getActive() {
        return termRepository.findFirstByStatusOrderByStartDateDesc(Term.TermStatus.ACTIVE)
            .orElseThrow(() -> new IllegalArgumentException("No active term found"));
    }

    @GetMapping("/{id}/pool")
    public PoolSummaryResponse pool(@PathVariable Long id) {
        return loanService.getPoolSummary(id);
    }
}
