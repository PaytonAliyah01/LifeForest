package com.lifeforest.backend.common.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Map;
import org.junit.jupiter.api.Test;

class JwtServiceTest {

    private final JwtService jwtService = new JwtService(
            new JwtProperties("LifeForestSuperSecureJwtSecret2026", 3_600_000)
    );

    @Test
    void generateTokenIncludesSubjectAndClaims() {
        String token = jwtService.generateToken("elienne@example.com", Map.of("role", "USER"));

        assertEquals("elienne@example.com", jwtService.extractSubject(token));
        assertEquals("USER", jwtService.extractAllClaims(token).get("role", String.class));
        assertTrue(jwtService.isTokenValid(token));
    }

    @Test
    void invalidTokenIsReportedAsInvalid() {
        assertFalse(jwtService.isTokenValid("not-a-real-jwt"));
    }
}
