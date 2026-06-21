package com.lifeforest.backend.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

class CorsConfigTest {

    @Test
    void corsConfigurationSourceUsesConfiguredOriginsAndHeaders() {
        CorsConfig corsConfig = new CorsConfig();
        AppCorsProperties properties = new AppCorsProperties(List.of("http://localhost:8081", "http://127.0.0.1:8081"));

        CorsConfigurationSource source = corsConfig.corsConfigurationSource(properties);
        CorsConfiguration configuration = source.getCorsConfiguration(new MockHttpServletRequest("GET", "/api/test"));

        assertEquals(properties.allowedOrigins(), configuration.getAllowedOrigins());
        assertTrue(configuration.getAllowedMethods().contains("GET"));
        assertTrue(configuration.getAllowedHeaders().contains("Authorization"));
        assertTrue(configuration.getExposedHeaders().contains("Authorization"));
        assertTrue(Boolean.TRUE.equals(configuration.getAllowCredentials()));
        assertEquals(3600L, configuration.getMaxAge());
    }
}
