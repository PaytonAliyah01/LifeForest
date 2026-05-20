package com.lifeforest.backend.tree.controller;

import com.lifeforest.backend.tree.dto.response.TreeResponseDto;
import com.lifeforest.backend.tree.mapper.TreeMapper;
import com.lifeforest.backend.tree.service.TreeService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/trees")
@RequiredArgsConstructor
public class TreeController {

    private final TreeService treeService;
    private final TreeMapper treeMapper;

    @GetMapping
    public List<TreeResponseDto> getTrees(@RequestParam(required = false) Long userId) {
        if (userId != null) {
            return treeService.getAllByUser(userId).stream()
                    .map(treeMapper::toResponseDto)
                    .toList();
        }

        return treeService.getAll().stream()
                .map(treeMapper::toResponseDto)
                .toList();
    }

    @GetMapping("/{treeId}")
    public TreeResponseDto getTreeById(@PathVariable Long treeId) {
        return treeMapper.toResponseDto(treeService.getById(treeId));
    }
}
