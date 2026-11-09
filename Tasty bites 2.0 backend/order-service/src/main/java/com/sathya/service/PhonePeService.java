package com.sathya.service;

import java.security.MessageDigest;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sathya.entity.Order;
import com.sathya.repository.OrderRepository;

@Service
public class PhonePeService {

    @Autowired
    private OrderRepository orderRepository;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final String MERCHANT_ID = "PGPLAYVALUETEST";
    private final String SALT_KEY = "099eb0cd-02cf-4e2a-8aca-3e6c6aff0399";
    private final String SALT_INDEX = "1";
    private final String PHONEPE_BASE_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox";

    public Map<String, Object> initiatePayment(Long orderId) {
        Map<String, Object> responseMap = new HashMap<>();
        try {
            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new RuntimeException("Order not found with ID: " + orderId));

            String txnId = "TXN_" + orderId + "_" + System.currentTimeMillis();

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("merchantId", MERCHANT_ID);
            requestBody.put("merchantTransactionId", txnId);
            requestBody.put("merchantUserId", "U" + order.getUserId());
            requestBody.put("amount", (long) (order.getTotalAmount() * 100)); // amount in paise
            requestBody.put("redirectUrl", "http://localhost:5173/payment-callback?orderId=" + orderId);
            requestBody.put("redirectMode", "REDIRECT");

            Map<String, Object> paymentInstrument = new HashMap<>();
            paymentInstrument.put("type", "PAY_PAGE");
            requestBody.put("paymentInstrument", paymentInstrument);

            String jsonPayload = objectMapper.writeValueAsString(requestBody);
            String base64Payload = Base64.getEncoder().encodeToString(jsonPayload.getBytes("UTF-8"));

            String xVerify = generateXVerify(base64Payload, "/pg/v1/pay", SALT_KEY, SALT_INDEX);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-VERIFY", xVerify);

            Map<String, String> requestWrapper = new HashMap<>();
            requestWrapper.put("request", base64Payload);

            HttpEntity<Map<String, String>> entity = new HttpEntity<>(requestWrapper, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    PHONEPE_BASE_URL + "/pg/v1/pay",
                    entity,
                    Map.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                if (Boolean.TRUE.equals(body.get("success"))) {
                    Map<String, Object> data = (Map<String, Object>) body.get("data");
                    Map<String, Object> instrumentResponse = (Map<String, Object>) data.get("instrumentResponse");
                    Map<String, Object> redirectInfo = (Map<String, Object>) instrumentResponse.get("redirectInfo");
                    String redirectUrl = (String) redirectInfo.get("url");

                    responseMap.put("success", true);
                    responseMap.put("redirectUrl", redirectUrl);
                    responseMap.put("transactionId", txnId);
                    return responseMap;
                }
            }

            responseMap.put("success", false);
            responseMap.put("message", "Failed to initiate payment with PhonePe API");
        } catch (Exception e) {
            e.printStackTrace();
            responseMap.put("success", false);
            responseMap.put("message", "Error initiating payment: " + e.getMessage());
        }
        return responseMap;
    }

    public Map<String, Object> checkPaymentStatus(String transactionId) {
        Map<String, Object> responseMap = new HashMap<>();
        try {
            String path = "/pg/v1/status/" + MERCHANT_ID + "/" + transactionId;
            String xVerify = generateXVerify("", path, SALT_KEY, SALT_INDEX);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-VERIFY", xVerify);
            headers.set("X-MERCHANT-ID", MERCHANT_ID);

            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                    PHONEPE_BASE_URL + path,
                    HttpMethod.GET,
                    entity,
                    Map.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                if (Boolean.TRUE.equals(body.get("success"))) {
                    String code = (String) body.get("code");
                    if ("PAYMENT_SUCCESS".equals(code)) {
                        responseMap.put("success", true);
                        responseMap.put("code", code);
                        return responseMap;
                    }
                }
                responseMap.put("success", false);
                responseMap.put("code", body.get("code"));
                responseMap.put("message", body.get("message"));
            } else {
                responseMap.put("success", false);
                responseMap.put("message", "Failed to contact PhonePe status API");
            }
        } catch (Exception e) {
            e.printStackTrace();
            responseMap.put("success", false);
            responseMap.put("message", "Error checking status: " + e.getMessage());
        }
        return responseMap;
    }

    private String generateXVerify(String body, String apiPath, String saltKey, String saltIndex) throws Exception {
        String data = body + apiPath + saltKey;
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(data.getBytes("UTF-8"));
        StringBuilder hexString = new StringBuilder();
        for (byte b : hash) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) hexString.append('0');
            hexString.append(hex);
        }
        return hexString.toString() + "###" + saltIndex;
    }
}
