package com.mlvpyc.repository;

import com.mlvpyc.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MemberRepository extends JpaRepository<Member, Long> {
    Member findByPhone(String phone);

    // Finds a member by phone only if they are active (Useful for login checks)
    Optional<Member> findByPhoneAndStatus(String phone, Member.MemberStatus status);

    // Returns only active users for regular application views
    List<Member> findByStatus(Member.MemberStatus status);

    // ADD THIS FOR THE OTP FLOW LOOKUP
    Optional<Member> findByEmail(String email);
}
