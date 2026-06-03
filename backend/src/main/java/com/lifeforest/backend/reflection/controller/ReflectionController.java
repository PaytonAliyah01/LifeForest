package com.lifeforest.backend.reflection.controller;

import com.lifeforest.backend.reflection.domain.Reflection;
import com.lifeforest.backend.reflection.dto.request.ReflectionCreateRequestDto;
import com.lifeforest.backend.reflection.dto.response.ReflectionResponseDto;
import com.lifeforest.backend.reflection.mapper.ReflectionMapper;
import com.lifeforest.backend.reflection.service.ReflectionService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reflections")
@RequiredArgsConstructor
public class ReflectionController {

    private final ReflectionService reflectionService;
    private final ReflectionMapper reflectionMapper;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ReflectionResponseDto createReflection(@Valid @RequestBody ReflectionCreateRequestDto dto) {
        return reflectionMapper.toResponseDto(reflectionService.create(dto.userId(), dto));
    }

    @GetMapping
    public List<ReflectionResponseDto> getReflections(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Long focusSessionId
    ) {
        if (userId != null) {
            return reflectionService.getAllByUser(userId).stream()
                    .map(reflectionMapper::toResponseDto)
                    .toList();
        }

        if (focusSessionId != null) {
            return List.of(reflectionMapper.toResponseDto(reflectionService.getByFocusSession(focusSessionId)));
        }

        return reflectionService.getAll().stream()
                .map(reflectionMapper::toResponseDto)
                .toList();
    }

    @GetMapping("/{id}")
    public ReflectionResponseDto getReflectionById(@PathVariable Long id) {
        return reflectionMapper.toResponseDto(reflectionService.getById(id));
    }

    @PutMapping("/{id}")
    public ReflectionResponseDto updateReflection(@PathVariable Long id, @RequestBody Reflection reflection) {
        return reflectionMapper.toResponseDto(reflectionService.update(id, reflection));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteReflection(@PathVariable Long id) {
        reflectionService.delete(id);
    }
}
