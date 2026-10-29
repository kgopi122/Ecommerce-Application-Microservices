# Payment Service Test Report

## 1. Executive Summary

`payment-service` was validated end-to-end within the existing microservices architecture. The service is implemented in Spring Boot 3.3.5 (Java 21) using Spring Data JPA, Liquibase, Apache Kafka, ModelMapper, Gson, and Spring Security with OAuth2 Resource Server. It runs on HTTP port `8085` (servlet context path `/payment`) with Spring Boot Actuator on internal management port `9000` (context path `/`). Database persistence connects to PostgreSQL database `paymentservice` on `postgres:5432`.

A comprehensive audit was performed across controllers, DTOs, data access layers, database migrations, outbound integrations, and event messaging:
- **Active Working Flows**: Full CRUD operations for `payments` were verified with PostgreSQL roundtrip persistence, transactional updates, and deletion. Outbound synchronization with `order-service` (`http://order-service:8084/order/api/orders/{id}`) was verified: fetching a payment dynamically retrieves and enriches `OrderDto` (order description, order fee, etc.) from `order-service` via JWT bearer token propagation.
- **Security & Role Enforcement**: Verified against live Keycloak realm tokens. Missing and invalid tokens were rejected with HTTP 401 Unauthorized. Role-based access control was verified: `POST /api/payments`, `PUT /api/payments/{id}`, and `DELETE /api/payments/{id}` strictly require `hasAuthority('USER')` and reject `ADMIN`-only tokens with HTTP 403 Forbidden. Conversely, `GET /api/payments`, `GET /api/payments/all`, and `PUT /api/payments` require `hasAuthority('ADMIN')` and reject `USER` tokens with HTTP 403 Forbidden.
- **Kafka Producer Contract**: Publication to Kafka topic `SUCCESSFUL` was verified. When a payment is created, `payment-service` serializes a `KafkaPaymentDto` (`paymentId`, `isPayed`, `paymentStatus`, `orderId`, `userId`) and publishes it to `SUCCESSFUL`. The message was consumed by `notification-service`, which persisted the record in its `payments` database table and triggered outbound publication to `profileOnboarded`.
- **Payment Idempotency**: Verified rejection of duplicate payment submissions for the same order (`paymentRepository.existsByOrderIdAndIsPayed(orderId)`). Attempting to pay an already-paid order returns HTTP 400 Bad Request with `"Order has already been paid."` and structured error code `PAYMENT-400`.
- **Missing Checkout Integration from `order-service`**: Rigorously documented. In the existing architecture, `order-service` does **NOT** trigger payments upon order creation, nor does it invoke `payment-service` at checkout. Payment creation is solely invoked by client/caller action.

---

## 2. Environment & Infrastructure Architecture

| Component | Target / Value | Status | Evidence / Notes |
| :--- | :--- | :--- | :--- |
| **Service Name** | `payment-service` | Active | Container `payment-service` running |
| **Service HTTP Port** | `8085` | Active | Servlet context path `/payment` mapped to host `8085` |
| **Management HTTP Port** | `9000` | Active | Context path `/`, Actuator exposed on port 9000 |
| **Database** | PostgreSQL (`paymentservice`) | Connected | HikariCP pool initialized; table `payments` verified |
| **Database Migrations** | Liquibase | Applied | 2 change sets executed (`payment-service-0001-bootstrap`, `payment-service-v1.0.0-create-tables`) |
| **Identity Provider** | Keycloak (`http://keycloak:8080`) | Enforced | Realm `ecommerce`, client `ecommerce-client`, JWT issuer verified |
| **Message Broker** | Apache Kafka (`kafka:9092`) | Connected | Topic `SUCCESSFUL`, consumer group `payment-groupId` |
| **Outbound Dependency** | `order-service:8084/order` | Verified | Outbound RestClient call enriches `PaymentDto.order` |
| **Outbound Dependency** | `auth-service:8088` | Configured | Outbound RestClient call enriches `PaymentDto.user` (optional / fallback) |

---

## 3. Configuration & Code Changes

Minimal, evidence-based fixes were made to enable clean Liquibase execution, schema validation, Kafka property resolution, error handling, and outbound routing:

