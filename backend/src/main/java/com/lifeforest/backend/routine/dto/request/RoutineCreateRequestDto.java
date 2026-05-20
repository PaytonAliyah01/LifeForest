package com.lifeforest.backend.routine.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RoutineCreateRequestDto(
    @NotBlank(message = "Title is required")
    @Size(max = 150, message = "Title must be less than 150 characters")
    String title,

    @Size(max = 500, message = "Description must be less than 500 characters")
    String description
) {}