package com.lifeforest.backend.analytics.service;

import com.lifeforest.backend.analytics.dto.response.AnalyticsResponseDto;
import com.lifeforest.backend.focussession.domain.FocusSession;
import com.lifeforest.backend.focussession.repository.FocusSessionRepository;
import com.lifeforest.backend.reflection.domain.Reflection;
import com.lifeforest.backend.reflection.repository.ReflectionRepository;
import com.lifeforest.backend.tree.domain.Tree;
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
public class AnalyticsService {

    private final UserRepository userRepository;
    private final FocusSessionRepository focusSessionRepository;
    private final ReflectionRepository reflectionRepository;
    private final TreeRepository treeRepository;

    @Transactional(readOnly = true)
    public AnalyticsResponseDto getProductivityMetrics(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        List<FocusSession> sessions = focusSessionRepository.findAllByUserId(user.getId());
        List<Reflection> reflections = reflectionRepository.findAllByUserId(user.getId());
        List<Tree> trees = treeRepository.findAllByUserId(user.getId());

        long totalSessions = sessions.size();
        long completedSessions = sessions.stream()
                .filter(FocusSession::isCompleted)
                .count();
        long interruptedSessions = sessions.stream()
                .filter(FocusSession::isInterrupted)
                .count();

        int totalFocusMinutes = sessions.stream()
                .map(FocusSession::getDuration)
                .filter(duration -> duration != null && duration > 0)
                .mapToInt(Integer::intValue)
                .sum();

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

        int estimatedTaskMinutes = sessions.stream()
                .filter(FocusSession::isCompleted)
                .map(FocusSession::getTask)
                .filter(task -> task != null && task.getDuration() != null && task.getDuration() > 0)
                .mapToInt(task -> task.getDuration())
                .sum();

        int actualTaskMinutes = sessions.stream()
                .filter(FocusSession::isCompleted)
                .filter(session -> session.getTask() != null)
                .filter(session -> session.getTask().getDuration() != null && session.getTask().getDuration() > 0)
                .map(FocusSession::getDuration)
                .filter(duration -> duration != null && duration > 0)
                .mapToInt(Integer::intValue)
                .sum();

        double estimationAccuracyPercentage = calculateEstimationAccuracyPercentage(
                estimatedTaskMinutes,
                actualTaskMinutes
        );

        double averageSessionMinutes = totalSessions == 0
                ? 0
                : roundToOneDecimal((double) totalFocusMinutes / totalSessions);

        double completionRate = totalSessions == 0
                ? 0
                : roundToOneDecimal((double) completedSessions / totalSessions * 100);

        double averageFocusLevel = reflections.isEmpty()
                ? 0
                : roundToOneDecimal(reflections.stream()
                        .mapToInt(Reflection::getFocusLevel)
                        .average()
                        .orElse(0));

        long treesGrown = trees.size();
        long completedTrees = trees.stream()
                .filter(Tree::isCompleted)
                .count();
        long damagedTrees = trees.stream()
                .filter(Tree::isDamaged)
                .count();

        double productivityScore = calculateProductivityScore(
                completionRate,
                averageFocusLevel,
                totalSessions,
                damagedTrees
        );

        return new AnalyticsResponseDto(
                user.getId(),
                totalSessions,
                completedSessions,
                interruptedSessions,
                completionRate,
                totalFocusMinutes,
                completedFocusMinutes,
                weeklyFocusMinutes,
                estimatedTaskMinutes,
                actualTaskMinutes,
                estimationAccuracyPercentage,
                averageSessionMinutes,
                averageFocusLevel,
                reflections.size(),
                treesGrown,
                completedTrees,
                damagedTrees,
                productivityScore
        );
    }

    private double calculateProductivityScore(
            double completionRate,
            double averageFocusLevel,
            long totalSessions,
            long damagedTrees
    ) {
        if (totalSessions == 0) {
            return 0;
        }

        double focusWeight = averageFocusLevel * 20;
        double interruptionPenalty = totalSessions == 0
                ? 0
                : ((double) damagedTrees / totalSessions) * 20;

        return roundToOneDecimal(Math.max(0, Math.min(100, completionRate * 0.6 + focusWeight * 0.4 - interruptionPenalty)));
    }

    private double calculateEstimationAccuracyPercentage(int estimatedTaskMinutes, int actualTaskMinutes) {
        if (estimatedTaskMinutes <= 0 || actualTaskMinutes <= 0) {
            return 0;
        }

        double differenceRatio = Math.abs(estimatedTaskMinutes - actualTaskMinutes) / (double) estimatedTaskMinutes;
        double accuracy = 100 - (differenceRatio * 100);

        return roundToOneDecimal(Math.max(0, Math.min(100, accuracy)));
    }

    private double roundToOneDecimal(double value) {
        return Math.round(value * 10.0) / 10.0;
    }
}