| File | Change Rationale |
| :--- | :--- |
| [docker-compose.yml](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/docker-compose.yml) | Added `build: ./payment-service`, removed `pull_policy: always`, added `keycloak: condition: service_healthy` under `depends_on`, configured `ORDER_SERVICE_URL: http://order-service:8084/order` and `AUTH_SERVICE_URL: http://auth-service:8088`. |
| [db.changelog-master.yaml](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/payment-service/src/main/resources/db/changelog/db.changelog-master.yaml) | Added `- includeAll: path: db/changelog/ddl` to include DDL changelogs so database tables are generated for Hibernate schema validation. |
| [db.changelog-v1.0.0.sql](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/payment-service/src/main/resources/db/changelog/ddl/db.changelog-v1.0.0.sql) | Created Liquibase DDL script defining table `payments` with primary key, column types, and indexes on `order_id` and `user_id`. |
| [AbstractMappedEntity.java](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/payment-service/src/main/java/com/ecommerce/paymentservice/entity/AbstractMappedEntity.java) | Added `@MappedSuperclass` annotation so Hibernate maps audit fields `created_at` and `updated_at` to the `payments` table. |
| [ReactiveKafkaAppProperties.java](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/payment-service/src/main/java/com/ecommerce/paymentservice/config/kafka/ReactiveKafkaAppProperties.java) | Added property fallbacks for `@Value("${spring.kafka.bootstrap-servers:${KAFKA_SERVERS:localhost:9092}}")` and `@Value("${payment.kafka.consumer-group-id:payment-groupId}")` preventing `IllegalArgumentException: Could not resolve placeholder 'kafka.bootstrap.servers'` on startup. |
| [CallAPI.java](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/payment-service/src/main/java/com/ecommerce/paymentservice/service/CallAPI.java) | Updated `receiverPaymentDto` to support `ORDER_SERVICE_URL` with the `/order` servlet context path, added `resolveAuthHeader` helper to prevent double `"Bearer "` prefixing when propagating JWT tokens. |
| [PaymentServiceImpl.java](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/payment-service/src/main/java/com/ecommerce/paymentservice/service/impl/PaymentServiceImpl.java) | Isolated `orderDto` and `userDto` enrichment into separate try-catch blocks in `findById` to prevent user-service unavailability from blocking order enrichment. |
| [PaymentController.java](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/payment-service/src/main/java/com/ecommerce/paymentservice/controller/PaymentController.java) | Replaced invalid `@NotBlank` constraint on `Integer paymentId` with `@NotNull` in `PUT /{paymentId}` endpoint. |
| [GlobalExceptionHandler.java](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/payment-service/src/main/java/com/ecommerce/paymentservice/exception/GlobalExceptionHandler.java) | Added `@RestControllerAdvice` mapping `PaymentNotFoundException` to HTTP 400 Bad Request (`PAYMENT-400`) when order is already paid, and HTTP 404 Not Found (`PAYMENT-404`) for missing payment records. |
| [identified-blockers.md](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/identified-blockers.md) | Updated blocker #2 status as resolved in Phase 4J. |

---

## 4. API & Endpoint Inventory

All endpoints reside under the `/payment` servlet context path:

