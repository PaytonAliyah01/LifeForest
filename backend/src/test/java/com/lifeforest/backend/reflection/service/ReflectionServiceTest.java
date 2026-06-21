package com.lifeforest.backend.reflection.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.lifeforest.backend.common.security.AuthenticatedUserService;
import com.lifeforest.backend.focussession.domain.FocusSession;
import com.lifeforest.backend.focussession.repository.FocusSessionRepository;
import com.lifeforest.backend.reflection.dto.request.ReflectionCreateRequestDto;
import com.lifeforest.backend.reflection.mapper.ReflectionMapper;
import com.lifeforest.backend.reflection.repository.ReflectionRepository;
import com.lifeforest.backend.user.domain.User;
import com.lifeforest.backend.user.repository.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ReflectionServiceTest {

    @Mock
    private ReflectionRepository reflectionRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private FocusSessionRepository focusSessionRepository;

    @Mock
    private AuthenticatedUserService authenticatedUserService;

    private ReflectionMapper reflectionMapper;

    private ReflectionService reflectionService;

    @BeforeEach
    void setUp() {
        reflectionMapper = new ReflectionMapper();
        reflectionService = new ReflectionService(
                reflectionRepository,
                userRepository,
                focusSessionRepository,
                reflectionMapper,
                authenticatedUserService
        );
    }

    @Test
    void createFromDtoResolvesUserAndFocusSessionBeforeSaving() {
        User user = User.builder().id(4L).build();
        FocusSession focusSession = FocusSession.builder()
                .id(9L)
                .user(user)
                .build();
        ReflectionCreateRequestDto dto = new ReflectionCreateRequestDto(
                4L,
                9L,
                "I stayed focused and calm.",
                4,
                "Phone notifications"
        );

        when(userRepository.findById(4L)).thenReturn(Optional.of(user));
        when(focusSessionRepository.findById(9L)).thenReturn(Optional.of(focusSession));
        when(reflectionRepository.save(org.mockito.ArgumentMatchers.any(com.lifeforest.backend.reflection.domain.Reflection.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        com.lifeforest.backend.reflection.domain.Reflection result = reflectionService.create(4L, dto);

        assertSame(user, result.getUser());
        assertSame(focusSession, result.getFocusSession());
        assertEquals(4, result.getFocusLevel());
        assertEquals("Phone notifications", result.getDistractions());
        verify(reflectionRepository).save(org.mockito.ArgumentMatchers.any(com.lifeforest.backend.reflection.domain.Reflection.class));
    }

    @Test
    void createFromDtoBuildsValidatedReflection() {
        User user = User.builder().id(4L).build();
        FocusSession focusSession = FocusSession.builder()
                .id(9L)
                .user(user)
                .build();
        ReflectionCreateRequestDto dto = new ReflectionCreateRequestDto(
                4L,
                9L,
                "  I learned what distracted me today.  ",
                5,
                "  Slack messages  "
        );

        when(userRepository.findById(4L)).thenReturn(Optional.of(user));
        when(focusSessionRepository.findById(9L)).thenReturn(Optional.of(focusSession));
        when(reflectionRepository.save(org.mockito.ArgumentMatchers.any(com.lifeforest.backend.reflection.domain.Reflection.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        com.lifeforest.backend.reflection.domain.Reflection result = reflectionService.create(4L, dto);

        assertSame(user, result.getUser());
        assertSame(focusSession, result.getFocusSession());
        assertEquals("I learned what distracted me today.", result.getContent());
        assertEquals(5, result.getFocusLevel());
        assertEquals("Slack messages", result.getDistractions());
    }

    @Test
    void createRejectsFocusSessionOwnedByDifferentUser() {
        User selectedUser = User.builder().id(4L).build();
        User actualOwner = User.builder().id(7L).build();
        FocusSession focusSession = FocusSession.builder()
                .id(9L)
                .user(actualOwner)
                .build();
        ReflectionCreateRequestDto dto = new ReflectionCreateRequestDto(
                4L,
                9L,
                "Ownership should be validated.",
                3,
                "Open tabs"
        );

        when(userRepository.findById(4L)).thenReturn(Optional.of(selectedUser));
        when(focusSessionRepository.findById(9L)).thenReturn(Optional.of(focusSession));

        IllegalArgumentException exception =
                assertThrows(IllegalArgumentException.class, () -> reflectionService.create(4L, dto));

        assertEquals("Focus session does not belong to the selected user.", exception.getMessage());
    }
}
