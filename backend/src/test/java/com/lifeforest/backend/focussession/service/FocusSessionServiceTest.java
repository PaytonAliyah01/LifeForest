package com.lifeforest.backend.focussession.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

import com.lifeforest.backend.common.security.AuthenticatedUserService;
import com.lifeforest.backend.focussession.domain.FocusSession;
import com.lifeforest.backend.focussession.exception.FocusSessionInterruptedException;
import com.lifeforest.backend.focussession.repository.FocusSessionRepository;
import com.lifeforest.backend.routine.domain.Routine;
import com.lifeforest.backend.task.domain.Task;
import com.lifeforest.backend.task.domain.TaskCategory;
import com.lifeforest.backend.task.domain.TaskType;
import com.lifeforest.backend.task.repository.TaskRepository;
import com.lifeforest.backend.tree.domain.TreeType;
import com.lifeforest.backend.tree.service.TreeService;
import com.lifeforest.backend.user.domain.User;
import com.lifeforest.backend.user.repository.UserRepository;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class FocusSessionServiceTest {

    @Mock
    private FocusSessionRepository focusSessionRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private TreeService treeService;

    @Mock
    private AuthenticatedUserService authenticatedUserService;

    private FocusSessionService focusSessionService;

    @BeforeEach
    void setUp() {
        focusSessionService = new FocusSessionService(
                focusSessionRepository,
                userRepository,
                taskRepository,
                treeService,
                authenticatedUserService
        );
    }

    @Test
    void completeStoresEndTimeAndDuration() {
        Task task = Task.builder()
                .id(41L)
                .taskType(TaskType.ONE_TIME)
                .completed(false)
                .build();
        FocusSession focusSession = FocusSession.builder()
                .id(14L)
                .task(task)
                .startedAt(Instant.now().minus(Duration.ofMinutes(32)).minusSeconds(5))
                .completed(false)
                .build();

        when(focusSessionRepository.findById(14L)).thenReturn(Optional.of(focusSession));
        when(focusSessionRepository.save(focusSession)).thenReturn(focusSession);

        FocusSession result = focusSessionService.complete(14L);

        assertSame(focusSession, result);
        assertTrue(result.isCompleted());
        assertTrue(task.isCompleted());
        assertNotNull(result.getEndedAt());
        assertEquals(32, result.getDuration());
        verify(focusSessionRepository).save(focusSession);
        verify(treeService).createForCompletedSession(focusSession);
    }

    @Test
    void completeLeavesRepeatingTaskAvailable() {
        Task task = Task.builder()
                .id(42L)
                .taskType(TaskType.REPEATING)
                .completed(false)
                .build();
        FocusSession focusSession = FocusSession.builder()
                .id(21L)
                .task(task)
                .startedAt(Instant.now().minus(Duration.ofMinutes(18)))
                .completed(false)
                .build();

        when(focusSessionRepository.findById(21L)).thenReturn(Optional.of(focusSession));
        when(focusSessionRepository.save(focusSession)).thenReturn(focusSession);

        FocusSession result = focusSessionService.complete(21L);

        assertSame(focusSession, result);
        assertFalse(task.isCompleted());
        verify(focusSessionRepository).save(focusSession);
        verify(treeService).createForCompletedSession(focusSession);
    }

    @Test
    void completeThrowsWhenSessionIsInterrupted() {
        FocusSession focusSession = FocusSession.builder()
                .id(18L)
                .startedAt(Instant.parse("2026-05-19T11:00:00Z"))
                .endedAt(Instant.parse("2026-05-19T11:10:00Z"))
                .duration(10)
                .completed(false)
                .interrupted(true)
                .build();

        when(focusSessionRepository.findById(18L)).thenReturn(Optional.of(focusSession));

        assertThrows(FocusSessionInterruptedException.class, () -> focusSessionService.complete(18L));
    }

    @Test
    void completeReturnsExistingSessionWhenAlreadyCompleted() {
        FocusSession focusSession = FocusSession.builder()
                .id(15L)
                .startedAt(Instant.parse("2026-05-19T11:00:00Z"))
                .endedAt(Instant.parse("2026-05-19T11:25:00Z"))
                .duration(25)
                .completed(true)
                .build();

        when(focusSessionRepository.findById(15L)).thenReturn(Optional.of(focusSession));

        FocusSession result = focusSessionService.complete(15L);

        assertSame(focusSession, result);
        assertEquals(25, result.getDuration());
        assertEquals(Instant.parse("2026-05-19T11:25:00Z"), result.getEndedAt());
        verify(treeService).createForCompletedSession(focusSession);
        verifyNoMoreInteractions(focusSessionRepository);
    }

    @Test
    void completeRoundsDownPartialMinutes() {
        FocusSession focusSession = FocusSession.builder()
                .id(16L)
                .startedAt(Instant.now().minus(Duration.ofMinutes(12)).minusSeconds(59))
                .completed(false)
                .build();

        when(focusSessionRepository.findById(16L)).thenReturn(Optional.of(focusSession));
        when(focusSessionRepository.save(focusSession)).thenReturn(focusSession);

        FocusSession result = focusSessionService.complete(16L);

        assertEquals(12, result.getDuration());
        verify(focusSessionRepository).save(focusSession);
        verify(treeService).createForCompletedSession(focusSession);
    }

    @Test
    void completeClampsFutureStartTimeToZeroMinutes() {
        FocusSession focusSession = FocusSession.builder()
                .id(17L)
                .startedAt(Instant.now().plus(Duration.ofMinutes(3)))
                .completed(false)
                .build();

        when(focusSessionRepository.findById(17L)).thenReturn(Optional.of(focusSession));
        when(focusSessionRepository.save(focusSession)).thenReturn(focusSession);

        FocusSession result = focusSessionService.complete(17L);

        assertEquals(0, result.getDuration());
        assertNotNull(result.getEndedAt());
        assertTrue(result.isCompleted());
        verify(focusSessionRepository).save(focusSession);
        verify(treeService).createForCompletedSession(focusSession);
    }

    @Test
    void interruptStoresInterruptionState() {
        FocusSession focusSession = FocusSession.builder()
                .id(19L)
                .startedAt(Instant.now().minus(Duration.ofMinutes(7)).minusSeconds(10))
                .completed(false)
                .interrupted(false)
                .build();

        when(focusSessionRepository.findById(19L)).thenReturn(Optional.of(focusSession));
        when(focusSessionRepository.save(focusSession)).thenReturn(focusSession);

        FocusSession result = focusSessionService.interrupt(19L);

        assertSame(focusSession, result);
        assertFalse(result.isCompleted());
        assertTrue(result.isInterrupted());
        assertNotNull(result.getEndedAt());
        assertEquals(7, result.getDuration());
        verify(focusSessionRepository).save(focusSession);
        verify(treeService).createForInterruptedSession(focusSession);
    }

    @Test
    void interruptReturnsExistingSessionWhenAlreadyInterrupted() {
        FocusSession focusSession = FocusSession.builder()
                .id(20L)
                .startedAt(Instant.parse("2026-05-20T09:00:00Z"))
                .endedAt(Instant.parse("2026-05-20T09:04:00Z"))
                .duration(4)
                .completed(false)
                .interrupted(true)
                .build();

        when(focusSessionRepository.findById(20L)).thenReturn(Optional.of(focusSession));

        FocusSession result = focusSessionService.interrupt(20L);

        assertSame(focusSession, result);
        assertTrue(result.isInterrupted());
        verifyNoMoreInteractions(focusSessionRepository);
        verify(treeService).createForInterruptedSession(focusSession);
    }

    @Test
    void startAssignsTreeTypeFromTaskCategory() {
        User user = User.builder().id(9L).build();
        Routine routine = Routine.builder()
                .id(5L)
                .user(user)
                .build();
        Task task = Task.builder()
                .id(33L)
                .routine(routine)
                .category(TaskCategory.CREATIVE)
                .taskType(TaskType.ONE_TIME)
                .build();

        when(userRepository.findById(9L)).thenReturn(Optional.of(user));
        when(taskRepository.findById(33L)).thenReturn(Optional.of(task));
        when(focusSessionRepository.save(org.mockito.ArgumentMatchers.any(FocusSession.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(treeService.determineTreeType(task)).thenReturn(TreeType.CHERRY_BLOSSOM);

        FocusSession result = focusSessionService.start(9L, 33L);

        assertEquals(TreeType.CHERRY_BLOSSOM, result.getTreeType());
        verify(treeService).determineTreeType(task);
    }

    @Test
    void startRejectsAlreadyCompletedOneTimeTask() {
        User user = User.builder().id(10L).build();
        Routine routine = Routine.builder()
                .id(6L)
                .user(user)
                .build();
        Task task = Task.builder()
                .id(34L)
                .routine(routine)
                .category(TaskCategory.WORK)
                .taskType(TaskType.ONE_TIME)
                .completed(true)
                .build();

        when(userRepository.findById(10L)).thenReturn(Optional.of(user));
        when(taskRepository.findById(34L)).thenReturn(Optional.of(task));

        IllegalArgumentException exception =
                assertThrows(IllegalArgumentException.class, () -> focusSessionService.start(10L, 34L));

        assertEquals("This one-time task is already completed.", exception.getMessage());
    }
}
