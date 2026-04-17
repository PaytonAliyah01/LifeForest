package com.lifeforest.backend.auth.service;

import com.lifeforest.backend.auth.dto.LoginRequestDto;
import com.lifeforest.backend.auth.dto.LoginResponseDto;
import com.lifeforest.backend.auth.exception.InvalidCredentialsException;
import com.lifeforest.backend.common.security.JwtService;
import com.lifeforest.backend.user.domain.User;
import com.lifeforest.backend.user.repository.UserRepository;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public LoginResponseDto login(LoginRequestDto dto) {
        String normalizedEmail = dto.email().trim().toLowerCase();

        User user = userRepository.findByEmail(normalizedEmail)
            .orElseThrow(InvalidCredentialsException::new);

        if (!passwordEncoder.matches(dto.password(), user.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }

        String token = jwtService.generateToken(
            user.getEmail(),
            Map.of("role", user.getRole().name(), "userId", user.getId())
        );

        return new LoginResponseDto(token, "Bearer");
    }
}