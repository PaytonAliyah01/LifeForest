package com.lifeforest.backend.focussession.controller;

import com.lifeforest.backend.focussession.domain.FocusSession;
import com.lifeforest.backend.focussession.dto.request.FocusSessionStartRequestDto;
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

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public FocusSession createFocusSession(@RequestBody FocusSession focusSession) {
        return focusSessionService.create(focusSession);
    }

    @PostMapping("/start")
    @ResponseStatus(HttpStatus.CREATED)
    public FocusSession startFocusSession(@RequestBody FocusSessionStartRequestDto dto) {
        return focusSessionService.start(dto.userId(), dto.taskId());
    }

    @PostMapping("/{id}/complete")
    public FocusSession completeFocusSession(@PathVariable Long id) {
        return focusSessionService.complete(id);
    }

    @PostMapping("/{id}/interrupt")
    public FocusSession interruptFocusSession(@PathVariable Long id) {
        return focusSessionService.interrupt(id);
    }

    @GetMapping
    public List<FocusSession> getFocusSessions(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Long taskId
    ) {
        if (userId != null) {
            return focusSessionService.getAllByUser(userId);
        }

        if (taskId != null) {
            return focusSessionService.getAllByTask(taskId);
        }

        return focusSessionService.getAll();
    }

    @GetMapping("/{id}")
    public FocusSession getFocusSessionById(@PathVariable Long id) {
        return focusSessionService.getById(id);
    }

    @PutMapping("/{id}")
    public FocusSession updateFocusSession(
            @PathVariable Long id,
            @RequestBody FocusSession focusSession
    ) {
        return focusSessionService.update(id, focusSession);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteFocusSession(@PathVariable Long id) {
        focusSessionService.delete(id);
    }
}
