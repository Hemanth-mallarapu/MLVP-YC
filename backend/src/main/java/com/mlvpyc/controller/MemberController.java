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

    /*// NEW: Handles secure password reset changes initiated directly from frontend components
    @PutMapping("/{id}/password")
    public ResponseEntity<?> resetPassword(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String newPassword = payload.get("password");

        if (newPassword == null || newPassword.trim().length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("message", "Password must be at least 6 characters long."));
        }

        // Encrypt plain string password securely before calling service to persist changes
        String hashedPassword = passwordEncoder.encode(newPassword);
        memberService.updatePassword(id, hashedPassword);

        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }*/

    @PutMapping("/{id}/password")
    public ResponseEntity<?> resetPassword(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String oldPassword = payload.get("oldPassword");
        String newPassword = payload.get("password");

        if (newPassword == null || newPassword.trim().length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("message", "New password must be at least 6 characters long."));
        }

        try {
            // Pass both the plain old password text and the new password string to the service
            memberService.updatePasswordSecurely(id, oldPassword, newPassword, passwordEncoder);
            return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.message()));
        }
    }

    // NEW: Soft-delete endpoint that inactivates a member instead of dropping the database row
    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        memberService.deactivateMember(id);
        return ResponseEntity.ok("Member status changed to INACTIVE successfully.");
    }
}
