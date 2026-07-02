package com.mlvpyc.repository;

import com.mlvpyc.entity.Term;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TermRepository extends JpaRepository<Term, Long> {
    Optional<Term> findFirstByStatusOrderByStartDateDesc(Term.TermStatus status);
}
