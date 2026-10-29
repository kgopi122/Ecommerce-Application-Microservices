package com.ecommerce.promotion.exception;

import com.ecommerce.promotion.utils.MessagesUtils;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.CONFLICT)
public class DuplicatedException extends RuntimeException {

    private String message;

    public DuplicatedException(String message, Object... var2) {
        this.message = MessagesUtils.getMessage(message, var2);
    }

    @Override
    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
