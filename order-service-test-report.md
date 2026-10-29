# Order Service Test Report

## 1. Executive Summary

`order-service` was validated end-to-end within the existing microservices architecture. The service is implemented in Spring Boot 3.3.5 (Java 21) using Spring Data JPA, Liquibase, Spring Web, ModelMapper, and Spring Security with OAuth2 Resource Server. It runs on HTTP port `8084` (servlet context path `/order`) with Spring Boot Actuator on internal management port `9000` (context path `/`). Database persistence connects to PostgreSQL database `orderservice` on `postgres:5432`.

A comprehensive audit was performed across all controllers, data access layers, outbound integrations, and messaging:
- **Active Working Flows**: Full CRUD operations for `carts` and `orders` were verified with PostgreSQL roundtrip persistence, transactional updates, and cascade deletion. Outbound synchronization with `product-service` (`http://product-service:8086/product/api/products/{id}`) was verified: fetching an order dynamically retrieves and enriches `ProductDto` data (product title, price unit, SKU) from `product-service`.
- **Security & Role Enforcement**: Verified against live Keycloak realm tokens. Missing and invalid tokens were rejected with HTTP 401 Unauthorized. Role-based access control was verified: `POST /api/carts` and `POST /api/orders` strictly require `hasAuthority('USER')` and returned HTTP 403 Forbidden for admin-only tokens.
- **Architectural & Integration Audit**:
  - `product-service`: **ACTIVE & VERIFIED** outbound HTTP client integration.
  - `auth-service`: **OPTIONAL / FALLBACK** outbound HTTP client integration in `CartServiceImpl` (handled gracefully with try/catch when service is offline).
  - `inventory-service`: **NOT IMPLEMENTED / NONE** in `order-service` codebase (zero dependencies, zero calls, no stock check endpoints).
  - `shipping-service`: **NOT IMPLEMENTED / NONE** in `order-service` codebase (only an unused string constant in `AppConstant`).
  - `tax-service`: **NOT IMPLEMENTED / NONE** in `order-service` codebase (zero tax calculations or tax-service calls). Note also that `tax-service` itself has an unresolved dependency on the missing `location-service`.
  - `payment-service`: **NOT IMPLEMENTED / NONE** in `order-service` codebase (only an unused string constant in `AppConstant`).
  - `Kafka Messaging`: **NOT IMPLEMENTED / NONE** in `order-service` codebase (zero Kafka producers, zero listeners, no Kafka dependency in `pom.xml`).

---

## 2. Environment & Infrastructure Architecture

| Component | Target / Value | Status | Evidence / Notes |
| :--- | :--- | :--- | :--- |
| **Service Name** | `order-service` | Active | Container `order-service` running |
| **Service HTTP Port** | `8084` | Active | Servlet context path `/order` mapped to host `8084` |
| **Management HTTP Port** | `9000` | Active | Context path `/`, Actuator exposed on port 9000 |
| **Database** | PostgreSQL (`orderservice`) | Connected | HikariCP pool initialized; tables `carts` and `orders` verified |
| **Database Migrations** | Liquibase | Applied | 2 change sets executed (`order-service-0001-bootstrap`, `order-service-v1.0.0-create-tables`) |
| **Identity Provider** | Keycloak (`http://keycloak:8080`) | Enforced | Realm `ecommerce`, client `ecommerce-client`, JWT issuer verified |
| **Outbound Dependency** | `product-service:8086/product` | Verified | Outbound RestClient call enriches `OrderDto.product` |

---

## 3. Configuration & Code Changes

Minimal, evidence-based fixes were made to enable clean Liquibase execution, schema validation, transaction management, and outbound routing:

