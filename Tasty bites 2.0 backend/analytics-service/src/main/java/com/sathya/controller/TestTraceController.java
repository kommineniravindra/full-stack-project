package com.sathya.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.sathya.feign.OrderFeignClient;
import com.sathya.feign.ProductFeignClient;
import com.sathya.feign.AuthFeignClient;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics/test-trace")
public class TestTraceController {

    @Autowired
    private OrderFeignClient orderFeignClient;

    @Autowired
    private ProductFeignClient productFeignClient;

    @Autowired
    private AuthFeignClient authFeignClient;

    @GetMapping
    public Map<String, String> triggerAllServices() {
        Map<String, String> result = new HashMap<>();
        
        try {
            orderFeignClient.getAllOrders();
            result.put("order-service", "SUCCESS");
        } catch (Exception e) {
            result.put("order-service", "FAILED: " + e.getMessage());
        }

        try {
            productFeignClient.getAllProducts();
            result.put("product-service", "SUCCESS");
        } catch (Exception e) {
            result.put("product-service", "FAILED: " + e.getMessage());
        }

        try {
            authFeignClient.getAllUsers();
            result.put("auth-service", "SUCCESS");
        } catch (Exception e) {
            result.put("auth-service", "FAILED: " + e.getMessage());
        }

        return result;
    }
}
