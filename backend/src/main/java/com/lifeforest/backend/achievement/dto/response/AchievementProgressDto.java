package com.lifeforest.backend.achievement.dto.response;

public record AchievementProgressDto(
        String code,
        String category,
        String title,
        String description,
        int currentValue,
        int targetValue,
        boolean unlocked,
        int progressPercentage
) {
}
