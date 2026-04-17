package com.lifeforest.backend.user.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UserCreateRequestDto(
    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    String email,

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters long")
    String password,

    @NotBlank(message = "Display name is required")
    @Size(max = 100, message = "Display name must be less than 100 characters")
    String displayName
) {}
