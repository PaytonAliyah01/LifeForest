package com.lifeforest.backend.analytics.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import com.lifeforest.backend.common.security.AuthenticatedUserService;
import com.lifeforest.backend.analytics.dto.response.AnalyticsResponseDto;
import com.lifeforest.backend.focussession.domain.FocusSession;
import com.lifeforest.backend.focussession.repository.FocusSessionRepository;
import com.lifeforest.backend.reflection.domain.Reflection;
import com.lifeforest.backend.reflection.repository.ReflectionRepository;
import com.lifeforest.backend.task.domain.Task;
import com.lifeforest.backend.tree.domain.Tree;
import com.lifeforest.backend.tree.repository.TreeRepository;
import com.lifeforest.backend.user.domain.User;
import com.lifeforest.backend.user.exception.UserNotFoundException;
import com.lifeforest.backend.user.repository.UserRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AnalyticsServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private FocusSessionRepository focusSessionRepository;

    @Mock
    private ReflectionRepository reflectionRepository;

    @Mock
    private TreeRepository treeRepository;

    @Mock
    private AuthenticatedUserService authenticatedUserService;

    private AnalyticsService analyticsService;

    @BeforeEach
    void setUp() {
        analyticsService = new AnalyticsService(
                userRepository,
                focusSessionRepository,
                reflectionRepository,
                treeRepository,
                authenticatedUserService
        );
    }

    @Test
    void getProductivityMetricsCalculatesSummaryStats() {
        User user = User.builder().id(8L).build();

        when(userRepository.findById(8L)).thenReturn(Optional.of(user));
        when(focusSessionRepository.findAllByUserId(8L)).thenReturn(List.of(
                FocusSession.builder()
                        .completed(true)
                        .interrupted(false)
                        .duration(40)
                        .task(Task.builder().duration(35).build())
                        .endedAt(Instant.now().minus(2, ChronoUnit.DAYS))
                        .build(),
                FocusSession.builder()
                        .completed(true)
                        .interrupted(false)
                        .duration(20)
                        .task(Task.builder().duration(25).build())
                        .endedAt(Instant.now().minus(10, ChronoUnit.DAYS))
                        .build(),
                FocusSession.builder()
                        .completed(false)
                        .interrupted(true)
                        .duration(10)
                        .endedAt(Instant.now().minus(1, ChronoUnit.DAYS))
                        .build()
        ));
        when(reflectionRepository.findAllByUserId(8L)).thenReturn(List.of(
                Reflection.builder().focusLevel(4).build(),
                Reflection.builder().focusLevel(5).build()
        ));
        when(treeRepository.findAllByUserId(8L)).thenReturn(List.of(
                Tree.builder().completed(false).damaged(false).build(),
                Tree.builder().completed(true).damaged(false).build(),
                Tree.builder().completed(false).damaged(true).build()
        ));

        AnalyticsResponseDto result = analyticsService.getProductivityMetrics(8L);

        assertEquals(8L, result.userId());
        assertEquals(3, result.totalSessions());
        assertEquals(2, result.completedSessions());
        assertEquals(1, result.interruptedSessions());
        assertEquals(66.7, result.completionRate());
        assertEquals(70, result.totalFocusMinutes());
        assertEquals(60, result.completedFocusMinutes());
        assertEquals(40, result.weeklyFocusMinutes());
        assertEquals(60, result.estimatedTaskMinutes());
        assertEquals(60, result.actualTaskMinutes());
        assertEquals(100.0, result.estimationAccuracyPercentage());
        assertEquals(23.3, result.averageSessionMinutes());
        assertEquals(4.5, result.averageFocusLevel());
        assertEquals(2, result.reflectionsCount());
        assertEquals(3, result.treesGrown());
        assertEquals(1, result.completedTrees());
        assertEquals(1, result.damagedTrees());
        assertEquals(69.4, result.productivityScore());
    }

    @Test
    void getProductivityMetricsReturnsZerosWhenUserHasNoData() {
        User user = User.builder().id(8L).build();

        when(userRepository.findById(8L)).thenReturn(Optional.of(user));
        when(focusSessionRepository.findAllByUserId(8L)).thenReturn(List.of());
        when(reflectionRepository.findAllByUserId(8L)).thenReturn(List.of());
        when(treeRepository.findAllByUserId(8L)).thenReturn(List.of());

        AnalyticsResponseDto result = analyticsService.getProductivityMetrics(8L);

        assertEquals(0, result.totalSessions());
        assertEquals(0, result.totalFocusMinutes());
        assertEquals(0, result.completedFocusMinutes());
        assertEquals(0, result.weeklyFocusMinutes());
        assertEquals(0, result.estimatedTaskMinutes());
        assertEquals(0, result.actualTaskMinutes());
        assertEquals(0, result.estimationAccuracyPercentage());
        assertEquals(0, result.averageSessionMinutes());
        assertEquals(0, result.averageFocusLevel());
        assertEquals(0, result.productivityScore());
    }

    @Test
    void getProductivityMetricsRejectsUnknownUser() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(UserNotFoundException.class, () -> analyticsService.getProductivityMetrics(99L));
    }
}
