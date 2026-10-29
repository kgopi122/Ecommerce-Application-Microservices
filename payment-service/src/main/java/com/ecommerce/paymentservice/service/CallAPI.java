package com.ecommerce.paymentservice.service;

import com.ecommerce.paymentservice.dto.OrderDto;
import com.ecommerce.paymentservice.dto.UserDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
@RequiredArgsConstructor
public class CallAPI {

    private final RestClient.Builder restClientBuilder;

    private String resolveAuthHeader(String token) {
        if (token == null || token.isBlank()) {
            return "";
        }
        return token.startsWith("Bearer ") ? token : "Bearer " + token;
    }

    public OrderDto receiverPaymentDto(Integer orderId, String token) {
        String baseUrl = System.getenv().getOrDefault("ORDER_SERVICE_URL", "http://order-service:8084/order");
        return restClientBuilder.baseUrl(baseUrl).build()
                .get()
                .uri("/api/orders/{id}", orderId)
                .header(HttpHeaders.AUTHORIZATION, resolveAuthHeader(token))
                .retrieve()
                .body(OrderDto.class);
    }

    public UserDto receiverUserDto(Long userId, String token) {
        String baseUrl = System.getenv().getOrDefault("AUTH_SERVICE_URL", "http://auth-service:8088");
        return restClientBuilder.baseUrl(baseUrl).build()
                .get()
                .uri("/api/manager/user/{id}", userId)
                .header(HttpHeaders.AUTHORIZATION, resolveAuthHeader(token))
                .retrieve()
                .body(UserDto.class);
    }
}
