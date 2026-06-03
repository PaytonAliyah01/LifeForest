package com.lifeforest.backend.analytics.dto.response;

public record AnalyticsResponseDto(
        Long userId,
        long totalSessions,
        long completedSessions,
        long interruptedSessions,
        double completionRate,
        int totalFocusMinutes,
        int completedFocusMinutes,
        int weeklyFocusMinutes,
        int estimatedTaskMinutes,
        int actualTaskMinutes,
        double estimationAccuracyPercentage,
        double averageSessionMinutes,
        double averageFocusLevel,
        long reflectionsCount,
        long treesGrown,
        long completedTrees,
        long damagedTrees,
        double productivityScore
) {
}
