package com.lifeforest.backend.task.controller;

import com.lifeforest.backend.task.dto.request.TaskCreateRequestDto;
import com.lifeforest.backend.task.dto.request.TaskUpdateRequestDto;
import com.lifeforest.backend.task.dto.response.TaskResponseDto;
import com.lifeforest.backend.task.service.TaskService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/routines/{routineId}/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TaskResponseDto createTask(
            @PathVariable Long routineId,
            @Valid @RequestBody TaskCreateRequestDto dto
    ) {
        return taskService.create(routineId, dto);
    }

    @GetMapping
    public List<TaskResponseDto> getTasks(@PathVariable Long routineId) {
        return taskService.getAllByRoutine(routineId);
    }

    @GetMapping("/{taskId}")
    public TaskResponseDto getTaskById(
            @PathVariable Long routineId,
            @PathVariable Long taskId
    ) {
        return taskService.getById(routineId, taskId);
    }

    @PutMapping("/{taskId}")
    public TaskResponseDto updateTask(
            @PathVariable Long routineId,
            @PathVariable Long taskId,
            @Valid @RequestBody TaskUpdateRequestDto dto
    ) {
        return taskService.update(routineId, taskId, dto);
    }

    @DeleteMapping("/{taskId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTask(
            @PathVariable Long routineId,
            @PathVariable Long taskId
    ) {
        taskService.delete(routineId, taskId);
    }
}