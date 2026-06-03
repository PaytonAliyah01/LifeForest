package com.lifeforest.backend.reflection.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.lifeforest.backend.focussession.domain.FocusSession;
import com.lifeforest.backend.focussession.repository.FocusSessionRepository;
import com.lifeforest.backend.reflection.domain.Reflection;
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

    private ReflectionMapper reflectionMapper;

    private ReflectionService reflectionService;

    @BeforeEach
    void setUp() {
        reflectionMapper = new ReflectionMapper();
        reflectionService = new ReflectionService(
                reflectionRepository,
                userRepository,
                focusSessionRepository,
                reflectionMapper
        );
    }

    @Test
    void createResolvesUserAndFocusSessionBeforeSaving() {
        User user = User.builder().id(4L).build();
        FocusSession focusSession = FocusSession.builder()
                .id(9L)
                .user(user)
                .build();
        Reflection reflection = Reflection.builder()
                .user(User.builder().id(4L).build())
                .focusSession(FocusSession.builder().id(9L).build())
                .content("I stayed focused and calm.")
                .focusLevel(4)
                .distractions("Phone notifications")
                .build();

        when(userRepository.findById(4L)).thenReturn(Optional.of(user));
        when(focusSessionRepository.findById(9L)).thenReturn(Optional.of(focusSession));
        when(reflectionRepository.save(reflection)).thenReturn(reflection);

        Reflection result = reflectionService.create(reflection);

        assertSame(reflection, result);
        assertSame(user, result.getUser());
        assertSame(focusSession, result.getFocusSession());
        assertEquals(4, result.getFocusLevel());
        assertEquals("Phone notifications", result.getDistractions());
        verify(reflectionRepository).save(reflection);
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
        when(reflectionRepository.save(org.mockito.ArgumentMatchers.any(Reflection.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        Reflection result = reflectionService.create(4L, dto);

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
        Reflection reflection = Reflection.builder()
                .user(User.builder().id(4L).build())
                .focusSession(FocusSession.builder().id(9L).build())
                .content("Ownership should be validated.")
                .focusLevel(3)
                .distractions("Open tabs")
                .build();

        when(userRepository.findById(4L)).thenReturn(Optional.of(selectedUser));
        when(focusSessionRepository.findById(9L)).thenReturn(Optional.of(focusSession));

        IllegalArgumentException exception =
                assertThrows(IllegalArgumentException.class, () -> reflectionService.create(reflection));

        assertEquals("Focus session does not belong to the selected user.", exception.getMessage());
    }
}
