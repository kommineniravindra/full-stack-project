package com.sathya.service;

import com.sathya.feign.OrderFeignClient;
import com.sathya.model.*;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.WeekFields;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final OrderFeignClient orderFeignClient;

    public AnalyticsResult generateAnalyticsSummary() {
        List<OrderDTO> orders = orderFeignClient.getAllOrders();

        double totalRevenue = 0;
        int totalOrders = orders.size();
        Map<String, Integer> productSales = new HashMap<>();

        for (OrderDTO order : orders) {
            totalRevenue += order.getTotalAmount();
            for (OrderItemDTO item : order.getItems()) {
                productSales.put(
                    item.getProductName(),
                    productSales.getOrDefault(item.getProductName(), 0) + item.getQuantity()
                );
            }
        }

        List<String> topSellingItems = productSales.entrySet()
                .stream()
                .sorted((a, b) -> b.getValue().compareTo(a.getValue()))
                .limit(3)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());

        return AnalyticsResult.builder()
                .totalRevenue(totalRevenue)
                .totalOrders(totalOrders)
                .topSellingItems(topSellingItems)
                .build();
    }

    public List<RevenueBreakdownDTO> getDailyRevenue() {
        List<OrderDTO> orders = orderFeignClient.getAllOrders();

        Map<LocalDate, Double> dailyRevenue = new TreeMap<>();
        for (OrderDTO order : orders) {
            LocalDate date = order.getOrderDate().toInstant()
                    .atZone(ZoneId.systemDefault()).toLocalDate();
            dailyRevenue.put(date,
                    dailyRevenue.getOrDefault(date, 0.0) + order.getTotalAmount());
        }

        return dailyRevenue.entrySet().stream()
                .map(entry -> new RevenueBreakdownDTO(entry.getKey().toString(), entry.getValue()))
                .collect(Collectors.toList());
    }

    public List<RevenueBreakdownDTO> getWeeklyRevenue() {
        List<OrderDTO> orders = orderFeignClient.getAllOrders();
        WeekFields weekFields = WeekFields.of(Locale.getDefault());

        Map<String, Double> weeklyRevenue = new TreeMap<>();
        for (OrderDTO order : orders) {
            LocalDate date = order.getOrderDate().toInstant()
                    .atZone(ZoneId.systemDefault()).toLocalDate();
            int week = date.get(weekFields.weekOfWeekBasedYear());
            String label = "Week " + week;
            weeklyRevenue.put(label,
                    weeklyRevenue.getOrDefault(label, 0.0) + order.getTotalAmount());
        }

        return weeklyRevenue.entrySet().stream()
                .map(entry -> new RevenueBreakdownDTO(entry.getKey(), entry.getValue()))
                .collect(Collectors.toList());
    }
}
