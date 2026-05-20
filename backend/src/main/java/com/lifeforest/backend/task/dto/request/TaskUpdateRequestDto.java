package com.lifeforest.backend.task.dto.request;

import com.lifeforest.backend.task.domain.TaskCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record TaskUpdateRequestDto(
    @NotBlank(message = "Title is required")
    @Size(max = 150, message = "Title must be less than 150 characters")
    String title,

    @Size(max = 500, message = "Description must be less than 500 characters")
    String description,

    @PositiveOrZero(message = "Duration must be 0 or greater")
    Integer duration,

    @NotNull(message = "Category is required")
    TaskCategory category,

    boolean completed
) {}
