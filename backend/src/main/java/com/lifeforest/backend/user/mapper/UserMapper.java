package com.lifeforest.backend.user.mapper;

import com.lifeforest.backend.user.domain.User;
import com.lifeforest.backend.user.domain.UserRole;
import com.lifeforest.backend.user.dto.request.UserCreateRequestDto;
import com.lifeforest.backend.user.dto.request.UserUpdateRequestDto;
import com.lifeforest.backend.user.dto.response.UserResponseDto;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public User toEntity(UserCreateRequestDto dto, String encodedPassword){
        return User.builder()
            .email(dto.email().trim().toLowerCase())
            .passwordHash(encodedPassword)
            .displayName(dto.displayName().trim())
            .role(UserRole.USER)
            .build();
    }

    public void applyUpdate(User user, UserUpdateRequestDto dto){
        user.setDisplayName(dto.displayName().trim());
    }

    public UserResponseDto toResponseDto(User user){
        return new UserResponseDto(
            user.getId(),
            user.getEmail(),
            user.getDisplayName(),
            user.getRole(),
            user.getCreatedAt()
        );
    }
    
}
