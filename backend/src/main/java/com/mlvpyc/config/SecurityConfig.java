package com.mlvpyc.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

/**
 * NOTE: This is intentionally permissive to get the app running end-to-end first.
 * Before going live with real money data, wire in a JwtAuthFilter here that:
 *  1. Validates the JWT on every request
 *  2. Sets the authenticated member in the SecurityContext
 *  3. Restricts /api/loans/.../approve and /reject to ADMIN role only
 */
@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
        return http.build();
    }
}
