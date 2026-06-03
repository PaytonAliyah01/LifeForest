package com.lifeforest.backend.achievement.controller;

import com.lifeforest.backend.achievement.dto.response.AchievementsResponseDto;
import com.lifeforest.backend.achievement.service.AchievementsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/achievements")
@RequiredArgsConstructor
public class AchievementsController {

    private final AchievementsService achievementsService;

    @GetMapping
    public AchievementsResponseDto getAchievements(@RequestParam Long userId) {
        return achievementsService.getAchievements(userId);
    }
}
