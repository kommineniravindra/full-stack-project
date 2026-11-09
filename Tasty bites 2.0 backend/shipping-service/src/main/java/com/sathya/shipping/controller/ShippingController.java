package com.sathya.shipping.controller;

import com.sathya.shipping.model.Shipping;
import com.sathya.shipping.service.ShippingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/shipping")
public class ShippingController {

    @Autowired
    private ShippingService shippingService;

    @PostMapping("/{orderId}")
    public ResponseEntity<Shipping> createShippingRecord(@PathVariable Long orderId) {
        return ResponseEntity.ok(shippingService.createShippingRecord(orderId));
    }

    @GetMapping
    public ResponseEntity<List<Shipping>> getAllShippingRecords() {
        return ResponseEntity.ok(shippingService.getAllShippingRecords());
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<Shipping> getShippingByOrderId(@PathVariable Long orderId) {
        return ResponseEntity.ok(shippingService.getShippingByOrderId(orderId));
    }

    @PutMapping("/{orderId}/status")
    public ResponseEntity<Shipping> updateShippingStatus(@PathVariable Long orderId, @RequestParam String status) {
        return ResponseEntity.ok(shippingService.updateShippingStatus(orderId, status));
    }
}
