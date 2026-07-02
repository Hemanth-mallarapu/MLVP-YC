package com.mlvpyc.controller;

import com.mlvpyc.entity.Contribution;
import com.mlvpyc.repository.ContributionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/terms/{termId}/contributions")
@RequiredArgsConstructor
public class ContributionController {

    private final ContributionRepository contributionRepository;

    @PostMapping
    public Contribution add(@PathVariable Long termId, @RequestBody Contribution contribution) {
        return contributionRepository.save(contribution);
    }

    @GetMapping
    public List<Contribution> getByTerm(@PathVariable Long termId,
                                         @RequestParam(required = false) Long memberId) {
        if (memberId != null) {
            return contributionRepository.findByTermIdAndMemberId(termId, memberId);
        }
        return contributionRepository.findByTermId(termId);
    }
}
