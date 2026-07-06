package com.mlvpyc.controller;

import com.mlvpyc.entity.Member;
import com.mlvpyc.service.MemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/members")
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;
    private final PasswordEncoder passwordEncoder; // Added for secure encryption

    @PostMapping
    public Member create(@RequestBody Member member) {
        // Enforce hashing raw passwords if they are supplied via admin creation form
        if (member.getPassword() != null) {
            member.setPassword(passwordEncoder.encode(member.getPassword()));
        }
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

    @PutMapping("/{id}/password")
    public ResponseEntity<?> resetPassword(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String oldPassword = payload.get("oldPassword");
        String newPassword = payload.get("password");

        if (newPassword == null || newPassword.trim().length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("message", "New password must be at least 6 characters long."));
        }

        try {
            // FIXED: Removed the 4th parameter since MemberService handles its own encoder dependency
            memberService.updatePasswordSecurely(id, oldPassword, newPassword);
            return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // NEW: Soft-delete endpoint that inactivates a member instead of dropping the database row
    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        memberService.deactivateMember(id);
        return ResponseEntity.ok("Member status changed to INACTIVE successfully.");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> payload) {
        String identifier = payload.get("identifier");
        String password = payload.get("password");

        if (identifier == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Missing credentials."));
        }

        // 1. Find user by email or phone via your service layers
        java.util.List<Member> members = memberService.getAll();
        Member matchedUser = members.stream()
                                    .filter(m -> identifier.equalsIgnoreCase(m.getEmail()) || identifier.equals(m.getPhone()))
                                    .findFirst()
                                    .orElse(null);

        if (matchedUser == null) {
            return ResponseEntity.status(404).body(Map.of("message", "User not found. Please register or check details."));
        }

        // 2. CRITICAL MATCH GATE: This strictly checks against the PostgreSQL BCrypt hash!
        // It will automatically reject your old password since the hash changed!
        if (!passwordEncoder.matches(password, matchedUser.getPassword())) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid credentials. Incorrect password."));
        }

        // 3. Return the authenticated user profile safely if password matches
        return ResponseEntity.ok(matchedUser);
    }
}