package com.lifeforest.backend.routine.dto.request;

import jakarta.validation.constraints.NotNull;

public record RoutineCreateForUserRequestDto(
    @NotNull(message = "User ID is required")
    Long userId,

    RoutineCreateRequestDto routine
) {}