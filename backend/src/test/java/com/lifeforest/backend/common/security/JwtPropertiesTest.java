package com.lifeforest.backend.common.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

class JwtPropertiesTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void validPropertiesPassValidation() {
        JwtProperties properties = new JwtProperties("LifeForestSuperSecureJwtSecret2026", 3_600_000);

        assertTrue(validator.validate(properties).isEmpty());
        assertEquals(3_600_000, properties.expirationMs());
    }

    @Test
    void shortSecretFailsValidation() {
        JwtProperties properties = new JwtProperties("short-secret", 3_600_000);

        assertFalse(validator.validate(properties).isEmpty());
    }
}
