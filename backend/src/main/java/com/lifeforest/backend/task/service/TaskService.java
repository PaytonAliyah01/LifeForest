package com.lifeforest.backend.task.service;

import com.lifeforest.backend.common.security.AuthenticatedUserService;
import com.lifeforest.backend.routine.domain.Routine;
import com.lifeforest.backend.routine.exception.RoutineNotFoundException;
import com.lifeforest.backend.routine.repository.RoutineRepository;
import com.lifeforest.backend.task.domain.Task;
import com.lifeforest.backend.task.dto.request.TaskCreateRequestDto;
import com.lifeforest.backend.task.dto.request.TaskUpdateRequestDto;
import com.lifeforest.backend.task.dto.response.TaskResponseDto;
import com.lifeforest.backend.task.exception.TaskNotFoundException;
import com.lifeforest.backend.task.mapper.TaskMapper;
import com.lifeforest.backend.task.repository.TaskRepository;
import java.util.List;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final RoutineRepository routineRepository;
    private final TaskMapper taskMapper;
    private final AuthenticatedUserService authenticatedUserService;

    @Transactional
    public TaskResponseDto create(Long routineId, TaskCreateRequestDto dto) {
        Routine routine = loadRoutine(routineId);
        authenticatedUserService.assertCanAccessRoutine(routine);
        Task task = taskMapper.toEntity(routine, dto);
        routine.addTask(task);
        Task savedTask = taskRepository.save(Objects.requireNonNull(task, "task"));
        return taskMapper.toResponseDto(savedTask);
    }

    @Transactional(readOnly = true)
    public List<TaskResponseDto> getAllByRoutine(Long routineId) {
        Routine routine = loadRoutine(routineId);
        authenticatedUserService.assertCanAccessRoutine(routine);
        return taskRepository.findAllByRoutineId(routineId).stream()
                .map(taskMapper::toResponseDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public TaskResponseDto getById(Long routineId, Long taskId) {
        Task task = loadTaskForRoutine(routineId, taskId);
        return taskMapper.toResponseDto(task);
    }

    @Transactional
    public TaskResponseDto update(Long routineId, Long taskId, TaskUpdateRequestDto dto) {
        Task task = loadTaskForRoutine(routineId, taskId);
        taskMapper.applyUpdate(task, dto);
        Task updatedTask = taskRepository.save(Objects.requireNonNull(task, "task"));
        return taskMapper.toResponseDto(updatedTask);
    }

    @Transactional
    public void delete(Long routineId, Long taskId) {
        Task task = loadTaskForRoutine(routineId, taskId);
        task.getRoutine().removeTask(task);
        taskRepository.delete(Objects.requireNonNull(task, "task"));
    }

    private Routine loadRoutine(Long routineId) {
        return routineRepository.findById(Objects.requireNonNull(routineId, "routineId"))
                .orElseThrow(() -> new RoutineNotFoundException(routineId));
    }

    private Task loadTaskForRoutine(Long routineId, Long taskId) {
        Task task = taskRepository.findById(Objects.requireNonNull(taskId, "taskId"))
                .orElseThrow(() -> new TaskNotFoundException(taskId));

        if (!task.getRoutine().getId().equals(routineId)) {
            throw new TaskNotFoundException(taskId);
        }

        authenticatedUserService.assertCanAccessTask(task);

        return task;
    }
}
