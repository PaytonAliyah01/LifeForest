package com.lifeforest.backend.tree.mapper;

import com.lifeforest.backend.tree.domain.Tree;
import com.lifeforest.backend.tree.dto.response.TreeResponseDto;
import org.springframework.stereotype.Component;

@Component
public class TreeMapper {

    public TreeResponseDto toResponseDto(Tree tree) {
        return new TreeResponseDto(
                tree.getId(),
                tree.getUser().getId(),
                tree.getFocusSession() == null ? null : tree.getFocusSession().getId(),
                tree.getSpecies(),
                tree.getTreeType(),
                tree.getGrowthStage(),
                tree.getGrowthProgress(),
                tree.isDamaged(),
                tree.isCompleted(),
                tree.getCreatedAt(),
                tree.getUpdatedAt()
        );
    }
}
