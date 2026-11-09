package com.sathya.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RevenueBreakdownDTO {
    private String label;
    private double totalRevenue;
}
