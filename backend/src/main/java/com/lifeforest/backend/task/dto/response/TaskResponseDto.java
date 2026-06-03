package com.lifeforest.backend.task.dto.response;

import com.lifeforest.backend.task.domain.TaskCategory;
import com.lifeforest.backend.task.domain.RepeatDay;
import com.lifeforest.backend.task.domain.TaskType;
import java.time.Instant;
import java.util.Set;

public record TaskResponseDto(
    Long id,
    Long routineId,
    String title,
    String description,
    Integer duration,
    TaskCategory category,
    TaskType taskType,
    Set<RepeatDay> repeatDays,
    String preferredTime,
    boolean completed,
    Instant createdAt,
    Instant updatedAt
) {}
