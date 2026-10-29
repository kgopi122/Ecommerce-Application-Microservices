package com.ecommerce.shippingservice.exception.wrapper;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

import java.io.Serial;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class OrderItemNotFoundException extends RuntimeException {

    @Serial
    private static final long serialVersionUID = 1L;

    public OrderItemNotFoundException() {
        super();
    }

    public OrderItemNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }

    public OrderItemNotFoundException(String message) {
        super(message);
    }

    public OrderItemNotFoundException(Throwable cause) {
        super(cause);
    }

}


