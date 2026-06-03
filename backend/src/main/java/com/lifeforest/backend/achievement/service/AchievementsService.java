package com.lifeforest.backend.achievement.service;

import com.lifeforest.backend.achievement.dto.response.AchievementProgressDto;
import com.lifeforest.backend.achievement.dto.response.AchievementsResponseDto;
import com.lifeforest.backend.focussession.domain.FocusSession;
import com.lifeforest.backend.focussession.repository.FocusSessionRepository;
import com.lifeforest.backend.reflection.repository.ReflectionRepository;
import com.lifeforest.backend.routine.repository.RoutineRepository;
import com.lifeforest.backend.tree.repository.TreeRepository;
import com.lifeforest.backend.user.domain.User;
import com.lifeforest.backend.user.exception.UserNotFoundException;
import com.lifeforest.backend.user.repository.UserRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AchievementsService {

    private final UserRepository userRepository;
    private final RoutineRepository routineRepository;
    private final FocusSessionRepository focusSessionRepository;
    private final ReflectionRepository reflectionRepository;
    private final TreeRepository treeRepository;

    @Transactional(readOnly = true)
    public AchievementsResponseDto getAchievements(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        int routineCount = routineRepository.findAllByUserId(user.getId()).size();
        List<FocusSession> sessions = focusSessionRepository.findAllByUserId(user.getId());
        int completedSessionCount = (int) sessions.stream()
                .filter(FocusSession::isCompleted)
                .count();
        int completedFocusMinutes = sessions.stream()
                .filter(FocusSession::isCompleted)
                .map(FocusSession::getDuration)
                .filter(duration -> duration != null && duration > 0)
                .mapToInt(Integer::intValue)
                .sum();
        Instant weeklyThreshold = Instant.now().minus(7, ChronoUnit.DAYS);
        int weeklyFocusMinutes = sessions.stream()
                .filter(FocusSession::isCompleted)
                .filter(session -> session.getEndedAt() != null && !session.getEndedAt().isBefore(weeklyThreshold))
                .map(FocusSession::getDuration)
                .filter(duration -> duration != null && duration > 0)
                .mapToInt(Integer::intValue)
                .sum();
        int reflectionCount = reflectionRepository.findAllByUserId(user.getId()).size();
        int healthyTreeCount = (int) treeRepository.findAllByUserId(user.getId()).stream()
                .filter(tree -> !tree.isDamaged())
                .count();

        List<AchievementProgressDto> achievements = List.of(
                createAchievement(
                        "FIRST_ROUTINE",
                        "ROUTINES",
                        "First Steps",
                        "Create your first routine.",
                        routineCount,
                        1
                ),
                createAchievement(
                        "ROUTINE_GARDENER",
                        "ROUTINES",
                        "Routine Gardener",
                        "Build five routines for your week.",
                        routineCount,
                        5
                ),
                createAchievement(
                        "FIRST_SESSION",
                        "FOCUS",
                        "Focus Beginner",
                        "Finish your first focus session.",
                        completedSessionCount,
                        1
                ),
                createAchievement(
                        "TEN_SESSIONS",
                        "FOCUS",
                        "Deep Roots",
                        "Complete ten focus sessions.",
                        completedSessionCount,
                        10
                ),
                createAchievement(
                        "TWENTY_FIVE_SESSIONS",
                        "FOCUS",
                        "Focus Veteran",
                        "Complete twenty-five focus sessions.",
                        completedSessionCount,
                        25
                ),
                createAchievement(
                        "FIRST_TREE",
                        "FOREST",
                        "Forest Seed",
                        "Earn your first healthy tree.",
                        healthyTreeCount,
                        1
                ),
                createAchievement(
                        "TEN_TREES",
                        "FOREST",
                        "Forest Builder",
                        "Grow ten healthy trees.",
                        healthyTreeCount,
                        10
                ),
                createAchievement(
                        "TWENTY_FIVE_TREES",
                        "FOREST",
                        "Forest Keeper",
                        "Grow twenty-five healthy trees.",
                        healthyTreeCount,
                        25
                ),
                createAchievement(
                        "FIRST_REFLECTION",
                        "REFLECTION",
                        "Reflective Start",
                        "Save your first reflection.",
                        reflectionCount,
                        1
                ),
                createAchievement(
                        "FIVE_REFLECTIONS",
                        "REFLECTION",
                        "Mindful Reviewer",
                        "Write five reflections about your sessions.",
                        reflectionCount,
                        5
                ),
                createAchievement(
                        "TEN_REFLECTIONS",
                        "REFLECTION",
                        "Reflection Habit",
                        "Write ten reflections about your sessions.",
                        reflectionCount,
                        10
                ),
                createAchievement(
                        "THREE_HUNDRED_MINUTES",
                        "MINUTES",
                        "Long Haul",
                        "Reach 300 completed focus minutes.",
                        completedFocusMinutes,
                        300
                ),
                createAchievement(
                        "ONE_THOUSAND_MINUTES",
                        "MINUTES",
                        "Time Cultivator",
                        "Reach 1000 completed focus minutes.",
                        completedFocusMinutes,
                        1000
                ),
                createAchievement(
                        "WEEKLY_GOAL",
                        "MINUTES",
                        "Weekly Bloom",
                        "Reach 300 completed focus minutes in the last 7 days.",
                        weeklyFocusMinutes,
                        300
                )
        );

        long unlockedCount = achievements.stream()
                .filter(AchievementProgressDto::unlocked)
                .count();

        return new AchievementsResponseDto(
                user.getId(),
                unlockedCount,
                achievements.size(),
                achievements
        );
    }

    private AchievementProgressDto createAchievement(
            String code,
            String category,
            String title,
            String description,
            int currentValue,
            int targetValue
    ) {
        int cappedProgress = Math.min(currentValue, targetValue);
        int progressPercentage = targetValue <= 0
                ? 100
                : Math.min(100, (int) Math.round((cappedProgress * 100.0) / targetValue));

        return new AchievementProgressDto(
                code,
                category,
                title,
                description,
                currentValue,
                targetValue,
                currentValue >= targetValue,
                progressPercentage
        );
    }
}
