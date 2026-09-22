# Auth Service API Inventory

This document lists every REST endpoint declared in `auth-service` controllers (`AuthController`, `UserController`, `RoleController`).

* **Base Context Path**: `/auth`
* **Direct Host Port**: `8088`

---

## Complete Endpoint Inventory Table

| HTTP Method | Full Path (Direct Port 8088) | Controller Class | Auth Required | Role Required | Request Body DTO | Response DTO | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/auth/api/v1/auth/signup` | `AuthController` | No (Public) | None | `RegisterRequest` | `ApiResponse<Void>` | Self-service user registration (creates user in Keycloak + Postgres) |
| `GET` | `/auth/api/v1/auth/login` | `AuthController` | No (Public) | None | Query params (`redirect_uri`) | `302 Redirect` | Step 1 SSO: Redirects browser to Keycloak authorization endpoint |
| `GET` | `/auth/api/v1/auth/callback` | `AuthController` | No (Public) | None | Query params (`code`, `state`, `error`) | `302 Redirect` | Step 2 SSO: Keycloak callback; exchanges auth code for tokens and issues ticket |
| `GET` | `/auth/api/v1/auth/session` | `AuthController` | No (Public) | None | Query param (`ticket`) | `ApiResponse<KeycloakTokenResponse>` | Step 3 SSO: Frontend exchanges single-use ticket for Keycloak tokens |
| `POST` | `/auth/api/v1/auth/refresh` | `AuthController` | No (Public) | None | `RefreshTokenRequest` | `ApiResponse<KeycloakTokenResponse>` | Obtains new access token using refresh token |
| `POST` | `/auth/api/v1/auth/logout` | `AuthController` | No (Public) | None | `RefreshTokenRequest` | `ApiResponse<Void>` | Invalidates user refresh token in Keycloak |
| `GET` | `/auth/api/v1/users/me` | `UserController` | Yes | Authenticated User | None | `ApiResponse<UserResponse>` | Fetches profile of currently authenticated user via JWT sub claim |
| `GET` | `/auth/api/v1/users/{id}` | `UserController` | Yes | `USER` or `ADMIN` | Path variable `id` | `ApiResponse<UserResponse>` | Fetches user details by database ID |
| `GET` | `/auth/api/v1/users` | `UserController` | Yes | `USER` or `ADMIN` | Query param `username` | `ApiResponse<UserResponse>` | Fetches user details by username |
| `GET` | `/auth/api/v1/users/all` | `UserController` | Yes | `ADMIN` | Query params (`page`, `size`, `sortBy`, `sortOrder`) | `ApiResponse<Page<UserResponse>>` | Paged list of all users in system |
| `PUT` | `/auth/api/v1/users/{id}` | `UserController` | Yes | `USER` | `UpdateUserRequest` | `ApiResponse<UserResponse>` | Updates user profile information |
| `PUT` | `/auth/api/v1/users/me/password` | `UserController` | Yes | `USER` | `ChangePasswordRequest` | `ApiResponse<Void>` | Updates user password |
| `DELETE` | `/auth/api/v1/users/{id}` | `UserController` | Yes | `USER` or `ADMIN` | Path variable `id` | `ApiResponse<Void>` | Deletes user from database |
| `POST` | `/auth/api/v1/roles/users/{userId}/assign` | `RoleController` | Yes | `ADMIN` | String `roleNames` | `ApiResponse<Void>` | Assigns role to specified user |
| `POST` | `/auth/api/v1/roles/users/{userId}/revoke` | `RoleController` | Yes | `ADMIN` | String `roleNames` | `ApiResponse<Void>` | Revokes role from specified user |
| `GET` | `/auth/api/v1/roles/users/{userId}` | `RoleController` | Yes | `ADMIN` | Path variable `userId` | `ApiResponse<List<String>>` | Fetches roles assigned to user |
| `GET` | `/auth/api/manager/user/{id}` | Inter-service | Yes | Internal Service | Path variable `id` | `UserDto` | Internal endpoint used by `order-service` and `payment-service` |
