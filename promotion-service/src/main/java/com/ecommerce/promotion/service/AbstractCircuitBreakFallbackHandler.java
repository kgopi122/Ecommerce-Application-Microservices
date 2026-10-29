package com.ecommerce.promotion.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.Collections;
import java.util.List;

abstract class AbstractCircuitBreakFallbackHandler {

    private static final Logger log = LoggerFactory.getLogger(AbstractCircuitBreakFallbackHandler.class);

    protected void handleBodilessFallback(List<Long> ids, Throwable throwable) {
        log.warn("Circuit breaker bodiless fallback for ids {}: {}", ids, throwable.getMessage());
    }

    protected <T> List<T> handleFallback(List<Long> ids, Throwable throwable) {
        log.warn("Circuit breaker fallback activated for ids {}. Detail: {}", ids, throwable.getMessage());
        return Collections.emptyList();
    }
}

