package com.sathya.model;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnalyticsResult {
    private double totalRevenue;
    private int totalOrders;
    private List<String> topSellingItems;
}
