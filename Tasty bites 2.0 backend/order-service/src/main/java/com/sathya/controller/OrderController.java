package com.sathya.controller;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.sathya.dto.OrderDTO;
import com.sathya.dto.OrderItemDTO;
import com.sathya.dto.OrderRequest;
import com.sathya.entity.Order;
import com.sathya.service.OrderService;

import jakarta.persistence.EntityNotFoundException;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @PostMapping("/place")
    public ResponseEntity<Order> placeOrder(@RequestBody OrderRequest orderRequest,
                                             @RequestHeader("Authorization") String token) {
        Order savedOrder = orderService.placeOrder(orderRequest, token);
        return ResponseEntity.ok(savedOrder);
    }

    @GetMapping("/my")
    public ResponseEntity<List<Order>> getMyOrders(@RequestHeader("Authorization") String token) {
        return ResponseEntity.ok(orderService.getMyOrders(token));
    }

    @GetMapping("/all")
    public ResponseEntity<List<OrderDTO>> getAllOrders() {
        List<Order> orders = orderService.getAllOrders();

        List<OrderDTO> orderDTOs = orders.stream().map(order -> {
            List<OrderItemDTO> itemDTOs = order.getItems().stream().map(item ->
                new OrderItemDTO(item.getProductName(), item.getQuantity(), item.getPrice())
            ).collect(Collectors.toList());

            return new OrderDTO(
                order.getId(),
                order.getUserId(),
                itemDTOs,
                order.getTotalAmount(),
                order.getOrderDate(),
                order.getStatus() != null ? order.getStatus().name() : "UNKNOWN"
            );
        }).collect(Collectors.toList());

        return ResponseEntity.ok(orderDTOs);
    }

    @PutMapping("/{orderId}/status")
    public ResponseEntity<String> updateOrderStatus(@PathVariable Long orderId,
                                                    @RequestBody Map<String, String> statusUpdate) {
        String status = statusUpdate.get("status");
        if (status == null || status.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Status cannot be empty.");
        }
        orderService.updateOrderStatus(orderId, status);
        return ResponseEntity.ok("Order status updated successfully!");
    }

    @DeleteMapping("/{orderId}")
    public ResponseEntity<String> deleteOrder(@PathVariable Long orderId) {
        try {
            orderService.deleteOrder(orderId);
            return ResponseEntity.ok("Order deleted successfully!");
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Failed to delete order: " + e.getMessage());
        }
    }
}