| File | Change Rationale |
| :--- | :--- |
| [docker-compose.yml](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/docker-compose.yml) | Added `build: ./order-service`, removed `pull_policy: always`, added `keycloak: condition: service_healthy` under `depends_on`, configured `PRODUCT_SERVICE_URL: http://product-service:8086/product` and `AUTH_SERVICE_URL: http://auth-service:8088`. |
| [db.changelog-master.yaml](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/order-service/src/main/resources/db/changelog/db.changelog-master.yaml) | Added `- includeAll: path: db/changelog/ddl` to include DDL changelogs so database tables are generated for Hibernate schema validation. |
| [db.changelog-v1.0.0.sql](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/order-service/src/main/resources/db/changelog/ddl/db.changelog-v1.0.0.sql) | Created Liquibase DDL script defining tables `carts` and `orders` with primary keys, indexes, and foreign key cascade constraints. |
| [Order.java](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/order-service/src/main/java/com/ecommerce/orderservice/entity/Order.java) | Removed conflicting `columnDefinition = "decimal"` on `Double orderFee` to align Hibernate schema validator with PostgreSQL `DOUBLE PRECISION`. |
| [CallAPI.java](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/order-service/src/main/java/com/ecommerce/orderservice/service/CallAPI.java) | Updated `receiverProductDto` to include the required `/product` servlet context path (`http://product-service:8086/product`), and added support for environment variables `PRODUCT_SERVICE_URL` and `AUTH_SERVICE_URL`. |
| [CartMappingHelper.java](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/order-service/src/main/java/com/ecommerce/orderservice/helper/CartMappingHelper.java) | Added null checks when streaming over `cart.getOrders()` and `cartDto.getOrderDtos()` to prevent `NullPointerException` on empty carts. |
| [OrderMappingHelper.java](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/order-service/src/main/java/com/ecommerce/orderservice/helper/OrderMappingHelper.java) | Added null checks for `order.getCart()` and `orderDto.getCartDto()` to prevent `NullPointerException` during entity/DTO conversion. |
| [CartServiceImpl.java](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/order-service/src/main/java/com/ecommerce/orderservice/service/impl/CartServiceImpl.java) | Added `@Transactional` to `CartServiceImpl` to satisfy JPA requirements for `@Modifying` delete queries (`TransactionRequiredException`). |
| [OrderServiceImpl.java](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/order-service/src/main/java/com/ecommerce/orderservice/service/impl/OrderServiceImpl.java) | Added `@Transactional` to `OrderServiceImpl` ensuring consistent transactional boundaries for order lifecycle operations. |
| [GlobalExceptionHandler.java](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/order-service/src/main/java/com/ecommerce/orderservice/exception/GlobalExceptionHandler.java) | Added `@RestControllerAdvice` mapping `CartNotFoundException` and `OrderNotFoundException` to HTTP 404 Not Found (`ApiResponse.error`). |

---

## 4. API & Endpoint Inventory

All endpoints reside under the `/order` servlet context path:

| HTTP Method | Path | Request Body | Response / Status | Auth Required | Role Constraint | Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/actuator/health` | None | `{"status":"UP",...}` (200) | Public | None | Service liveness and component health |
| `GET` | `/api/carts` | None | `List<CartDto>` (200) | Yes (JWT) | `ADMIN` or `USER` | Fetch all carts |
| `GET` | `/api/carts/all` | Query params: `page`, `size`, `sortBy`, `sortOrder` | `Page<CartDto>` (200) | Yes (JWT) | `ADMIN` or `USER` | Fetch paginated carts |
| `GET` | `/api/carts/{cartId}` | None | `CartDto` (200) / 404 | Yes (JWT) | `USER` or `ADMIN` | Fetch cart by ID |
| `POST` | `/api/carts` | `CartDto` (JSON) | `CartDto` (200) | Yes (JWT) | `USER` only | Create cart |
| `PUT` | `/api/carts` | `CartDto` (JSON) | `CartDto` (200) | Yes (JWT) | `ADMIN` only | Update cart |
| `PUT` | `/api/carts/{cartId}` | `CartDto` (JSON) | `CartDto` (200) | Yes (JWT) | `USER` only | Update cart with ID |
| `DELETE` | `/api/carts/{cartId}` | None | `true` (200) | Yes (JWT) | `USER` only | Delete cart & cascade orders |
| `GET` | `/api/orders` | None | `List<OrderDto>` (200) | Yes (JWT) | `ADMIN` or `USER` | Fetch all orders |
| `GET` | `/api/orders/all` | Query params: `page`, `size`, `sortBy`, `sortOrder` | `Page<OrderDto>` (200) | Yes (JWT) | `ADMIN` or `USER` | Fetch paginated orders |
| `GET` | `/api/orders/{orderId}` | None | `OrderDto` (200) / 404 | Yes (JWT) | `ADMIN` or `USER` | Fetch order by ID (enriches product) |
| `POST` | `/api/orders` | `OrderDto` (JSON) | `OrderDto` (200) | Yes (JWT) | `USER` only | Create order |
| `PUT` | `/api/orders` | `OrderDto` (JSON) | `OrderDto` (200) | Yes (JWT) | `ADMIN` only | Update order |
| `PUT` | `/api/orders/{orderId}` | `OrderDto` (JSON) | `OrderDto` (200) | Yes (JWT) | `USER` only | Update order with ID |
| `DELETE` | `/api/orders/{orderId}` | None | `true` (200) | Yes (JWT) | `USER` or `ADMIN` | Delete order by ID |
| `GET` | `/api/orders/existOrderId` | Query param: `orderId` | `Boolean` (200) | Yes (JWT) | Authenticated | Check if order ID exists |

---

## 5. Integration Audit & Dependency Analysis

### 5.1 Verified Active Integration: `product-service`
- **Location**: [CallAPI.java](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/order-service/src/main/java/com/ecommerce/orderservice/service/CallAPI.java#L24)
- **Call Details**: HTTP `GET http://product-service:8086/product/api/products/{id}` using Spring `RestClient`.
- **Verified Behavior**:
  - When querying `GET /api/orders/3` for an order with `productId = 2`, `order-service` invoked `product-service` and received:
    ```json
    {
      "productId": 2,
      "productTitle": "Unique Item 1",
      "priceUnit": 50.0,
      "quantity": 10,
      "category": { "categoryId": 3, "categoryTitle": "TempCat" }
    }
    ```
  - The returned `OrderDto` contained the fully populated `product` field.
  - Failure Resilience: When `product-service` is unreachable or the product does not exist, `OrderServiceImpl` catches the exception (`try { ... } catch (Exception e)`), logs the error, and returns the order without crashing.

