package com.sathya.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

@FeignClient(name = "product-service")
public interface ProductFeignClient {
    @GetMapping("/api/products")
    Object getAllProducts();
}
