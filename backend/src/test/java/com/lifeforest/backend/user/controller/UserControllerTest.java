package com.lifeforest.backend.user.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.lifeforest.backend.user.domain.UserRole;
import com.lifeforest.backend.user.dto.request.UserCreateRequestDto;
import com.lifeforest.backend.user.dto.request.UserUpdateRequestDto;
import com.lifeforest.backend.user.dto.response.UserResponseDto;
import com.lifeforest.backend.user.service.UserService;
import java.time.Instant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    @Mock
    private UserService userService;

    private UserController userController;

    @BeforeEach
    void setUp() {
        userController = new UserController(userService);
    }

    @Test
    void createUserReturnsCreatedUser() {
        UserCreateRequestDto request = new UserCreateRequestDto(
            "learner@example.com",
            "Password123",
            "Learner One"
        );

        UserResponseDto response = new UserResponseDto(
            1L,
            "learner@example.com",
            "Learner One",
            UserRole.USER,
            Instant.parse("2026-04-14T10:00:00Z")
        );

        when(userService.register(request)).thenReturn(response);

        UserResponseDto result = userController.createUser(request);

        assertEquals(response, result);
        verify(userService).register(request);
    }

    @Test
    void getUserByIdReturnsUser() {
        UserResponseDto response = new UserResponseDto(
            2L,
            "learner@example.com",
            "Learner One",
            UserRole.USER,
            Instant.parse("2026-04-14T10:00:00Z")
        );

        when(userService.getById(2L)).thenReturn(response);

        UserResponseDto result = userController.getUserById(2L);

        assertEquals(response, result);
        verify(userService).getById(2L);
    }

    @Test
    void updateUserReturnsUpdatedUser() {
        UserUpdateRequestDto request = new UserUpdateRequestDto("Updated Learner");

        UserResponseDto response = new UserResponseDto(
            3L,
            "learner@example.com",
            "Updated Learner",
            UserRole.USER,
            Instant.parse("2026-04-14T10:00:00Z")
        );

        when(userService.update(3L, request)).thenReturn(response);

        UserResponseDto result = userController.updateUser(3L, request);

        assertEquals(response, result);
        verify(userService).update(3L, request);
    }
}
