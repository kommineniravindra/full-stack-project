package com.sathya.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.sathya.service.PhonePeService;

@RestController
@RequestMapping("/api/orders/payment")
public class PhonePeController {

    @Autowired
    private PhonePeService phonePeService;

    @PostMapping("/initiate/{orderId}")
    public ResponseEntity<Map<String, Object>> initiatePayment(@PathVariable Long orderId) {
        Map<String, Object> result = phonePeService.initiatePayment(orderId);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/status/{transactionId}")
    public ResponseEntity<Map<String, Object>> checkPaymentStatus(@PathVariable String transactionId) {
        Map<String, Object> result = phonePeService.checkPaymentStatus(transactionId);
        return ResponseEntity.ok(result);
    }
}
