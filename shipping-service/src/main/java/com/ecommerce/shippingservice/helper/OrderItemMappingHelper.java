package com.ecommerce.shippingservice.helper;

import com.ecommerce.shippingservice.domain.OrderItem;
import com.ecommerce.shippingservice.dto.OrderDto;
import com.ecommerce.shippingservice.dto.OrderItemDto;
import com.ecommerce.shippingservice.dto.ProductDto;

public interface OrderItemMappingHelper {

    static OrderItemDto map(final OrderItem orderItem) {
        return OrderItemDto.builder()
                .productId(orderItem.getProductId())
                .orderId(orderItem.getOrderId())
                .orderedQuantity(orderItem.getOrderedQuantity())
                .productDto(
                        ProductDto.builder()
                                .productId(orderItem.getProductId())
                                .build())
                .orderDto(
                        OrderDto.builder()
                                .orderId(orderItem.getOrderId())
                                .build())
                .build();
    }

    static OrderItem map(final OrderItemDto orderItemDto) {
        Integer productId = orderItemDto.getProductId();
        if (productId == null && orderItemDto.getProductDto() != null) {
            productId = orderItemDto.getProductDto().getProductId();
        }
        Integer orderId = orderItemDto.getOrderId();
        if (orderId == null && orderItemDto.getOrderDto() != null) {
            orderId = orderItemDto.getOrderDto().getOrderId();
        }
        return OrderItem.builder()
                .productId(productId)
                .orderId(orderId)
                .orderedQuantity(orderItemDto.getOrderedQuantity())
                .build();
    }
}
