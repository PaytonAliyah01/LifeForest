package com.lifeforest.backend.focussession.dto.request;

public record FocusSessionStartRequestDto(
        Long userId,
        Long taskId
) {
}
