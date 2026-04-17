package com.lifeforest.backend.auth.dto;

public record LoginResponseDto(
    String token,
    String tokenType
) {}