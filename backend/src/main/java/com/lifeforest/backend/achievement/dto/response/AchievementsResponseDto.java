package com.lifeforest.backend.achievement.dto.response;

import java.util.List;

public record AchievementsResponseDto(
        Long userId,
        long unlockedCount,
        long totalCount,
        List<AchievementProgressDto> achievements
) {
}
