package com.lifeforest.backend.habit.dto.response;

import com.lifeforest.backend.task.domain.RepeatDay;
import com.lifeforest.backend.task.domain.TaskCategory;
import java.util.List;
import java.util.Set;

public record TodayHabitResponseDto(
        Long taskId,
        Long routineId,
        String routineTitle,
        String title,
        String description,
        Integer duration,
        TaskCategory category,
        Set<RepeatDay> repeatDays,
        String preferredTime,
        boolean completedToday,
        int currentStreak,
        int weeklyCompletionCount,
        List<String> recentCompletedDates
) {
}
