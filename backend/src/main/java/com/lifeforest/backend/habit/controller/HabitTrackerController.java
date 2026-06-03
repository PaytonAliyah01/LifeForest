package com.lifeforest.backend.habit.controller;

import com.lifeforest.backend.habit.dto.response.TodayHabitResponseDto;
import com.lifeforest.backend.habit.service.HabitTrackerService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/habits")
@RequiredArgsConstructor
public class HabitTrackerController {

    private final HabitTrackerService habitTrackerService;

    @GetMapping("/today")
    public List<TodayHabitResponseDto> getTodayHabits(@RequestParam Long userId) {
        return habitTrackerService.getTodayHabits(userId);
    }

    @PostMapping("/{taskId}/today")
    public TodayHabitResponseDto completeToday(@PathVariable Long taskId, @RequestParam Long userId) {
        return habitTrackerService.completeToday(userId, taskId);
    }

    @DeleteMapping("/{taskId}/today")
    public TodayHabitResponseDto uncompleteToday(@PathVariable Long taskId, @RequestParam Long userId) {
        return habitTrackerService.uncompleteToday(userId, taskId);
    }
}
