package com.ecommerce.authservice.mapper;

import com.ecommerce.authservice.entity.RoleName;
import com.ecommerce.commonlib.exception.BusinessException;

public final class RoleMapper {

    private RoleMapper() {
    }

    public static RoleName toRoleName(String roleName) {
        if (roleName == null) {
            throw BusinessException.badRequest("auth.unsupported.role", "null");
        }
        String clean = roleName.replace("\"", "").trim().toUpperCase();
        if (clean.startsWith("ROLE_")) {
            clean = clean.substring(5);
        }
        try {
            return RoleName.valueOf(clean);
        } catch (IllegalArgumentException e) {
            throw BusinessException.badRequest("auth.unsupported.role", roleName);
        }
    }
}
