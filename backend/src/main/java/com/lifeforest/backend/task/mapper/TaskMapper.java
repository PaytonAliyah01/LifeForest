package com.lifeforest.backend.task.mapper;

import com.lifeforest.backend.routine.domain.Routine;
import com.lifeforest.backend.task.domain.Task;
import com.lifeforest.backend.task.domain.TaskCategory;
import com.lifeforest.backend.task.dto.request.TaskCreateRequestDto;
import com.lifeforest.backend.task.dto.request.TaskUpdateRequestDto;
import com.lifeforest.backend.task.dto.response.TaskResponseDto;
import org.springframework.stereotype.Component;

@Component
public class TaskMapper {

    public Task toEntity(Routine routine, TaskCreateRequestDto dto) {
        return Task.builder()
                .routine(routine)
                .title(dto.title().trim())
                .description(dto.description() == null ? null : dto.description().trim())
                .duration(dto.duration())
                .category(dto.category() == null ? TaskCategory.GENERAL : dto.category())
                .completed(false)
                .build();
    }

    public void applyUpdate(Task task, TaskUpdateRequestDto dto) {
        task.setTitle(dto.title().trim());
        task.setDescription(dto.description() == null ? null : dto.description().trim());
        task.setDuration(dto.duration());
        task.setCategory(dto.category());
        task.setCompleted(dto.completed());
    }

    public TaskResponseDto toResponseDto(Task task) {
        return new TaskResponseDto(
                task.getId(),
                task.getRoutine().getId(),
                task.getTitle(),
                task.getDescription(),
                task.getDuration(),
                task.getCategory(),
                task.isCompleted(),
                task.getCreatedAt(),
                task.getUpdatedAt()
        );
    }
}