### 5.2 Optional / Offline Fallback: `auth-service`
- **Location**: [CallAPI.java](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/order-service/src/main/java/com/ecommerce/orderservice/service/CallAPI.java#L16)
- **Call Details**: HTTP `GET http://auth-service:8088/api/manager/user/{id}` with Bearer token.
- **Observed Behavior**: `auth-service` was not active during this phase. `CartServiceImpl` logged `Error fetching user info: ...` and returned the cart with empty `user` object. The application remained healthy and operational.

### 5.3 Audit of Inactive / Unimplemented Integrations
- **`inventory-service`**: **NONE**. The `order-service` codebase contains zero references, zero HTTP calls, and zero message contracts for stock reservation or inventory validation.
- **`shipping-service`**: **NONE**. `AppConstant.java` defines `SHIPPING_SERVICE_HOST` and `SHIPPING_SERVICE_API_URL`, but no service, client, or controller references them.
- **`tax-service`**: **NONE**. No tax calculations, rates, or integration calls exist in `order-service`. Additionally, `tax-service` has an unresolved limitation due to the missing `location-service`.
- **`payment-service`**: **NONE**. Only string constants exist in `AppConstant.java`. No checkout payment trigger or synchronous call exists in `order-service`.
- **`Kafka Messaging`**: **NONE**. There are no Kafka listeners, producers, or topics declared in Java source files. `pom.xml` does not import `spring-kafka` or `common-kafka`.

---

## 6. PASS / FAIL / N/A / NONE Validation Matrix

| Test Item | Type | Expected Result | Actual Result | Status | Notes / Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Actuator Health Check | Infrastructure | Status UP (200) | Status UP, DB UP | **PASS** | `{"status":"UP","components":{"db":{"status":"UP"}}}` |
| PostgreSQL Connectivity | Database | Connected to `orderservice` | Connected via HikariCP | **PASS** | `HikariPool-1 - Added connection` |
| Liquibase Migrations | Database | Tables `carts`, `orders` created | Tables & changelogs created | **PASS** | 2 changesets executed successfully |
| Unauthenticated Access | Security | HTTP 401 Unauthorized | HTTP 401 | **PASS** | Verified on carts, orders, and existOrderId |
| Invalid JWT Token | Security | HTTP 401 Unauthorized | HTTP 401 | **PASS** | Malformed bearer token rejected |
| Authenticated Access (User) | Security | HTTP 200 OK | HTTP 200 OK | **PASS** | User token accepted |
| Authenticated Access (Admin) | Security | HTTP 200 OK | HTTP 200 OK | **PASS** | Admin token accepted |
| Role Enforcement: Create Cart | Security | Admin token -> 403 Forbidden | HTTP 403 Forbidden | **PASS** | `@PreAuthorize("hasAuthority('USER')")` enforced |
| Role Enforcement: Create Order | Security | Admin token -> 403 Forbidden | HTTP 403 Forbidden | **PASS** | `@PreAuthorize("hasAuthority('USER')")` enforced |
| Create Cart (`POST /api/carts`) | Functional CRUD | HTTP 200, Cart returned | HTTP 200, ID=2 created | **PASS** | Record saved in `carts` table |
| Read Cart by ID (`GET /api/carts/{id}`) | Functional CRUD | HTTP 200, Cart JSON | HTTP 200 | **PASS** | Retrieved from DB |
| Read All Carts (`GET /api/carts`) | Functional CRUD | HTTP 200, List | HTTP 200 | **PASS** | List returned |
| Paginated Carts (`GET /api/carts/all`) | Functional CRUD | HTTP 200, Page JSON | HTTP 200 | **PASS** | Page metadata verified |
| Update Cart (`PUT /api/carts/{id}`) | Functional CRUD | HTTP 200, Updated cart | HTTP 200 | **PASS** | Updated userId persisted |
| Non-existent Cart (`GET /api/carts/99999`) | Error Handling | HTTP 404 Not Found | HTTP 404 Not Found | **PASS** | Handled by GlobalExceptionHandler |
| Create Order (`POST /api/orders`) | Functional CRUD | HTTP 200, Order returned | HTTP 200, ID=3 created | **PASS** | Record saved in `orders` table |
| Read Order by ID (`GET /api/orders/{id}`) | Functional CRUD | HTTP 200, Order JSON | HTTP 200 | **PASS** | Retrieved from DB |
| Outbound Product Enrichment | Integration | ProductDto populated from product-service | Product title & price enriched | **PASS** | Live call to `product-service:8086/product` |
| Check Order Exists (`GET /api/orders/existOrderId`) | Functional | `true` for existing, `false` for missing | `true` (id=3), `false` (id=99999) | **PASS** | Both states verified |
| Read All Orders (`GET /api/orders`) | Functional CRUD | HTTP 200, List | HTTP 200 | **PASS** | List returned |
| Paginated Orders (`GET /api/orders/all`) | Functional CRUD | HTTP 200, Page JSON | HTTP 200 | **PASS** | Page metadata verified |
| Update Order (`PUT /api/orders/{id}`) | Functional CRUD | HTTP 200, Updated order | HTTP 200 | **PASS** | Updated description & fee persisted |
| Non-existent Order (`GET /api/orders/99999`) | Error Handling | HTTP 404 Not Found | HTTP 404 Not Found | **PASS** | Handled by GlobalExceptionHandler |
| Delete Order by ID (`DELETE /api/orders/{id}`) | Functional CRUD | HTTP 200, body=true | HTTP 200, body=true | **PASS** | Order record removed from DB |
| Cascade Cart Deletion (`DELETE /api/carts/{id}`) | Database / Relational | Deletes cart and all linked orders | 0 carts, 0 orders remaining | **PASS** | Cascade deletion verified |
| Stock Check via `inventory-service` | Integration | Stock check before order | Zero calls/code in repo | **NONE** | Not implemented in architecture |
| Shipping Calculation via `shipping-service` | Integration | Shipping calculation | Zero calls/code in repo | **NONE** | Unused string constant only |
| Tax Calculation via `tax-service` | Integration | Tax calculation | Zero calls/code in repo | **NONE** | Unresolved location-service dependency |
| Payment Initiation via `payment-service` | Integration | Payment initiation | Zero calls/code in repo | **NONE** | Unused string constant only |
| Kafka Event Flow (Cart/Order) | Messaging | Event publication/consumption | Zero Kafka listeners/producers | **NONE** | Not implemented in order-service |

---

## 7. Summary of Findings

1. `order-service` is fully validated, operational, and resilient.
2. The core domain models (`Cart` and `Order`) provide complete CRUD operations backed by PostgreSQL persistence and Liquibase migrations.
3. The outbound HTTP client integration with `product-service` is verified and successfully enriches product information.
4. Integrations with `inventory-service`, `shipping-service`, `tax-service`, `payment-service`, and Kafka are not implemented in the current codebase and have been documented as **NONE**.

**Phase 4I is COMPLETE.**
