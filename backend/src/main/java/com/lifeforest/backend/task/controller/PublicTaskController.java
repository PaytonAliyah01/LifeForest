package com.lifeforest.backend.task.controller;

import com.lifeforest.backend.task.dto.request.TaskCreateForRoutineRequestDto;
import com.lifeforest.backend.task.dto.response.TaskResponseDto;
import com.lifeforest.backend.task.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class PublicTaskController {

    private final TaskService taskService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TaskResponseDto createTask(@Valid @RequestBody TaskCreateForRoutineRequestDto dto) {
        return taskService.create(dto.routineId(), dto.task());
    }
}
