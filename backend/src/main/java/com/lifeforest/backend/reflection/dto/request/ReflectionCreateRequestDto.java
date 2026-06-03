package com.lifeforest.backend.reflection.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ReflectionCreateRequestDto(
    @NotNull(message = "User ID is required")
    Long userId,

    @NotNull(message = "Focus session ID is required")
    Long focusSessionId,

    @NotBlank(message = "Reflection content is required")
    @Size(max = 2000, message = "Reflection content must be less than 2000 characters")
    String content,

    @NotNull(message = "Focus level is required")
    @Min(value = 1, message = "Focus level must be between 1 and 5")
    @Max(value = 5, message = "Focus level must be between 1 and 5")
    Integer focusLevel,

    @Size(max = 1000, message = "Distraction notes must be less than 1000 characters")
    String distractions
) {}
