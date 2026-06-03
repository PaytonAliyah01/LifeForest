package com.lifeforest.backend.focussession.mapper;

import com.lifeforest.backend.focussession.domain.FocusSession;
import com.lifeforest.backend.focussession.dto.response.FocusSessionResponseDto;
import org.springframework.stereotype.Component;

@Component
public class FocusSessionMapper {

    public FocusSessionResponseDto toResponseDto(FocusSession focusSession) {
        return new FocusSessionResponseDto(
                focusSession.getId(),
                focusSession.getUser() == null ? null : focusSession.getUser().getId(),
                focusSession.getTask() == null ? null : focusSession.getTask().getId(),
                focusSession.getStartedAt(),
                focusSession.getEndedAt(),
                focusSession.getDuration(),
                focusSession.getTreeType(),
                focusSession.isCompleted(),
                focusSession.isInterrupted()
        );
    }
}
