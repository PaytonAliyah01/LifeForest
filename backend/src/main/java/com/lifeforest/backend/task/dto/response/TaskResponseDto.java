package com.lifeforest.backend.task.dto.response;

import com.lifeforest.backend.task.domain.TaskCategory;
import java.time.Instant;

public record TaskResponseDto(
    Long id,
    Long routineId,
    String title,
    String description,
    Integer duration,
    TaskCategory category,
    boolean completed,
    Instant createdAt,
    Instant updatedAt
) {}
