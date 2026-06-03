package com.lifeforest.backend.reflection.dto.response;

import java.time.Instant;

public record ReflectionResponseDto(
    Long id,
    Long userId,
    Long focusSessionId,
    String content,
    int focusLevel,
    String distractions,
    Instant createdAt,
    Instant updatedAt
) {}
