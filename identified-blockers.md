# Identified Blockers & Risk Assessment

This document lists all architectural, configuration, compilation, runtime, and deployment blockers identified during the repository audit.

---

## High Impact Runtime & Communication Blockers

### 1. Hardcoded Incorrect Ports in `shipping-service` (`AppConstant.java`) — [RESOLVED in Phase 4K]
* **File**: `shipping-service/src/main/java/com/ecommerce/shippingservice/constant/AppConstant.java`, `OrderItemServiceImpl.java`
* **Resolution**: Updated `AppConstant.java` with correct container endpoints (`http://product-service:8086/product/api/products` and `http://order-service:8084/order/api/orders`), added dynamic environment variable lookups (`PRODUCT_SERVICE_URL`, `ORDER_SERVICE_URL`, `PRODUCT_SERVICE_API_URL`, `ORDER_SERVICE_API_URL`), fixed constructor argument order inversion (`productId` vs `orderId`), implemented `findById(orderItemId)` fix, and added outbound Bearer token propagation with failure resilience. Validated end-to-end with active `product-service` and `order-service` integration.

### 2. Invalid Uppercase Hostnames in `payment-service` (`CallAPI.java`) — [RESOLVED in Phase 4J]
* **File**: `payment-service/src/main/java/com/ecommerce/paymentservice/service/CallAPI.java`
* **Resolution**: Updated `CallAPI.java` to support `ORDER_SERVICE_URL` (`http://order-service:8084/order` with proper `/order` servlet context path) and `AUTH_SERVICE_URL` (`http://auth-service:8088`), and resolved the double Bearer token prefix issue. Validated end-to-end with active `order-service` 

### 3. Missing `ecommerce.services` Configuration Properties — [RESOLVED for `rating-service`, `promotion-service`, `tax-service`, and `search-service`]
* **Affected Services**: `rating-service` (Resolved in 4H), `promotion-service` (Resolved in 4I), `tax-service` (Resolved in 4E), `search-service` (Resolved in 4L).
* **Issue**: Service classes bind `@ConfigurationProperties(prefix = "ecommerce.services")` to construct URIs with `UriComponentsBuilder.fromHttpUrl(serviceUrlConfig.product())`.
  `search-service` was updated with `ECOMMERCE_SERVICES_PRODUCT: http://product-service:8086`, a custom `RestClientConfig` bean was added to provide `RestClient`, and `ImperativeClientConfig` was updated to properly sanitize Elasticsearch host/port strings.
* **Impact**: Handled cleanly with fallback defaults, resilience, and explicit environment mappings in `docker-compose.yml`.

### 4. Missing Debezium / Kafka Connect for `search-service` CDC
* **File**: `search-service/src/main/resources/application.yml` (`product.topic.name: dbproduct.public.product`)
* **Issue**: `search-service` listens to Debezium CDC topic `dbproduct.public.product`. Neither `docker-compose.yml` nor Kubernetes manifests deploy Kafka Connect or Debezium PostgreSQL connector.
* **Impact**: PostgreSQL product table changes are not automatically published to Kafka, so `search-service` Elasticsearch index never receives sync updates unless externally driven.

### 5. Missing Kafka Producer for `profileOnboarding` Topic
* **Affected Services**: `notification-service` (`EventConsumer.java`) listens to `profileOnboarding`.
* **Issue**: No active producer generates events for `profileOnboarding` (the producer in `payment-service` was commented out).
* **Impact**: Onboarding email notifications are never triggered via Kafka.

### 6. Legacy Inter-Service User Lookup Path Mismatch in `order-service` and `payment-service`
* **Files**: `order-service/.../CallAPI.java`, `payment-service/.../CallAPI.java`
* **Issue**: `CallAPI.receiverUserDto` queries `baseUrl + "/api/manager/user/{id}"`. However, `auth-service` runs with context path `/auth` and canonical user lookup route `GET /auth/api/v1/users/{id}` (returning `ApiResponse<UserResponse>`), rather than a raw unwrapped `UserDto` at `/api/manager/user/{id}`.
* **Impact**: `payment-service` safely catches the error via `try ... catch (Exception e) { log.warn(...); }` leaving the user field null. In `order-service`, cart enrichment attempts fail if invoked. Downstream callers should query `/auth/api/v1/users/{id}` or rely on Keycloak JWT claims (`preferred_username`, `sub`, `email`, `name`).

---

## Build & Docker Packaging Risks

### 6. Local Docker Build Expects Pre-compiled Jars
* **Affected Files**: Dockerfiles across all microservices (e.g., `auth-service/Dockerfile`: `COPY target/*.jar app.jar`).
* **Issue**: Executing `docker compose build` without first running `./mvnw clean package -DskipTests` fails because the `target/*.jar` file is missing.
* **Mitigation / Note**: `docker-compose.yml` is currently set to `pull_policy: always` targeting `ghcr.io/hoangtien2k3/<service>:latest`. Local building requires running `mvn clean package` first.

### 7. Notification Service Database Connection
* **File**: `notification-service/src/main/resources/application.yml`
* **Issue**: `url: ${SPRING_DATASOURCE_URL:jdbc:postgresql://${POSTGRES_HOST:localhost}:${POSTGRES_PORT:5432}/ecommerce}`
  `docker/postgres/init/create-all-databases.sql` creates `authservice`, `productservice`, etc., but `notification-service` defaults to database `ecommerce` (which is created as the default DB by Postgres container `POSTGRES_DB: ecommerce`). While it connects, it shares the root `ecommerce` database instead of a dedicated `notificationservice` DB.

---

## Summary of Risks & Impact Matrix

| Risk / Blocker | Category | Severity | Affected Flow |
| :--- | :--- | :--- | :--- |
| Hardcoded Ports in `shipping-service` | Configuration / Code | **HIGH** | Shipping order item lookup |
| Uppercase Hostnames in `payment-service` | Networking / DNS | **HIGH** | Payment verification & order fetching |
| Missing `ecommerce.services` URLs | Configuration | **HIGH** | Search sync, Promotion validation, Rating profile lookup |
| Missing Debezium CDC Pipeline | Infrastructure | **MEDIUM** | Real-time Search index updating |
| Pre-compiled JAR requirement for Docker build | Build / CI | **MEDIUM** | `docker compose build` commands |
