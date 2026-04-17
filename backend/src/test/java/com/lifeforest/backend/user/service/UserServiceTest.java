package com.lifeforest.backend.user.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.lifeforest.backend.user.domain.User;
import com.lifeforest.backend.user.domain.UserRole;
import com.lifeforest.backend.user.dto.request.UserCreateRequestDto;
import com.lifeforest.backend.user.dto.request.UserUpdateRequestDto;
import com.lifeforest.backend.user.dto.response.UserResponseDto;
import com.lifeforest.backend.user.exception.EmailAlreadyExistsException;
import com.lifeforest.backend.user.exception.UserNotFoundException;
import com.lifeforest.backend.user.mapper.UserMapper;
import com.lifeforest.backend.user.repository.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private final UserMapper userMapper = new UserMapper();

    private UserService userService;

    @BeforeEach
    void setUp() {
        userService = new UserService(userRepository, userMapper, passwordEncoder);
    }

    @Test
    void registerCreatesUserAndReturnsResponse() {
        UserCreateRequestDto dto = new UserCreateRequestDto(
            " Learner@example.com ",
            "Password123",
            " Learner One "
        );

        when(userRepository.existsByEmail("learner@example.com")).thenReturn(false);
        when(passwordEncoder.encode("Password123")).thenReturn("encoded-password");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User userToSave = invocation.getArgument(0);
            userToSave.setId(1L);
            return userToSave;
        });

        UserResponseDto response = userService.register(dto);

        assertEquals(1L, response.id());
        assertEquals("learner@example.com", response.email());
        assertEquals("Learner One", response.displayName());
        assertEquals(UserRole.USER, response.role());
        verify(userRepository).existsByEmail("learner@example.com");
        verify(passwordEncoder).encode("Password123");

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        assertEquals("learner@example.com", userCaptor.getValue().getEmail());
        assertEquals("encoded-password", userCaptor.getValue().getPasswordHash());
        assertEquals("Learner One", userCaptor.getValue().getDisplayName());
    }

    @Test
    void registerThrowsWhenEmailAlreadyExists() {
        UserCreateRequestDto dto = new UserCreateRequestDto(
            "learner@example.com",
            "Password123",
            "Learner One"
        );

        when(userRepository.existsByEmail("learner@example.com")).thenReturn(true);

        assertThrows(EmailAlreadyExistsException.class, () -> userService.register(dto));

        verify(userRepository).existsByEmail("learner@example.com");
        verify(passwordEncoder, never()).encode(anyString());
        verify(userRepository, never()).save(any());
    }

    @Test
    void registerTrimsAndLowercasesEmailBeforeSaving() {
        UserCreateRequestDto dto = new UserCreateRequestDto(
            "  Learner@Example.com  ",
            "Password123",
            "Learner One"
        );

        when(userRepository.existsByEmail("learner@example.com")).thenReturn(false);
        when(passwordEncoder.encode("Password123")).thenReturn("encoded-password");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User userToSave = invocation.getArgument(0);
            userToSave.setId(2L);
            return userToSave;
        });

        UserResponseDto response = userService.register(dto);

        assertEquals(2L, response.id());
        assertEquals("learner@example.com", response.email());
        verify(userRepository).existsByEmail("learner@example.com");
        verify(passwordEncoder).encode("Password123");
    }

    @Test
    void getByIdReturnsUserResponse() {
        User user = User.builder()
            .id(5L)
            .email("learner@example.com")
            .passwordHash("encoded-password")
            .displayName("Learner One")
            .role(UserRole.USER)
            .build();

        when(userRepository.findById(5L)).thenReturn(Optional.of(user));

        UserResponseDto response = userService.getById(5L);

        assertEquals(5L, response.id());
        assertEquals("learner@example.com", response.email());
        assertEquals("Learner One", response.displayName());
        assertEquals(UserRole.USER, response.role());
        verify(userRepository).findById(5L);
    }

    @Test
    void getByIdThrowsWhenUserDoesNotExist() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(UserNotFoundException.class, () -> userService.getById(99L));

        verify(userRepository).findById(99L);
    }

    @Test
    void updateChangesDisplayNameAndReturnsUpdatedResponse() {
        User user = User.builder()
            .id(7L)
            .email("learner@example.com")
            .passwordHash("encoded-password")
            .displayName("Old Name")
            .role(UserRole.USER)
            .build();

        UserUpdateRequestDto dto = new UserUpdateRequestDto("New Name");

        when(userRepository.findById(7L)).thenReturn(Optional.of(user));
        when(userRepository.save(user)).thenAnswer(invocation -> invocation.getArgument(0));

        UserResponseDto response = userService.update(7L, dto);

        assertEquals(7L, response.id());
        assertEquals("New Name", response.displayName());
        assertEquals("New Name", user.getDisplayName());
        verify(userRepository).findById(7L);
        verify(userRepository).save(user);
    }

    @Test
    void updateTrimsDisplayNameBeforeSaving() {
        User user = User.builder()
            .id(8L)
            .email("learner@example.com")
            .passwordHash("encoded-password")
            .displayName("Old Name")
            .role(UserRole.USER)
            .build();

        UserUpdateRequestDto dto = new UserUpdateRequestDto("  New Name  ");

        when(userRepository.findById(8L)).thenReturn(Optional.of(user));
        when(userRepository.save(user)).thenAnswer(invocation -> invocation.getArgument(0));

        UserResponseDto response = userService.update(8L, dto);

        assertEquals("New Name", response.displayName());
        assertEquals("New Name", user.getDisplayName());
        verify(userRepository).findById(8L);
        verify(userRepository).save(user);
    }

    @Test
    void updateThrowsWhenUserDoesNotExist() {
        when(userRepository.findById(77L)).thenReturn(Optional.empty());

        assertThrows(UserNotFoundException.class, () -> userService.update(77L, new UserUpdateRequestDto("Name")));

        verify(userRepository).findById(77L);
        verify(userRepository, never()).save(any());
    }
}
