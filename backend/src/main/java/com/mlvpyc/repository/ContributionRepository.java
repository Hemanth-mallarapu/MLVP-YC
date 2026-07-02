package com.mlvpyc.repository;

import com.mlvpyc.entity.Contribution;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ContributionRepository extends JpaRepository<Contribution, Long> {
    List<Contribution> findByTermId(Long termId);
    List<Contribution> findByTermIdAndMemberId(Long termId, Long memberId);
}
