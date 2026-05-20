package com.lifeforest.backend.task.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.lifeforest.backend.task.dto.request.TaskCreateForRoutineRequestDto;
import com.lifeforest.backend.task.dto.request.TaskCreateRequestDto;
import com.lifeforest.backend.task.dto.response.TaskResponseDto;
import com.lifeforest.backend.task.domain.TaskCategory;
import com.lifeforest.backend.task.service.TaskService;
import java.time.Instant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PublicTaskControllerTest {

    @Mock
    private TaskService taskService;

    private PublicTaskController publicTaskController;

    @BeforeEach
    void setUp() {
        publicTaskController = new PublicTaskController(taskService);
    }

    @Test
    void createTaskReturnsCreatedTask() {
        TaskCreateRequestDto taskRequest = new TaskCreateRequestDto(
            "Prepare desk",
            "Clear distractions before focus time",
            15,
            TaskCategory.GENERAL
        );
        TaskCreateForRoutineRequestDto request = new TaskCreateForRoutineRequestDto(8L, taskRequest);

        TaskResponseDto response = new TaskResponseDto(
            21L,
            8L,
            "Prepare desk",
            "Clear distractions before focus time",
            15,
            TaskCategory.GENERAL,
            false,
            Instant.parse("2026-05-08T12:00:00Z"),
            Instant.parse("2026-05-08T12:00:00Z")
        );

        when(taskService.create(8L, taskRequest)).thenReturn(response);

        TaskResponseDto result = publicTaskController.createTask(request);

        assertEquals(response, result);
        verify(taskService).create(8L, taskRequest);
    }
}
