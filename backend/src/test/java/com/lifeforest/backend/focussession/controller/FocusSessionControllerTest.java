package com.lifeforest.backend.focussession.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.lifeforest.backend.focussession.domain.FocusSession;
import com.lifeforest.backend.focussession.dto.request.FocusSessionStartRequestDto;
import com.lifeforest.backend.focussession.service.FocusSessionService;
import com.lifeforest.backend.task.domain.Task;
import com.lifeforest.backend.user.domain.User;
import java.time.Instant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class FocusSessionControllerTest {

    @Mock
    private FocusSessionService focusSessionService;

    private FocusSessionController focusSessionController;

    @BeforeEach
    void setUp() {
        focusSessionController = new FocusSessionController(focusSessionService);
    }

    @Test
    void startFocusSessionReturnsStartedSession() {
        FocusSessionStartRequestDto request = new FocusSessionStartRequestDto(5L, 9L);
        FocusSession response = FocusSession.builder()
                .id(14L)
                .user(User.builder().id(5L).build())
                .task(Task.builder().id(9L).build())
                .startedAt(Instant.parse("2026-05-19T12:00:00Z"))
                .completed(false)
                .createdAt(Instant.parse("2026-05-19T12:00:00Z"))
                .updatedAt(Instant.parse("2026-05-19T12:00:00Z"))
                .build();

        when(focusSessionService.start(5L, 9L)).thenReturn(response);

        FocusSession result = focusSessionController.startFocusSession(request);

        assertEquals(response, result);
        verify(focusSessionService).start(5L, 9L);
    }

    @Test
    void completeFocusSessionReturnsCompletedSession() {
        FocusSession response = FocusSession.builder()
                .id(14L)
                .user(User.builder().id(5L).build())
                .task(Task.builder().id(9L).build())
                .startedAt(Instant.parse("2026-05-19T12:00:00Z"))
                .endedAt(Instant.parse("2026-05-19T12:30:00Z"))
                .duration(30)
                .completed(true)
                .createdAt(Instant.parse("2026-05-19T12:00:00Z"))
                .updatedAt(Instant.parse("2026-05-19T12:30:00Z"))
                .build();

        when(focusSessionService.complete(14L)).thenReturn(response);

        FocusSession result = focusSessionController.completeFocusSession(14L);

        assertEquals(response, result);
        verify(focusSessionService).complete(14L);
    }

    @Test
    void interruptFocusSessionReturnsInterruptedSession() {
        FocusSession response = FocusSession.builder()
                .id(14L)
                .user(User.builder().id(5L).build())
                .task(Task.builder().id(9L).build())
                .startedAt(Instant.parse("2026-05-19T12:00:00Z"))
                .endedAt(Instant.parse("2026-05-19T12:10:00Z"))
                .duration(10)
                .completed(false)
                .interrupted(true)
                .createdAt(Instant.parse("2026-05-19T12:00:00Z"))
                .updatedAt(Instant.parse("2026-05-19T12:10:00Z"))
                .build();

        when(focusSessionService.interrupt(14L)).thenReturn(response);

        FocusSession result = focusSessionController.interruptFocusSession(14L);

        assertEquals(response, result);
        verify(focusSessionService).interrupt(14L);
    }
}
