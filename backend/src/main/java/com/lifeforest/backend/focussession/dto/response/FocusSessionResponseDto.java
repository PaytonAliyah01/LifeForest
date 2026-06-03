package com.lifeforest.backend.focussession.dto.response;

import com.lifeforest.backend.tree.domain.TreeType;
import java.time.Instant;

public record FocusSessionResponseDto(
        Long id,
        Long userId,
        Long taskId,
        Instant startedAt,
        Instant endedAt,
        Integer duration,
        TreeType treeType,
        boolean completed,
        boolean interrupted
) {
}
