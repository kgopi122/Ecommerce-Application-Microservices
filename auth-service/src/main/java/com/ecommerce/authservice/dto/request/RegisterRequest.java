package com.ecommerce.authservice.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {

    @NotBlank(message = "Username must not be left blank")
    @Size(min = 4, max = 20, message = "Username must be between 4 and 20 characters")
    private String username;

    @NotBlank(message = "Password must not be left blank")
    @Size(min = 8, max = 50, message = "Password must be between 8 and 50 characters")
    @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)\\S{8,50}$", message = "Password must contain uppercase letters, lowercase letters, and digits (no spaces)")
    private String password;

    @NotBlank(message = "Full name must not be left blank")
    private String fullName;

    @NotBlank(message = "Email must not be left blank")
    @Pattern(regexp = "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}", message = "Invalid email format")
    private String email;

    @NotBlank(message = "Gender must not be left blank")
    private String gender;

    @Pattern(regexp = "^(\\+?[0-9]{8,15})?$", message = "The phone number is not in the correct format")
    private String phone;

    @Pattern(regexp = "^(http|https)://.*$", message = "Avatar URL must be a valid HTTP or HTTPS URL")
    private String avatar;

    private Set<String> roles;
}
