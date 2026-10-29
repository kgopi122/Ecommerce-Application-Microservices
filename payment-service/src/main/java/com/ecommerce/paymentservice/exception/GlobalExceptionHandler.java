package com.ecommerce.paymentservice.exception;

import com.ecommerce.commonlib.viewmodel.ApiResponse;
import com.ecommerce.paymentservice.exception.wrapper.PaymentNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
@Order(Ordered.HIGHEST_PRECEDENCE)
public class GlobalExceptionHandler {

    @ExceptionHandler(PaymentNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handlePaymentNotFound(PaymentNotFoundException ex, HttpServletRequest request) {
        if (ex.getMessage() != null && ex.getMessage().toLowerCase().contains("already been paid")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("PAYMENT-400", ex.getMessage(), request.getRequestURI()));
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error("PAYMENT-404", ex.getMessage(), request.getRequestURI()));
    }
}
