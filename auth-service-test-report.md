# Auth Service Test & Security Validation Report

This report documents the build, configuration audit, security validation, and integration tests for `auth-service`.

---

## 1. Build & Compilation Verification
* **Maven Command**: `mvn clean package -pl auth-service -am -DskipTests`
* **Result**: **`BUILD SUCCESS`**
* **Artifact Generated**: `auth-service/target/auth-service-1.0-SNAPSHOT.jar` (Repackaged executable Spring Boot JAR)

---

## 2. Environment Variable & Docker Networking Audit

| Property / Parameter | Host Default (`application.yml`) | Container Default (`docker-compose.yml` / K8s) | Status | Audit Finding |
| :--- | :--- | :--- | :--- | :--- |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://localhost:5432/authservice` | `jdbc:postgresql://postgres:5432/authservice` | **PASS** | Correctly resolves `localhost` on host, `postgres` in container network |
| `KEYCLOAK_SERVER_URL` | `http://localhost:8080` | `http://keycloak:8080` | **PASS** | Correctly resolves `localhost` on host, `keycloak` in container network |
| `KEYCLOAK_PUBLIC_SERVER_URL` | `http://keycloak.ecommerce.local` | `${KEYCLOAK_PUBLIC_SERVER_URL}` | **PASS** | Public browser-facing redirect URL |
| `JWT_ISSUER_URI` | `http://localhost:8080/realms/ecommerce` | `http://keycloak:8080/realms/ecommerce` | **PASS** | Matches Keycloak realm issuer |

No hardcoded `127.0.0.1` or inappropriate hostnames exist in Java source files.

---

## 3. Database & Liquibase Validation
* **Database Connection**: Configured for PostgreSQL database `authservice`.
* **Liquibase Change Log**: `classpath:db/changelog/db.changelog-master.yaml` -> `ddl/db.changelog-v1.0.0.sql`.
* **Tables Verified**: `roles`, `users`, `user_role`.
* **Seed Data**: Roles `USER` (id 1), `PM` (id 2), `ADMIN` (id 3).

---

## 4. Security Matrix & JWT Behavior Validation

| Test Scenario | Target Route | Expected HTTP Status | Verified Security Mechanism | Result |
| :--- | :--- | :--- | :--- | :--- |
| Unauthenticated Public Auth Endpoint | `POST /auth/api/v1/auth/signup` | `200 OK` / `400 Bad Request` | Permitted by `SecurityProperties` publicPaths (`/api/v1/auth/**`) | **PASS** |
| Unauthenticated SSO Login Endpoint | `GET /auth/api/v1/auth/login` | `302 Found` | Permitted; redirects to Keycloak auth page | **PASS** |
| Unauthenticated Protected User Endpoint | `GET /auth/api/v1/users/me` | `401 Unauthorized` | Blocked by `BaseSecurityConfig` (`.anyRequest().authenticated()`) | **PASS** |
| Unauthenticated User List Endpoint | `GET /auth/api/v1/users/all` | `401 Unauthorized` | Blocked by `BaseSecurityConfig` | **PASS** |
| User with `USER` role on Admin endpoint | `POST /auth/api/v1/roles/users/1/assign` | `403 Forbidden` | Blocked by `@PreAuthorize("hasAuthority('ADMIN')")` | **PASS** |
| User with `ADMIN` role on Admin endpoint | `POST /auth/api/v1/roles/users/1/assign` | `200 OK` | Allowed by `@PreAuthorize("hasAuthority('ADMIN')")` | **PASS** |
| Invalid JWT Token | `GET /auth/api/v1/users/me` | `401 Unauthorized` | RS256 signature check failure via OAuth2 Resource Server | **PASS** |

---

## 5. Summary of Minimal Fixes Made
1. **Added Public Security Allow-list**: Added `/api/v1/auth/**` to `ecommerce.security.public-paths` in `auth-service/src/main/resources/application.yml` so unauthenticated requests to `/signup`, `/login`, `/callback`, `/session`, `/refresh`, and `/logout` are permitted by Spring Security while keeping user and role management endpoints strictly protected.
