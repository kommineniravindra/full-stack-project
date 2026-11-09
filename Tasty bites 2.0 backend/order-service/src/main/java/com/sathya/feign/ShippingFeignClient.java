package com.sathya.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "shipping-service")
public interface ShippingFeignClient {

    @PostMapping("/api/shipping/{orderId}")
    Object createShippingRecord(@PathVariable("orderId") Long orderId);

    @PutMapping("/api/shipping/{orderId}/status")
    Object updateShippingStatus(@PathVariable("orderId") Long orderId, @RequestParam("status") String status);
}
