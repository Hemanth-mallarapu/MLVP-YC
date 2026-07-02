package com.mlvpyc.service;

import com.mlvpyc.entity.Member;
import com.mlvpyc.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MemberService {

    private final MemberRepository memberRepository;

    @Transactional
    public Member create(Member member) {
        if (member.getJoinDate() == null) member.setJoinDate(LocalDate.now());
        if (member.getStatus() == null) member.setStatus(Member.MemberStatus.ACTIVE);
        if (member.getRole() == null) member.setRole(Member.MemberRole.MEMBER);
        return memberRepository.save(member);
    }

    public List<Member> getAll() {
        return memberRepository.findAll();
    }

    public Member getById(Long id) {
        return memberRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Member not found"));
    }

    @Transactional
    public Member update(Long id, Member updates) {
        Member existing = getById(id);

        if (updates.getName() != null) existing.setName(updates.getName());
        if (updates.getPhone() != null) existing.setPhone(updates.getPhone());
        if (updates.getEmail() != null) existing.setEmail(updates.getEmail());
        if (updates.getStatus() != null) existing.setStatus(updates.getStatus());
        if (updates.getRole() != null) existing.setRole(updates.getRole());

        return memberRepository.save(existing);
    }
}
