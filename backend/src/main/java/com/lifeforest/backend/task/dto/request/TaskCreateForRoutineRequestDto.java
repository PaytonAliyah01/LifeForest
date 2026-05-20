package com.lifeforest.backend.task.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public record TaskCreateForRoutineRequestDto(
    @NotNull(message = "Routine ID is required")
    Long routineId,

    @Valid
    TaskCreateRequestDto task
) {}
