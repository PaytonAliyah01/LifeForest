package com.lifeforest.backend.routine.mapper;

import com.lifeforest.backend.routine.domain.Routine;
import com.lifeforest.backend.routine.dto.request.RoutineCreateRequestDto;
import com.lifeforest.backend.routine.dto.request.RoutineUpdateRequestDto;
import com.lifeforest.backend.routine.dto.response.RoutineResponseDto;
import com.lifeforest.backend.user.domain.User;
import org.springframework.stereotype.Component;

@Component
public class RoutineMapper {

    public Routine toEntity(User user, RoutineCreateRequestDto dto) {
        return Routine.builder()
                .user(user)
                .title(dto.title().trim())
                .description(dto.description() == null ? null : dto.description().trim())
                .completed(false)
                .build();
    }

    public void applyUpdate(Routine routine, RoutineUpdateRequestDto dto) {
        routine.setTitle(dto.title().trim());
        routine.setDescription(dto.description() == null ? null : dto.description().trim());
        routine.setCompleted(dto.completed());
    }

    public RoutineResponseDto toResponseDto(Routine routine) {
        return new RoutineResponseDto(
                routine.getId(),
                routine.getUser().getId(),
                routine.getTitle(),
                routine.getDescription(),
                routine.isCompleted(),
                routine.getCreatedAt(),
                routine.getUpdatedAt()
        );
    }
}