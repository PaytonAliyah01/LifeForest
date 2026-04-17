package com.lifeforest.backend.user.dto.response;

import com.lifeforest.backend.user.domain.UserRole;
import java.time.Instant;

public record UserResponseDto(
    Long id,
    String email,
    String displayName,
    UserRole role,
    Instant createdAt
) {
}