package com.lifeforest.backend.tree.dto.response;

import com.lifeforest.backend.tree.domain.TreeType;
import java.time.Instant;

public record TreeResponseDto(
    Long id,
    Long userId,
    Long focusSessionId,
    String species,
    TreeType treeType,
    int growthStage,
    int growthProgress,
    boolean damaged,
    boolean completed,
    Instant createdAt,
    Instant updatedAt
) {}
