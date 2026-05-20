package com.lifeforest.backend.user.service;

import com.lifeforest.backend.user.domain.User;
import com.lifeforest.backend.user.dto.request.UserCreateRequestDto;
import com.lifeforest.backend.user.dto.request.UserUpdateRequestDto;
import com.lifeforest.backend.user.dto.response.UserResponseDto;
import com.lifeforest.backend.user.exception.EmailAlreadyExistsException;
import com.lifeforest.backend.user.exception.UserNotFoundException;
import com.lifeforest.backend.user.mapper.UserMapper;
import com.lifeforest.backend.user.repository.UserRepository;
import java.util.List;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
@Service
@RequiredArgsConstructor
public class UserService {
    
    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public UserResponseDto register(UserCreateRequestDto dto){
        String normalizedEmail = dto.email().trim().toLowerCase();

        if(userRepository.existsByEmail(normalizedEmail)){
            throw new EmailAlreadyExistsException(normalizedEmail);
        }

        String encodedPassword = passwordEncoder.encode(dto.password());
        User user = userMapper.toEntity(dto, encodedPassword);
        user.setEmail(normalizedEmail);

        User savedUser = userRepository.save(user);
        return userMapper.toResponseDto(savedUser);
    }

    @Transactional(readOnly = true)
    public List<UserResponseDto> getAll() {
        return userRepository.findAll().stream()
                .map(userMapper::toResponseDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public UserResponseDto getById(Long id){
        User user = userRepository.findById(Objects.requireNonNull(id, "id"))
                .orElseThrow(() -> new UserNotFoundException(id));

        return userMapper.toResponseDto(user);
    }

    @Transactional
    public UserResponseDto update(Long id, UserUpdateRequestDto dto){
        User user = userRepository.findById(Objects.requireNonNull(id, "id"))
                .orElseThrow(() -> new UserNotFoundException(id));
        
        userMapper.applyUpdate(user, dto);
        User updatedUser = userRepository.save(Objects.requireNonNull(user, "user"));

        return userMapper.toResponseDto(updatedUser);
    }

    @Transactional
    public void delete(Long id) {
        User user = userRepository.findById(Objects.requireNonNull(id, "id"))
                .orElseThrow(() -> new UserNotFoundException(id));
        userRepository.delete(Objects.requireNonNull(user, "user"));
    }
}
