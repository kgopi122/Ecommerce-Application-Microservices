package com.ecommerce.rating.service;

import com.ecommerce.rating.config.ServiceUrlConfig;
import com.ecommerce.rating.viewmodel.CustomerVm;
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
public class CustomerService extends AbstractCircuitBreakFallbackHandler {

    private static final Logger log = LoggerFactory.getLogger(CustomerService.class);

    private final RestClient restClient;
    private final ServiceUrlConfig serviceUrlConfig;

//    @Retry(name = "restApi")
    @CircuitBreaker()
    public CustomerVm getCustomer() {
        final Jwt jwt = (Jwt) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        final String tokenValue = jwt.getTokenValue();
        try {
            final URI url = UriComponentsBuilder
                    .fromHttpUrl(serviceUrlConfig.customer())
                    .path("/storefront/customer/profile")
                    .buildAndExpand()
                    .toUri();
            return restClient.get()
                    .uri(url)
                    .headers(h -> h.setBearerAuth(tokenValue))
                    .retrieve()
                    .body(CustomerVm.class);
        } catch (Exception e) {
            log.warn("Failed to fetch customer profile from customer-service, extracting from JWT claims: {}", e.getMessage());
            String username = jwt.getClaimAsString("preferred_username");
            String email = jwt.getClaimAsString("email");
            String firstName = jwt.getClaimAsString("given_name");
            String lastName = jwt.getClaimAsString("family_name");
            if (firstName == null) firstName = username != null ? username : "Customer";
            if (lastName == null) lastName = "";
            return new CustomerVm(username, email, firstName, lastName);
        }
    }

    @Override
    protected CustomerVm handleFallback(Throwable throwable) throws Throwable {
        return null;
    }
}
