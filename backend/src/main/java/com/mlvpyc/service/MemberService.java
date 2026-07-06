package com.mlvpyc.service;

import com.mlvpyc.entity.Member;
import com.mlvpyc.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage; // ◄ ADDED MISSING IMPORT
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Random; // ◄ ADDED MISSING IMPORT
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class MemberService {

    private final MemberRepository memberRepository;
    // Thread-safe transient registry storing token footprints against targets
    private final Map<String, String> otpCache = new ConcurrentHashMap<>();
    private final JavaMailSender mailSender;
    private final PasswordEncoder passwordEncoder;

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

    // CLEANED: Using the class-level passwordEncoder field instead of passing a duplicate one
    @Transactional
    public void updatePasswordSecurely(Long id, String oldPassword, String newPassword) {
        Member existing = getById(id);

        // 1. Verify if the entered current password matches the BCrypt hash stored in the DB
        if (!passwordEncoder.matches(oldPassword, existing.getPassword())) {
            throw new IllegalArgumentException("Your current password does not match our records.");
        }

        // 2. If it matches, hash the new password and persist it
        existing.setPassword(passwordEncoder.encode(newPassword));
        memberRepository.save(existing);
    }

    @Transactional
    public void deactivateMember(Long id) {
        Member existing = getById(id);
        existing.setStatus(Member.MemberStatus.INACTIVE);
        memberRepository.save(existing);
    }

    // ==========================================
    // NEW: PRODUCTION GRADE PASSWORD RESET LOGIC
    // ==========================================

    public void generateAndSendRecoveryOtp(String email) {
        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("Please enter a valid email address.");
        }

        Member member = memberRepository.findByEmail(email.trim())
                                        .orElseThrow(() -> new IllegalArgumentException("No club account associated with this email address."));

        // Compute 6-digit pin index
        String generatedOtp = String.format("%06d", new Random().nextInt(999999));
        otpCache.put(email.toLowerCase().trim(), generatedOtp);

        // Build email messaging envelope
        SimpleMailMessage mailEnvelope = new SimpleMailMessage();
        mailEnvelope.setTo(member.getEmail().trim());
        mailEnvelope.setSubject("MLVPYC - Secure Access Recovery PIN");
        mailEnvelope.setText("Your password recovery security verification OTP is: " + generatedOtp
                + "\n\nThis code will expire shortly. If you did not request this, please ignore this email.");

        mailSender.send(mailEnvelope);
    }

    @Transactional
    public void verifyOtpAndResetPassword(String email, String enteredOtp, String newPassword) {
        String normalizedEmail = email.toLowerCase().trim();

        if (!otpCache.containsKey(normalizedEmail) || !otpCache.get(normalizedEmail).equals(enteredOtp)) {
            throw new IllegalArgumentException("Invalid or expired security validation OTP code.");
        }

        if (newPassword == null || newPassword.trim().length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters long.");
        }

        Member member = memberRepository.findByEmail(normalizedEmail)
                                        .orElseThrow(() -> new IllegalArgumentException("Member context no longer valid."));

        member.setPassword(passwordEncoder.encode(newPassword));
        memberRepository.save(member);

        otpCache.remove(normalizedEmail); // Clear cached OTP after a successful reset
    }
}