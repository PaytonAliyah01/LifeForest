package com.lifeforest.backend.reflection.mapper;

import com.lifeforest.backend.focussession.domain.FocusSession;
import com.lifeforest.backend.reflection.domain.Reflection;
import com.lifeforest.backend.reflection.dto.request.ReflectionCreateRequestDto;
import com.lifeforest.backend.reflection.dto.response.ReflectionResponseDto;
import com.lifeforest.backend.user.domain.User;
import org.springframework.stereotype.Component;

@Component
public class ReflectionMapper {

    public Reflection toEntity(User user, FocusSession focusSession, ReflectionCreateRequestDto dto) {
        return Reflection.builder()
                .user(user)
                .focusSession(focusSession)
                .content(dto.content().trim())
                .focusLevel(dto.focusLevel())
                .distractions(normalizeOptionalText(dto.distractions()))
                .build();
    }

    public ReflectionResponseDto toResponseDto(Reflection reflection) {
        return new ReflectionResponseDto(
                reflection.getId(),
                reflection.getUser().getId(),
                reflection.getFocusSession() == null ? null : reflection.getFocusSession().getId(),
                reflection.getContent(),
                reflection.getFocusLevel(),
                reflection.getDistractions(),
                reflection.getCreatedAt(),
                reflection.getUpdatedAt()
        );
    }

    private String normalizeOptionalText(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
