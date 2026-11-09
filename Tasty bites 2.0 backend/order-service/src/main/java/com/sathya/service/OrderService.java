package com.sathya.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.sathya.dto.OrderRequest;
import com.sathya.entity.Order;
import com.sathya.entity.OrderItem;
import com.sathya.entity.OrderStatus; // Ensure this import exists

import com.sathya.repository.OrderRepository;
import com.sathya.util.JwtUtil;
import jakarta.persistence.EntityNotFoundException;
import com.sathya.feign.ShippingFeignClient;
import com.sathya.feign.NotificationFeignClient;
import java.util.HashMap;
import java.util.Map;

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ShippingFeignClient shippingFeignClient;

    @Autowired
    private NotificationFeignClient notificationFeignClient;

    public Order placeOrder(OrderRequest request, String token) {
        Long userId = JwtUtil.extractUserId(token);

        Order order = new Order();
        order.setOrderDate(LocalDateTime.now());
        order.setUserId(userId);
        order.setTotalAmount(request.getTotalAmount());

        // --- START OF CORRECTED LOGIC FOR STATUS HANDLING ---
        String initialStatus = request.getStatus();
        if (initialStatus == null || initialStatus.trim().isEmpty()) {
            order.setStatus(OrderStatus.PENDING);
        } else {
            try {
                order.setStatus(OrderStatus.valueOf(initialStatus.toUpperCase()));
            } catch (IllegalArgumentException e) {
                order.setStatus(OrderStatus.PENDING);
                System.err.println("Warning: Invalid initial order status received ('" + initialStatus + "'). Defaulting to PENDING. Error: " + e.getMessage());
            }
        }
        // --- END OF CORRECTED LOGIC ---

        List<OrderItem> items = request.getCartItems().stream().map(item -> {
            OrderItem i = new OrderItem();
            i.setProductName(item.getProductName());
            i.setQuantity(item.getQuantity());
            i.setPrice(item.getPrice());
            i.setOrder(order); 
            return i;
        }).collect(Collectors.toList());

        order.setItems(items);

        Order savedOrder = orderRepository.save(order); 

        try {
            Map<String, String> notifReq = new HashMap<>();
            notifReq.put("userId", String.valueOf(userId));
            notifReq.put("title", "Order Placed Successfully!");
            notifReq.put("message", "Your order #" + savedOrder.getId() + " has been placed and is currently PENDING.");
            notificationFeignClient.createNotification(notifReq);
        } catch (Exception e) {
            System.err.println("Failed to trigger notification: " + e.getMessage());
        }
        return savedOrder;
    }

    public List<Order> getMyOrders(String token) {
        Long userId = JwtUtil.extractUserId(token);
        return orderRepository.findByUserId(userId);
    }

    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    public void updateOrderStatus(Long orderId, String newStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new EntityNotFoundException("Order not found with ID: " + orderId));

        try {
            OrderStatus statusEnum = OrderStatus.valueOf(newStatus.toUpperCase());
            order.setStatus(statusEnum);
            orderRepository.save(order);

            try {
                if ("ACCEPTED".equalsIgnoreCase(newStatus)) {
                    shippingFeignClient.createShippingRecord(orderId);
                }

                if ("DECLINED".equalsIgnoreCase(newStatus)) {
                    shippingFeignClient.updateShippingStatus(orderId, "DECLINED");
                }

                Map<String, String> notifReq = new HashMap<>();
                notifReq.put("userId", String.valueOf(order.getUserId()));
                notifReq.put("title", "Order Status Updated");
                notifReq.put("message", "Your order #" + order.getId() + " is now " + newStatus);
                notificationFeignClient.createNotification(notifReq);
            } catch (Exception e) {
                 System.err.println("Failed to trigger shipping/notification: " + e.getMessage());
            }
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid status provided: " + newStatus, e);
        }
    }
    public void deleteOrder(Long orderId) {
        if (!orderRepository.existsById(orderId)) {
            throw new EntityNotFoundException("Order not found with ID: " + orderId);
        }
        orderRepository.deleteById(orderId);
    }

}