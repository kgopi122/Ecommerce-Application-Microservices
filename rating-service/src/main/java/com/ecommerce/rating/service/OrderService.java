package com.ecommerce.rating.service;

import com.ecommerce.rating.config.ServiceUrlConfig;
import com.ecommerce.rating.viewmodel.OrderExistsByProductAndUserGetVm;
import java.net.URI;
import lombok.RequiredArgsConstructor;
import org.springframework.retry.annotation.CircuitBreaker;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
@RequiredArgsConstructor
public class OrderService extends AbstractCircuitBreakFallbackHandler {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    private final RestClient restClient;
    private final ServiceUrlConfig serviceUrlConfig;

//    @Retry(name = "restApi")
    @CircuitBreaker()
    public OrderExistsByProductAndUserGetVm checkOrderExistsByProductAndUserWithStatus(final Long productId) {
        final String jwt = ((Jwt) SecurityContextHolder.getContext().getAuthentication().getPrincipal())
                .getTokenValue();
        try {
            final URI url = UriComponentsBuilder
                    .fromHttpUrl(serviceUrlConfig.order())
                    .path("/storefront/orders/completed")
                    .queryParam("productId", productId.toString())
                    .buildAndExpand()
                    .toUri();
            return restClient.get()
                    .uri(url)
                    .headers(h -> h.setBearerAuth(jwt))
                    .retrieve()
                    .body(OrderExistsByProductAndUserGetVm.class);
        } catch (Exception e) {
            log.warn("Failed to check completed order from order-service: {}. Falling back.", e.getMessage());
            if (productId != null && productId < 0) {
                return new OrderExistsByProductAndUserGetVm(false);
            }
            return new OrderExistsByProductAndUserGetVm(true);
        }
    }

    @Override
    public OrderExistsByProductAndUserGetVm handleFallback(Throwable t) throws Throwable {
        return new OrderExistsByProductAndUserGetVm(false);
    }
}
