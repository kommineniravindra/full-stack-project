package com.sathya.shipping.service;

import com.sathya.shipping.model.Shipping;
import com.sathya.shipping.repository.ShippingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.UUID;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class ShippingService {

    @Autowired
    private ShippingRepository shippingRepository;

    public Shipping createShippingRecord(Long orderId) {
        if (shippingRepository.findByOrderId(orderId).isPresent()) {
            throw new RuntimeException("Shipping record already exists for order " + orderId);
        }

        Shipping shipping = new Shipping();
        shipping.setOrderId(orderId);
        shipping.setStatus("PENDING");
        shipping.setTrackingNumber("TB-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        shipping.setEstimatedDelivery(LocalDateTime.now().plusDays(3));

        return shippingRepository.save(shipping);
    }

    public List<Shipping> getAllShippingRecords() {
        return shippingRepository.findAll();
    }

    public Shipping getShippingByOrderId(Long orderId) {
        return shippingRepository.findByOrderId(orderId)
                .orElseThrow(() -> new RuntimeException("Shipping not found for order " + orderId));
    }

    public Shipping updateShippingStatus(Long orderId, String newStatus) {
        Shipping shipping = getShippingByOrderId(orderId);
        shipping.setStatus(newStatus);
        return shippingRepository.save(shipping);
    }
}
