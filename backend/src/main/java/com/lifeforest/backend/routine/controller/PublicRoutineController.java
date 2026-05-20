package com.lifeforest.backend.routine.controller;

import com.lifeforest.backend.routine.dto.request.RoutineCreateForUserRequestDto;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/routines")
@RequiredArgsConstructor
public class PublicRoutineController {

    private final RoutineService routineService;

    @GetMapping
    public List<RoutineResponseDto> getRoutinesByUser(@RequestParam Long userId) {
        return routineService.getAllByUser(userId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RoutineResponseDto createRoutine(
            @Valid @RequestBody RoutineCreateForUserRequestDto dto
    ) {
        return routineService.create(dto.userId(), dto.routine());
    }

    @PutMapping("/{id}")
    public RoutineResponseDto updateRoutineById(
            @PathVariable Long id,
            @Valid @RequestBody RoutineUpdateRequestDto dto
    ) {
        return routineService.updateById(id, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRoutineById(@PathVariable Long id) {
        routineService.deleteById(id);
    }
}
