package com.ecommerce.shippingservice.service.impl;

import com.ecommerce.shippingservice.constant.AppConstant;
import com.ecommerce.shippingservice.domain.id.OrderItemId;
import com.ecommerce.shippingservice.dto.OrderDto;
import com.ecommerce.shippingservice.dto.OrderItemDto;
import com.ecommerce.shippingservice.dto.ProductDto;
import com.ecommerce.shippingservice.exception.wrapper.OrderItemNotFoundException;
import com.ecommerce.shippingservice.helper.OrderItemMappingHelper;
import com.ecommerce.shippingservice.repository.OrderItemRepository;
import com.ecommerce.shippingservice.service.OrderItemService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderItemServiceImpl implements OrderItemService {

    private static final Logger log = LoggerFactory.getLogger(OrderItemServiceImpl.class);

    private final OrderItemRepository orderItemRepository;
    private final RestClient.Builder restClientBuilder;

    private String getProductServiceApiUrl() {
        String envApi = System.getenv("PRODUCT_SERVICE_API_URL");
        if (envApi != null && !envApi.isBlank()) {
            return envApi;
        }
        String envBase = System.getenv("PRODUCT_SERVICE_URL");
        if (envBase != null && !envBase.isBlank()) {
            return envBase.endsWith("/") ? envBase + "api/products" : envBase + "/api/products";
        }
        return AppConstant.DiscoveredDomainsApi.PRODUCT_SERVICE_API_URL;
    }

    private String getOrderServiceApiUrl() {
        String envApi = System.getenv("ORDER_SERVICE_API_URL");
        if (envApi != null && !envApi.isBlank()) {
            return envApi;
        }
        String envBase = System.getenv("ORDER_SERVICE_URL");
        if (envBase != null && !envBase.isBlank()) {
            return envBase.endsWith("/") ? envBase + "api/orders" : envBase + "/api/orders";
        }
        return AppConstant.DiscoveredDomainsApi.ORDER_SERVICE_API_URL;
    }

    private String resolveBearerToken() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth instanceof JwtAuthenticationToken jwtAuth) {
                return "Bearer " + jwtAuth.getToken().getTokenValue();
            }
        } catch (Exception ignored) {
        }
        return null;
    }

    private void enrichOrderItem(OrderItemDto o, RestClient restClient, String bearerToken) {
        if (o == null) {
            return;
        }
        if (o.getProductDto() != null && o.getProductDto().getProductId() != null) {
            try {
                var req = restClient.get()
                        .uri(getProductServiceApiUrl() + "/{id}", o.getProductDto().getProductId());
                if (bearerToken != null && !bearerToken.isBlank()) {
                    req.header(HttpHeaders.AUTHORIZATION, bearerToken);
                }
                ProductDto product = req.retrieve().body(ProductDto.class);
                if (product != null) {
                    o.setProductDto(product);
                }
            } catch (Exception e) {
                log.error("Error fetching product {} for orderItem: {}", o.getProductDto().getProductId(), e.getMessage());
            }
        }
        if (o.getOrderDto() != null && o.getOrderDto().getOrderId() != null) {
            try {
                var req = restClient.get()
                        .uri(getOrderServiceApiUrl() + "/{id}", o.getOrderDto().getOrderId());
                if (bearerToken != null && !bearerToken.isBlank()) {
                    req.header(HttpHeaders.AUTHORIZATION, bearerToken);
                }
                OrderDto order = req.retrieve().body(OrderDto.class);
                if (order != null) {
                    o.setOrderDto(order);
                }
            } catch (Exception e) {
                log.error("Error fetching order {} for orderItem: {}", o.getOrderDto().getOrderId(), e.getMessage());
            }
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderItemDto> findAll() {
        log.info("OrderItemDto List, service; fetch all orderItems");
        RestClient restClient = restClientBuilder.build();
        String bearerToken = resolveBearerToken();
        return orderItemRepository.findAll()
                .stream()
                .map(OrderItemMappingHelper::map)
                .peek(o -> enrichOrderItem(o, restClient, bearerToken))
                .distinct()
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public OrderItemDto findById(final OrderItemId orderItemId) {
        log.info("OrderItemDto, service; fetch orderItem by id: {}", orderItemId);
        RestClient restClient = restClientBuilder.build();
        String bearerToken = resolveBearerToken();
        return orderItemRepository.findById(orderItemId)
                .map(OrderItemMappingHelper::map)
                .map(o -> {
                    enrichOrderItem(o, restClient, bearerToken);
                    return o;
                })
                .orElseThrow(() -> new OrderItemNotFoundException(
                        String.format("OrderItem with id: %s not found", orderItemId)));
    }

    @Override
    @Transactional
    public OrderItemDto save(final OrderItemDto orderItemDto) {
        log.info("OrderItemDto, service; save orderItem");
        return OrderItemMappingHelper.map(orderItemRepository.save(OrderItemMappingHelper.map(orderItemDto)));
    }

    @Override
    @Transactional
    public OrderItemDto update(final OrderItemDto orderItemDto) {
        log.info("OrderItemDto, service; update orderItem");
        return OrderItemMappingHelper.map(orderItemRepository.save(OrderItemMappingHelper.map(orderItemDto)));
    }

    @Override
    @Transactional
    public void deleteById(final OrderItemId orderItemId) {
        log.info("Void, service; delete orderItem by id: {}", orderItemId);
        orderItemRepository.deleteById(orderItemId);
    }
}
