package com.mlvpyc.controller;

import com.mlvpyc.service.MemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/public") // Exposed publicly away from strict authenticated route blocks
@CrossOrigin(origins = "*")
@RequiredArgsConstructor // ◄ Look right here!
public class PasswordResetController {

    private final MemberService memberService;



    @PostMapping("/forgot-password/generate-otp")
    public ResponseEntity<?> sendRecoveryOtp(@RequestBody Map<String, String> payload) {
        try {
            memberService.generateAndSendRecoveryOtp(payload.get("email"));
            return ResponseEntity.ok(Map.of("message", "OTP dispatched successfully to your registry mailbox."));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        }
    }

    @PostMapping("/forgot-password/verify-and-reset")
    public ResponseEntity<?> processReset(@RequestBody Map<String, String> payload) {
        try {
            memberService.verifyOtpAndResetPassword(
                    payload.get("email"),
                    payload.get("otp"),
                    payload.get("password")
            );
            return ResponseEntity.ok(Map.of("message", "Credentials updated across ledger tables."));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        }
    }
}
