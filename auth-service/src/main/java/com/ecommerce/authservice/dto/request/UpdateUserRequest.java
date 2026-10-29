package com.ecommerce.authservice.dto.request;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateUserRequest {

    @Size(min = 6, max = 50, message = "The fullName must be 6 characters or more")
    private String fullName;

    @Size(max = 50)
    @Pattern(regexp = "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}", message = "Invalid email format")
    private String email;

    private String gender;

    @Pattern(regexp = "^(\\+?[0-9]{8,15})?$", message = "The phone number is not in the correct format")
    private String phone;

    @Pattern(regexp = "^(http|https)://.*$", message = "Avatar URL must be a valid HTTP or HTTPS URL")
    private String avatar;
}
