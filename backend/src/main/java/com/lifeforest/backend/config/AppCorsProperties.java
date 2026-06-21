package com.lifeforest.backend.config;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "app.cors")
public record AppCorsProperties(
        @NotEmpty List<String> allowedOrigins
) {
}
