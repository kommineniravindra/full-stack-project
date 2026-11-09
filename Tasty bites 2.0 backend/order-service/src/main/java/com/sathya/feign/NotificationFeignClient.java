package com.sathya.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import java.util.Map;

@FeignClient(name = "notification-service")
public interface NotificationFeignClient {

    @PostMapping("/api/notifications")
    Object createNotification(@RequestBody Map<String, String> request);
}
