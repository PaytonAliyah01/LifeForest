package com.lifeforest.backend.focussession.controller;

import com.lifeforest.backend.focussession.domain.FocusSession;
import com.lifeforest.backend.focussession.dto.request.FocusSessionStartRequestDto;
import com.lifeforest.backend.focussession.dto.response.FocusSessionResponseDto;
import com.lifeforest.backend.focussession.mapper.FocusSessionMapper;
import com.lifeforest.backend.focussession.service.FocusSessionService;
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
@RequestMapping("/api/focus-sessions")
@RequiredArgsConstructor
public class FocusSessionController {

    private final FocusSessionService focusSessionService;
    private final FocusSessionMapper focusSessionMapper;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public FocusSessionResponseDto createFocusSession(@RequestBody FocusSession focusSession) {
        return focusSessionMapper.toResponseDto(focusSessionService.create(focusSession));
    }

    @PostMapping("/start")
    @ResponseStatus(HttpStatus.CREATED)
    public FocusSessionResponseDto startFocusSession(@RequestBody FocusSessionStartRequestDto dto) {
        return focusSessionMapper.toResponseDto(focusSessionService.start(dto.userId(), dto.taskId()));
    }

    @PostMapping("/{id}/complete")
    public FocusSessionResponseDto completeFocusSession(@PathVariable Long id) {
        return focusSessionMapper.toResponseDto(focusSessionService.complete(id));
    }

    @PostMapping("/{id}/interrupt")
    public FocusSessionResponseDto interruptFocusSession(@PathVariable Long id) {
        return focusSessionMapper.toResponseDto(focusSessionService.interrupt(id));
    }

    @GetMapping
    public List<FocusSessionResponseDto> getFocusSessions(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Long taskId
    ) {
        if (userId != null) {
            return focusSessionService.getAllByUser(userId).stream()
                    .map(focusSessionMapper::toResponseDto)
                    .toList();
        }

        if (taskId != null) {
            return focusSessionService.getAllByTask(taskId).stream()
                    .map(focusSessionMapper::toResponseDto)
                    .toList();
        }

        return focusSessionService.getAll().stream()
                .map(focusSessionMapper::toResponseDto)
                .toList();
    }

    @GetMapping("/{id}")
    public FocusSessionResponseDto getFocusSessionById(@PathVariable Long id) {
        return focusSessionMapper.toResponseDto(focusSessionService.getById(id));
    }

    @PutMapping("/{id}")
    public FocusSessionResponseDto updateFocusSession(
            @PathVariable Long id,
            @RequestBody FocusSession focusSession
    ) {
        return focusSessionMapper.toResponseDto(focusSessionService.update(id, focusSession));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteFocusSession(@PathVariable Long id) {
        focusSessionService.delete(id);
    }
}
