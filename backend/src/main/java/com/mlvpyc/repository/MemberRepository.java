package com.mlvpyc.repository;

import com.mlvpyc.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MemberRepository extends JpaRepository<Member, Long> {
    Member findByPhone(String phone);
}
