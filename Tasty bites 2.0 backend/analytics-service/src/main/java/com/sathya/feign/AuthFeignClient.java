package com.sathya.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

@FeignClient(name = "auth-service")
public interface AuthFeignClient {
    @GetMapping("/api/auth/users/all")
    Object getAllUsers();
}
