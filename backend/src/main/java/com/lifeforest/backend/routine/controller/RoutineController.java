package com.lifeforest.backend.routine.controller;

import com.lifeforest.backend.routine.dto.request.RoutineCreateRequestDto;
import com.lifeforest.backend.routine.dto.request.RoutineUpdateRequestDto;
import com.lifeforest.backend.routine.dto.response.RoutineResponseDto;
import com.lifeforest.backend.routine.service.RoutineService;
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
@RequestMapping("/api/users/{userId}/routines")
@RequiredArgsConstructor
public class RoutineController {

    private final RoutineService routineService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RoutineResponseDto createRoutine(
            @PathVariable Long userId,
            @Valid @RequestBody RoutineCreateRequestDto dto
    ) {
        return routineService.create(userId, dto);
    }

    @GetMapping
    public List<RoutineResponseDto> getRoutines(@PathVariable Long userId) {
        return routineService.getAllByUser(userId);
    }

    @GetMapping("/{routineId}")
    public RoutineResponseDto getRoutineById(
            @PathVariable Long userId,
            @PathVariable Long routineId
    ) {
        return routineService.getById(userId, routineId);
    }

    @PutMapping("/{routineId}")
    public RoutineResponseDto updateRoutine(
            @PathVariable Long userId,
            @PathVariable Long routineId,
            @Valid @RequestBody RoutineUpdateRequestDto dto
    ) {
        return routineService.update(userId, routineId, dto);
    }

    @DeleteMapping("/{routineId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRoutine(
            @PathVariable Long userId,
            @PathVariable Long routineId
    ) {
        routineService.delete(userId, routineId);
    }
}