package com.lifeforest.backend.analytics.controller;

import com.lifeforest.backend.analytics.dto.response.AnalyticsResponseDto;
import com.lifeforest.backend.analytics.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping
    public AnalyticsResponseDto getAnalytics(@RequestParam Long userId) {
        return analyticsService.getProductivityMetrics(userId);
    }
}
