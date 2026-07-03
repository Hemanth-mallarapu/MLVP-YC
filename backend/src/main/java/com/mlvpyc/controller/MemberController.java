package com.mlvpyc.controller;

import com.mlvpyc.entity.Member;
import com.mlvpyc.service.MemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/members")
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;

    @PostMapping
    public Member create(@RequestBody Member member) {
        return memberService.create(member);
    }

    @GetMapping
    public List<Member> getAll() {
        return memberService.getAll();
    }

    @GetMapping("/{id}")
    public Member get(@PathVariable Long id) {
        return memberService.getById(id);
    }

    @PutMapping("/{id}")
    public Member update(@PathVariable Long id, @RequestBody Member updates) {
        return memberService.update(id, updates);
    }

    // NEW: Soft-delete endpoint that inactivates a member instead of dropping the database row
    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        memberService.deactivateMember(id);
        return ResponseEntity.ok("Member status changed to INACTIVE successfully.");
    }
}
