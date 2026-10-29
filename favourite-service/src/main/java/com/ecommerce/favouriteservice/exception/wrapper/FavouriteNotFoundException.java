package com.ecommerce.favouriteservice.exception.wrapper;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

import java.io.Serial;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class FavouriteNotFoundException extends RuntimeException {
    @Serial
    private static final long serialVersionUID = 1L;

    public FavouriteNotFoundException() {
        super();
    }

    public FavouriteNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }

    public FavouriteNotFoundException(String message) {
        super(message);
    }

    public FavouriteNotFoundException(Throwable cause) {
        super(cause);
    }
}
