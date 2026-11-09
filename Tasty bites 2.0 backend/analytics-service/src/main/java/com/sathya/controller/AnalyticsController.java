package com.sathya.controller;

import com.sathya.model.AnalyticsResult;
import com.sathya.model.RevenueBreakdownDTO;
import com.sathya.service.AnalyticsService;

import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/analytics")

public class AnalyticsController {
  @Autowired
    private AnalyticsService analyticsService;

    @GetMapping("/summary")
    public AnalyticsResult getAnalyticsSummary() {
        return analyticsService.generateAnalyticsSummary();
    }

    @GetMapping("/daily-revenue")
    public List<RevenueBreakdownDTO> getDailyRevenue() {
        return analyticsService.getDailyRevenue();
    }

    @GetMapping("/weekly-revenue")
    public List<RevenueBreakdownDTO> getWeeklyRevenue() {
        return analyticsService.getWeeklyRevenue();
    }
}
