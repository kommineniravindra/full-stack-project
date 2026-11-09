package com.sathya.dto;

import lombok.Data;

@Data
public class CartItem {
    private String productName;
    private double price;
    private int quantity;
}