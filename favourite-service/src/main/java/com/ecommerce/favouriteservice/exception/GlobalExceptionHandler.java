package com.ecommerce.favouriteservice.exception;

import com.ecommerce.commonlib.viewmodel.ApiResponse;
import com.ecommerce.favouriteservice.exception.wrapper.FavouriteNotFoundException;
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

    @ExceptionHandler(FavouriteNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleFavouriteNotFound(FavouriteNotFoundException ex, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error("FAV-404", ex.getMessage(), request.getRequestURI()));
    }

}
