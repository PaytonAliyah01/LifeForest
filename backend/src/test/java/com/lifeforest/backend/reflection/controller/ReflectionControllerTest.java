package com.lifeforest.backend.reflection.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.lifeforest.backend.focussession.domain.FocusSession;
import com.lifeforest.backend.reflection.domain.Reflection;
import com.lifeforest.backend.reflection.dto.request.ReflectionCreateRequestDto;
import com.lifeforest.backend.reflection.dto.response.ReflectionResponseDto;
import com.lifeforest.backend.reflection.mapper.ReflectionMapper;
import com.lifeforest.backend.reflection.service.ReflectionService;
import com.lifeforest.backend.user.domain.User;
import java.time.Instant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ReflectionControllerTest {

    @Mock
    private ReflectionService reflectionService;

    private ReflectionMapper reflectionMapper;
    private ReflectionController reflectionController;

    @BeforeEach
    void setUp() {
        reflectionMapper = new ReflectionMapper();
        reflectionController = new ReflectionController(reflectionService, reflectionMapper);
    }

    @Test
    void createReflectionReturnsCreatedReflection() {
        ReflectionCreateRequestDto request = new ReflectionCreateRequestDto(
                5L,
                11L,
                "I felt productive.",
                4,
                "Team chat notifications"
        );
        Reflection response = Reflection.builder()
                .id(14L)
                .user(User.builder().id(5L).build())
                .focusSession(FocusSession.builder().id(11L).build())
                .content("I felt productive.")
                .focusLevel(4)
                .distractions("Team chat notifications")
                .createdAt(Instant.parse("2026-05-29T08:00:00Z"))
                .updatedAt(Instant.parse("2026-05-29T08:00:00Z"))
                .build();

        when(reflectionService.create(5L, request)).thenReturn(response);

        ReflectionResponseDto result = reflectionController.createReflection(request);

        assertEquals(14L, result.id());
        assertEquals(5L, result.userId());
        assertEquals(11L, result.focusSessionId());
        assertEquals("I felt productive.", result.content());
        assertEquals(4, result.focusLevel());
        assertEquals("Team chat notifications", result.distractions());
        verify(reflectionService).create(5L, request);
    }

    @Test
    void getReflectionByIdReturnsReflection() {
        Reflection response = Reflection.builder()
                .id(14L)
                .user(User.builder().id(5L).build())
                .focusSession(FocusSession.builder().id(11L).build())
                .content("I felt productive.")
                .focusLevel(3)
                .distractions("Background noise")
                .build();

        when(reflectionService.getById(14L)).thenReturn(response);

        ReflectionResponseDto result = reflectionController.getReflectionById(14L);

        assertEquals(14L, result.id());
        assertEquals("I felt productive.", result.content());
        assertEquals(3, result.focusLevel());
        assertEquals("Background noise", result.distractions());
        verify(reflectionService).getById(14L);
    }
}
