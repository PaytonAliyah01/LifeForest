package com.lifeforest.backend.routine.service;

import com.lifeforest.backend.routine.domain.Routine;
import com.lifeforest.backend.routine.dto.request.RoutineCreateRequestDto;
import com.lifeforest.backend.routine.dto.request.RoutineUpdateRequestDto;
import com.lifeforest.backend.routine.dto.response.RoutineResponseDto;
import com.lifeforest.backend.routine.exception.RoutineNotFoundException;
import com.lifeforest.backend.routine.mapper.RoutineMapper;
import com.lifeforest.backend.routine.repository.RoutineRepository;
import com.lifeforest.backend.task.repository.TaskRepository;
import com.lifeforest.backend.user.domain.User;
import com.lifeforest.backend.user.exception.UserNotFoundException;
import com.lifeforest.backend.user.repository.UserRepository;
import java.util.List;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RoutineService {

    private static final String ROUTINE = "routine";

    private final RoutineRepository routineRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final RoutineMapper routineMapper;

    @Transactional
    public RoutineResponseDto create(Long userId, RoutineCreateRequestDto dto) {
        User user = userRepository.findById(Objects.requireNonNull(userId, "userId"))
                .orElseThrow(() -> new UserNotFoundException(userId));

        Routine routine = routineMapper.toEntity(user, dto);
        Routine savedRoutine = routineRepository.save(Objects.requireNonNull(routine, ROUTINE));
        return routineMapper.toResponseDto(savedRoutine);
    }

    @Transactional(readOnly = true)
    public List<RoutineResponseDto> getAllByUser(Long userId) {
        return routineRepository.findAllByUserId(userId).stream()
                .map(routineMapper::toResponseDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public RoutineResponseDto getById(Long userId, Long routineId) {
        Routine routine = loadRoutineForUser(userId, routineId);
        return routineMapper.toResponseDto(routine);
    }

    @Transactional
    public RoutineResponseDto update(Long userId, Long routineId, RoutineUpdateRequestDto dto) {
        Routine routine = loadRoutineForUser(userId, routineId);
        routineMapper.applyUpdate(routine, dto);
        Routine updatedRoutine = routineRepository.save(Objects.requireNonNull(routine, ROUTINE));
        return routineMapper.toResponseDto(updatedRoutine);
    }

    @Transactional
    public RoutineResponseDto updateById(Long routineId, RoutineUpdateRequestDto dto) {
        Routine routine = routineRepository.findById(Objects.requireNonNull(routineId, "routineId"))
                .orElseThrow(() -> new RoutineNotFoundException(routineId));

        routineMapper.applyUpdate(routine, dto);
        Routine updatedRoutine = routineRepository.save(Objects.requireNonNull(routine, ROUTINE));
        return routineMapper.toResponseDto(updatedRoutine);
    }

    @Transactional
    public void delete(Long userId, Long routineId) {
        Routine routine = loadRoutineForUser(userId, routineId);
        taskRepository.deleteAllByRoutineId(routine.getId());
        routineRepository.delete(Objects.requireNonNull(routine, ROUTINE));
    }

    @Transactional
    public void deleteById(Long routineId) {
        Routine routine = routineRepository.findById(Objects.requireNonNull(routineId, "routineId"))
                .orElseThrow(() -> new RoutineNotFoundException(routineId));

        taskRepository.deleteAllByRoutineId(routine.getId());
        routineRepository.delete(Objects.requireNonNull(routine, ROUTINE));
    }

    private Routine loadRoutineForUser(Long userId, Long routineId) {
        Routine routine = routineRepository.findById(Objects.requireNonNull(routineId, "routineId"))
                .orElseThrow(() -> new RoutineNotFoundException(routineId));

        if (!routine.getUser().getId().equals(userId)) {
            throw new RoutineNotFoundException(routineId);
        }

        return routine;
    }
}
