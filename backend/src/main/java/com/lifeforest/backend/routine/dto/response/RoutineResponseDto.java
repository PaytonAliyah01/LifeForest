package com.lifeforest.backend.routine.dto.response;

import java.time.Instant;

public record RoutineResponseDto(
    Long id,
    Long userId,
    String title,
    String description,
    boolean completed,
    Instant createdAt,
    Instant updatedAt
) {}