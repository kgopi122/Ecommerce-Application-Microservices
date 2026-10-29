package com.ecommerce.orderservice.service;

import com.ecommerce.orderservice.dto.product.ProductDto;
import com.ecommerce.orderservice.dto.user.UserDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
@RequiredArgsConstructor
public class CallAPI {

    private final RestClient.Builder restClientBuilder;

    public UserDto receiverUserDto(Long userId, String token) {
        String baseUrl = System.getenv().getOrDefault("AUTH_SERVICE_URL", "http://auth-service:8088");
        return restClientBuilder.baseUrl(baseUrl).build()
                .get()
                .uri("/api/manager/user/{id}", userId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .retrieve()
                .body(UserDto.class);
    }

    public ProductDto receiverProductDto(Integer productId) {
        String baseUrl = System.getenv().getOrDefault("PRODUCT_SERVICE_URL", "http://product-service:8086/product");
        return restClientBuilder.baseUrl(baseUrl).build()
                .get()
                .uri("/api/products/{id}", productId)
                .retrieve()
                .body(ProductDto.class);
    }
}
