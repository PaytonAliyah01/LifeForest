package com.lifeforest.backend.routine.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.lifeforest.backend.routine.dto.request.RoutineCreateForUserRequestDto;
import com.lifeforest.backend.routine.dto.request.RoutineCreateRequestDto;
import com.lifeforest.backend.routine.dto.request.RoutineUpdateRequestDto;
import com.lifeforest.backend.routine.dto.response.RoutineResponseDto;
import com.lifeforest.backend.routine.service.RoutineService;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PublicRoutineControllerTest {

    @Mock
    private RoutineService routineService;

    private PublicRoutineController publicRoutineController;

    @BeforeEach
    void setUp() {
        publicRoutineController = new PublicRoutineController(routineService);
    }

    @Test
    void getRoutinesByUserReturnsUserRoutines() {
        List<RoutineResponseDto> response = List.of(
            new RoutineResponseDto(
                1L,
                7L,
                "Morning reset",
                "Stretch and journal",
                false,
                Instant.parse("2026-05-08T08:00:00Z"),
                Instant.parse("2026-05-08T08:00:00Z")
            )
        );

        when(routineService.getAllByUser(7L)).thenReturn(response);

        List<RoutineResponseDto> result = publicRoutineController.getRoutinesByUser(7L);

        assertEquals(response, result);
        verify(routineService).getAllByUser(7L);
    }

    @Test
    void createRoutineReturnsCreatedRoutine() {
        RoutineCreateRequestDto routineRequest = new RoutineCreateRequestDto(
            "Deep Work",
            "Focus block before lunch"
        );
        RoutineCreateForUserRequestDto request = new RoutineCreateForUserRequestDto(3L, routineRequest);

        RoutineResponseDto response = new RoutineResponseDto(
            11L,
            3L,
            "Deep Work",
            "Focus block before lunch",
            false,
            Instant.parse("2026-05-08T08:00:00Z"),
            Instant.parse("2026-05-08T08:00:00Z")
        );

        when(routineService.create(3L, routineRequest)).thenReturn(response);

        RoutineResponseDto result = publicRoutineController.createRoutine(request);

        assertEquals(response, result);
        verify(routineService).create(3L, routineRequest);
    }

    @Test
    void updateRoutineByIdReturnsUpdatedRoutine() {
        RoutineUpdateRequestDto request = new RoutineUpdateRequestDto(
            "Evening reset",
            "Review the day",
            true
        );

        RoutineResponseDto response = new RoutineResponseDto(
            12L,
            5L,
            "Evening reset",
            "Review the day",
            true,
            Instant.parse("2026-05-08T08:00:00Z"),
            Instant.parse("2026-05-08T09:00:00Z")
        );

        when(routineService.updateById(12L, request)).thenReturn(response);

        RoutineResponseDto result = publicRoutineController.updateRoutineById(12L, request);

        assertEquals(response, result);
        verify(routineService).updateById(12L, request);
    }

    @Test
    void deleteRoutineByIdDelegatesToService() {
        publicRoutineController.deleteRoutineById(13L);

        verify(routineService).deleteById(13L);
    }
}
