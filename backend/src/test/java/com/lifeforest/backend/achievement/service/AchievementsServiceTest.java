package com.lifeforest.backend.achievement.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import com.lifeforest.backend.achievement.dto.response.AchievementsResponseDto;
import com.lifeforest.backend.common.security.AuthenticatedUserService;
import com.lifeforest.backend.focussession.domain.FocusSession;
import com.lifeforest.backend.focussession.repository.FocusSessionRepository;
import com.lifeforest.backend.reflection.domain.Reflection;
import com.lifeforest.backend.reflection.repository.ReflectionRepository;
import com.lifeforest.backend.routine.domain.Routine;
import com.lifeforest.backend.routine.repository.RoutineRepository;
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
class AchievementsServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoutineRepository routineRepository;

    @Mock
    private FocusSessionRepository focusSessionRepository;

    @Mock
    private ReflectionRepository reflectionRepository;

    @Mock
    private TreeRepository treeRepository;

    @Mock
    private AuthenticatedUserService authenticatedUserService;

    private AchievementsService achievementsService;

    @BeforeEach
    void setUp() {
        achievementsService = new AchievementsService(
                userRepository,
                routineRepository,
                focusSessionRepository,
                reflectionRepository,
                treeRepository,
                authenticatedUserService
        );
    }

    @Test
    void getAchievementsCalculatesUnlockedAndProgressValues() {
        User user = User.builder().id(5L).build();

        when(userRepository.findById(5L)).thenReturn(Optional.of(user));
        when(routineRepository.findAllByUserId(5L)).thenReturn(List.of(
                Routine.builder().build(),
                Routine.builder().build(),
                Routine.builder().build()
        ));
        when(focusSessionRepository.findAllByUserId(5L)).thenReturn(List.of(
                FocusSession.builder().completed(true).duration(120).endedAt(Instant.now().minus(2, ChronoUnit.DAYS)).build(),
                FocusSession.builder().completed(true).duration(90).endedAt(Instant.now().minus(1, ChronoUnit.DAYS)).build(),
                FocusSession.builder().completed(false).duration(15).endedAt(Instant.now().minus(1, ChronoUnit.DAYS)).build()
        ));
        when(reflectionRepository.findAllByUserId(5L)).thenReturn(List.of(
                Reflection.builder().build(),
                Reflection.builder().build()
        ));
        when(treeRepository.findAllByUserId(5L)).thenReturn(List.of(
                Tree.builder().damaged(false).build(),
                Tree.builder().damaged(true).build()
        ));

        AchievementsResponseDto result = achievementsService.getAchievements(5L);

        assertEquals(5L, result.userId());
        assertEquals(4, result.unlockedCount());
        assertEquals(14, result.totalCount());
        assertEquals(14, result.achievements().size());
        assertEquals("ROUTINES", result.achievements().get(0).category());
        assertEquals("First Steps", result.achievements().get(0).title());
        assertEquals(true, result.achievements().get(0).unlocked());
        assertEquals(60, result.achievements().get(1).progressPercentage());
        assertEquals(70, result.achievements().get(11).progressPercentage());
        assertEquals(false, result.achievements().get(13).unlocked());
    }

    @Test
    void getAchievementsRejectsUnknownUser() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(UserNotFoundException.class, () -> achievementsService.getAchievements(99L));
    }
}
