package com.lifeforest.backend.user.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UserUpdateRequestDto(
    @NotBlank(message = "Display name is required")
    @Size(max = 100, message = "Display name must be less than 100 characters")
    String displayName
) {}