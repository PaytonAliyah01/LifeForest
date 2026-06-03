package com.lifeforest.backend.task.mapper;

import com.lifeforest.backend.routine.domain.Routine;
import com.lifeforest.backend.task.domain.Task;
import com.lifeforest.backend.task.domain.TaskCategory;
import com.lifeforest.backend.task.domain.RepeatDay;
import com.lifeforest.backend.task.domain.TaskType;
import com.lifeforest.backend.task.dto.request.TaskCreateRequestDto;
import com.lifeforest.backend.task.dto.request.TaskUpdateRequestDto;
import com.lifeforest.backend.task.dto.response.TaskResponseDto;
import java.util.HashSet;
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
                .taskType(dto.taskType() == null ? TaskType.ONE_TIME : dto.taskType())
                .repeatDays(normalizeRepeatDays(dto.taskType(), dto.repeatDays()))
                .preferredTime(normalizePreferredTime(dto.taskType(), dto.preferredTime()))
                .completed(false)
                .build();
    }

    public void applyUpdate(Task task, TaskUpdateRequestDto dto) {
        task.setTitle(dto.title().trim());
        task.setDescription(dto.description() == null ? null : dto.description().trim());
        task.setDuration(dto.duration());
        task.setCategory(dto.category());
        task.setTaskType(dto.taskType());
        task.setRepeatDays(normalizeRepeatDays(dto.taskType(), dto.repeatDays()));
        task.setPreferredTime(normalizePreferredTime(dto.taskType(), dto.preferredTime()));
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
                task.getTaskType(),
                new HashSet<>(task.getRepeatDays()),
                task.getPreferredTime(),
                task.isCompleted(),
                task.getCreatedAt(),
                task.getUpdatedAt()
        );
    }

    private java.util.Set<RepeatDay> normalizeRepeatDays(TaskType taskType, java.util.Set<RepeatDay> repeatDays) {
        if (taskType != TaskType.REPEATING || repeatDays == null) {
            return new HashSet<>();
        }

        return new HashSet<>(repeatDays);
    }

    private String normalizePreferredTime(TaskType taskType, String preferredTime) {
        if (taskType != TaskType.REPEATING || preferredTime == null || preferredTime.trim().isEmpty()) {
            return null;
        }

        return preferredTime.trim();
    }
}