| HTTP Method | Path | Request Body | Response / Status | Auth Required | Role Constraint | Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/actuator/health` | None | `{"status":"UP",...}` (200) | Public | None | Service liveness and component health |
| `GET` | `/api/payments` | None | `List<PaymentDto>` (200) | Yes (JWT) | `ADMIN` only | Fetch all payments |
| `GET` | `/api/payments/all` | Query params: `page`, `size`, `sortBy`, `sortOrder` | `Page<PaymentDto>` (200) | Yes (JWT) | `ADMIN` only | Fetch paginated payments |
| `GET` | `/api/payments/{paymentId}` | None | `PaymentDto` (200) / 404 | Yes (JWT) | `USER` or `ADMIN` | Fetch payment by ID (enriches order & user) |
| `GET` | `/api/payments/getOrder/{orderId}` | None | `OrderDto` (200) | Public / Inherited | None | Direct proxy call to `order-service` |
| `POST` | `/api/payments` | `PaymentDto` (JSON) | `PaymentDto` (200) | Yes (JWT) | `USER` only | Create payment and publish Kafka event |
| `PUT` | `/api/payments` | `PaymentDto` (JSON) | `PaymentDto` (200) | Yes (JWT) | `ADMIN` only | Update payment entity |
| `PUT` | `/api/payments/{paymentId}` | `PaymentDto` (JSON) | `PaymentDto` (200) | Yes (JWT) | `USER` only | Update payment with ID |
| `DELETE` | `/api/payments/{paymentId}` | None | `true` (200) | Yes (JWT) | `USER` only | Delete payment by ID |

---

## 5. Integration Audit & Dependency Analysis

### 5.1 Outbound REST Integrations
- **`order-service`**:
  - Endpoint called: `GET /order/api/orders/{id}` via `CallAPI.receiverPaymentDto`.
  - Authentication: Bearer token forwarded from caller's `JwtTokenFilter`.
  - Evidence: Verified via `GET /payment/api/payments/{id}` and `GET /payment/api/payments/getOrder/2`. Payment service successfully fetched order details (`orderDesc: "Wireless Mouse Ergonomic"`, `orderFee: 50.0`) and populated `PaymentDto.order`.
- **`auth-service`**:
  - Endpoint called: `GET /api/manager/user/{id}` via `CallAPI.receiverUserDto`.
  - Behavior: Optional enrichment with isolated try-catch fallback. If user record is not found or auth-service is unavailable, payment retrieval completes normally with `user: null`.

### 5.2 Messaging Integration: Kafka Topic `SUCCESSFUL`
- **Producer**: Found in `PaymentServiceImpl.java:112-120`:
  ```java
  KafkaPaymentDto kafkaPaymentDto = KafkaPaymentDto.builder()
          .paymentId(savedPaymentDto.getPaymentId())
          .isPayed(savedPaymentDto.getIsPayed())
          .paymentStatus(savedPaymentDto.getPaymentStatus())
          .orderId(savedPaymentDto.getOrderId())
          .userId(savedPaymentDto.getUserId())
          .build();
  eventProducer.send(KafkaConstant.STATUS_PAYMENT_SUCCESSFUL, gson.toJson(kafkaPaymentDto));
  ```
- **Consumer**: `notification-service/src/main/java/com/ecommerce/notificationservice/event/EventConsumer.java:41`:
  ```java
  @KafkaListener(topics = KafkaConstant.STATUS_PAYMENT_SUCCESSFUL, ...)
  public void paymentOrderKafkaOnboarding(String message) {
      PaymentDto paymentDto = gson.fromJson(message, PaymentDto.class);
      paymentService.savePayment(paymentDto);
      eventProducer.send(KafkaConstant.PROFILE_ONBOARDED_TOPIC, gson.toJson(paymentDto));
  }
  ```
- **Execution Evidence**:
  1. `POST /api/payments` created a payment with ID `1` for `orderId=2`, `userId=1`, `isPayed=true`, `paymentStatus=COMPLETED`.
  2. Kafka producer published JSON payload to topic `SUCCESSFUL`.
  3. `notification-service` consumed the event from Kafka and persisted the record into table `payments` in database `ecommerce`.
  4. Query: `SELECT count(*) FROM payments WHERE payment_id = 1;` in `ecommerce` database confirmed row was persisted (`count = 1`).

---

## 6. Payment Idempotency & Duplicate Request Protection

- **Implementation**: In `PaymentServiceImpl.save()`:
  ```java
  if (paymentRepository.existsByOrderIdAndIsPayed(paymentDto.getOrderId())) {
      throw new PaymentNotFoundException("Order has already been paid.");
  }
  ```
- **Repository Query**: `PaymentRepository.existsByOrderIdAndIsPayed(Integer orderId)` checks if a record with `orderId` and `isPayed = true` exists.
- **Verification Evidence**:
  - Test 14 created the initial paid payment (`isPayed=true`, `orderId=2`).
  - Test 19 submitted a duplicate payment request for `orderId=2`.
  - Result: HTTP 400 Bad Request with body `{"success":false,"code":"PAYMENT-400","message":"Order has already been paid.","path":"/payment/api/payments",...}`.

---

## 7. Architectural Limitation: Missing Checkout Integration from `order-service`

> [!WARNING]
> ### Documented Architecture Gap: Missing Checkout Flow
> In the current codebase, there is **NO** checkout integration between `order-service` and `payment-service`:
> 1. `order-service` has zero references to `payment-service` in its controllers, services, or DTOs (only an unused string constant in `AppConstant.PAYMENT_SERVICE_API_URL`).
> 2. Placing an order via `POST /order/api/orders` saves the order with status/cart data but does **NOT** call `payment-service`, does **NOT** create a payment intent, and does **NOT** publish an order-placed messaging event.
> 3. `payment-service` is strictly an independent payment record store. Payments must be initiated independently by external callers passing an `orderId`.
> 4. `payment-service` does not integrate with external payment gateways (e.g., Stripe, PayPal, VNPay, MoMo). All payment statuses (`NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`) are recorded directly without real financial transactions.

---

## 8. Test Execution Matrix

A total of **26 automated end-to-end tests** were executed against the live Docker environment.

| Test # | Category | Test Description | Expected Result | Actual Result | Status |
| :---: | :--- | :--- | :--- | :--- | :---: |
| 01 | INFRA | Internal Actuator Health on port 9000 | `status: UP`, DB: PostgreSQL | `status: UP`, DB: PostgreSQL | **PASS** |
| 02 | INFRA | PostgreSQL `payments` table existence | Table exists in `paymentservice` | Table `payments` verified | **PASS** |
| 03 | INFRA | PostgreSQL `payments` table schema | >= 7 columns with primary key & indexes | 7 columns, PK `payment_id`, 2 indexes | **PASS** |
| 04 | SECURITY | `GET /api/payments` without JWT | 401 Unauthorized | 401 Unauthorized | **PASS** |
| 05 | SECURITY | `GET /api/payments` with invalid JWT | 401 Unauthorized | 401 Unauthorized | **PASS** |
| 06 | SECURITY | `GET /api/payments` with `USER` token | 403 Forbidden (`hasAuthority('ADMIN')`) | 403 Forbidden | **PASS** |
| 07 | SECURITY | `GET /api/payments` with `ADMIN` token | 200 OK | 200 OK | **PASS** |
| 08 | SECURITY | `GET /api/payments/all` with `USER` token | 403 Forbidden (`hasAuthority('ADMIN')`) | 403 Forbidden | **PASS** |
| 09 | SECURITY | `GET /api/payments/all` with `ADMIN` token | 200 OK (Paginated) | 200 OK | **PASS** |
| 10 | SECURITY | `POST /api/payments` with `ADMIN` token | 403 Forbidden (`hasAuthority('USER')`) | 403 Forbidden | **PASS** |
| 11 | SECURITY | `PUT /api/payments` with `USER` token | 403 Forbidden (`hasAuthority('ADMIN')`) | 403 Forbidden | **PASS** |
| 12 | SECURITY | `PUT /api/payments/{id}` with `ADMIN` token | 403 Forbidden (`hasAuthority('USER')`) | 403 Forbidden | **PASS** |
| 13 | SECURITY | `DELETE /api/payments/{id}` with `ADMIN` token | 403 Forbidden (`hasAuthority('USER')`) | 403 Forbidden | **PASS** |
| 14 | CRUD | `POST /api/payments` create payment | 200 OK, returns `PaymentDto` | 200 OK, `paymentId=1`, `isPayed=true` | **PASS** |
| 15 | PERSISTENCE | Database persistence in `paymentservice` DB | Row `t\|COMPLETED\|2\|1` found | Row verified in PostgreSQL | **PASS** |
| 16 | INTEGRATION | `GET /api/payments/{id}` enriches `OrderDto` | Enriched `orderDesc` from `order-service` | `orderDesc: "Wireless Mouse Ergonomic"` | **PASS** |
| 17 | SECURITY | `GET /api/payments/{id}` with `ADMIN` token | 200 OK (`USER or ADMIN`) | 200 OK | **PASS** |
| 18 | INTEGRATION | `GET /api/payments/getOrder/{orderId}` | 200 OK, returns `OrderDto` | 200 OK, `orderFee: 50.0` | **PASS** |
| 19 | IDEMPOTENCY | `POST /api/payments` duplicate paid order | 400 Bad Request (`Order has already been paid.`) | 400 Bad Request (`PAYMENT-400`) | **PASS** |
| 20 | CRUD | `PUT /api/payments/{id}` update status (`USER`) | 200 OK, `paymentStatus: IN_PROGRESS` | 200 OK, status updated | **PASS** |
| 21 | CRUD | `PUT /api/payments` update payment (`ADMIN`) | 200 OK, `paymentStatus: COMPLETED` | 200 OK, payment updated | **PASS** |
| 22 | KAFKA | Publish to `SUCCESSFUL` & consume in `notification-service` | Persisted in `notification-service` DB | Row found in `ecommerce` DB table | **PASS** |
| 23 | ERROR | `GET /api/payments/999999` (non-existent ID) | 404 Not Found (`PAYMENT-404`) | 404 Not Found (`PAYMENT-404`) | **PASS** |
| 24 | CRUD | `DELETE /api/payments/{id}` with `USER` token | 200 OK, returns `true` | 200 OK (`true`) | **PASS** |
| 25 | PERSISTENCE | Payment deletion verification | 0 rows in database | 0 rows in `payments` table | **PASS** |
| 26 | CRUD | `GET` deleted payment | 404 Not Found | 404 Not Found | **PASS** |

### Comprehensive Service Status: **PASS (100% — 26/26 Tests Passed)**
