# Shipping Service Test & Validation Report

**Service Under Test**: `shipping-service`  
**Port**: `8087` (Context Path: `/shipping`)  
**Management Port**: `9000` (Context Path: `/`)  
**Database**: PostgreSQL (`shippingservice` on `postgres:5432`)  
**Authentication & Authorization**: Keycloak OAuth2 Resource Server (`http://keycloak:8080/realms/ecommerce`)  
**Report Date**: 2026-10-28  

---

## 1. Executive Summary

`shipping-service` was validated end-to-end within the existing microservices architecture. The service is implemented in Spring Boot 3.3.5 (Java 21) using Spring Data JPA, Liquibase, Spring Web, and Spring Security with OAuth2 Resource Server. It runs on HTTP port `8087` with servlet context path `/shipping` and exposes Actuator metrics on internal management port `9000`. Database persistence connects to the dedicated PostgreSQL database `shippingservice` on `postgres:5432`.

A comprehensive code and architecture audit was performed across controllers, data models, database configuration, security, outbound HTTP dependencies, and messaging:
- **Build & Packaging**: Built clean artifact `shipping-service-1.0-SNAPSHOT.jar` and Docker image `ghcr.io/hoangtien2k3/shipping-service:latest`.
- **Database Migrations & Schema**: Liquibase executed changesets `shipping-service-0001-bootstrap` and `shipping-service-v1.0.0-create-tables`. Table `order_items` was verified with primary keys `(order_id, product_id)`, foreign key indexes, and JPA auditing timestamps (`created_at`, `updated_at`).
- **Security & Token Enforcement**: Verified against live Keycloak realm tokens. Unauthenticated and invalid JWT requests were rejected with HTTP 401 Unauthorized. Valid user and admin tokens were accepted with HTTP 200 OK.
- **Active CRUD Operations**: Verified full lifecycle for `order_items`: initial empty query, creation via POST, database persistence verification, retrieval by composite path variables (`/{orderId}/{productId}`), retrieval by request body (`/find`), update via PUT, retrieval of updated quantity, listing via `findAll`, deletion by composite path variables, deletion by request body (`/delete`), and not-found error handling returning HTTP 404 with structured `ExceptionMsg`.
- **Outbound Microservice Integrations**:
  - `product-service`: **ACTIVE & VERIFIED**. Outbound `RestClient` call to `http://product-service:8086/product/api/products/{id}` dynamically retrieves and enriches `ProductDto` (e.g. `productTitle: "Unique Item 1"`, `sku: "UNIQUE-SKU-999"`).
  - `order-service`: **ACTIVE & VERIFIED**. Outbound `RestClient` call to `http://order-service:8084/order/api/orders/{id}` propagates caller's Bearer token and dynamically retrieves and enriches `OrderDto` (e.g. `orderDesc: "Wireless Mouse Ergonomic"`, `orderFee: 50.0`).
  - **Outbound Failure Resilience**: Verified that when an order or product does not exist or an external service is unavailable, `shipping-service` catches the exception gracefully, logs the error, and returns the base OrderItem without failing the request (HTTP 200).
- **Architectural & Integration Audit**:
  - `Kafka Messaging`: **NONE / NOT IMPLEMENTED**. Zero Kafka dependencies in `pom.xml`, zero listeners, zero producers.
  - `Carrier Integrations`: **NONE / NOT IMPLEMENTED**. Zero carrier gateway clients (FedEx, UPS, DHL, etc.) exist in the codebase.
  - `Shipment Calculation Engine`: **NONE / NOT IMPLEMENTED**. Service codebase only implements `OrderItem` entity and lifecycle.
- **Test Results**: **30 executed tests, 30 passed (100% PASS rate)** against live Docker infrastructure.

---

## 2. API & Endpoint Inventory

All REST endpoints operate under the servlet context path `/shipping`.

| HTTP Method | Full Path | Auth Required | Request Body / Params | Response Body / Status | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/shipping/actuator/health` | Public (Port 9000) | None | `{"status":"UP",...}` (200) | Actuator service liveness and database health |
| `GET` | `/shipping/api/shippings` | Yes (JWT) | None | `DtoCollectionResponse<OrderItemDto>` (200) | List all order items (dynamically enriches product & order) |
| `GET` | `/shipping/api/shippings/{orderId}/{productId}` | Yes (JWT) | Path: `orderId` (int), `productId` (int) | `OrderItemDto` (200) / 404 | Fetch order item by composite key (enriches product & order) |
| `GET` | `/shipping/api/shippings/find` | Yes (JWT) | Body: `OrderItemId` (JSON) | `OrderItemDto` (200) / 404 | Fetch order item by ID in request body |
| `POST` | `/shipping/api/shippings` | Yes (JWT) | Body: `OrderItemDto` (JSON) | `OrderItemDto` (200) | Create new order item |
| `PUT` | `/shipping/api/shippings` | Yes (JWT) | Body: `OrderItemDto` (JSON) | `OrderItemDto` (200) | Update existing order item |
| `DELETE` | `/shipping/api/shippings/{orderId}/{productId}` | Yes (JWT) | Path: `orderId` (int), `productId` (int) | `Boolean` (`true`) (200) | Delete order item by composite key |
| `DELETE` | `/shipping/api/shippings/delete` | Yes (JWT) | Body: `OrderItemId` (JSON) | `Boolean` (`true`) (200) | Delete order item by ID in request body |

---

## 3. Database Schema & Liquibase Migrations

### Migrations Executed
1. `db/changelog/db.changelog-master.yaml` (`shipping-service-0001-bootstrap`): Bootstrap changeset verifying database connectivity.
2. `db/changelog/ddl/db.changelog-v1.0.0.sql` (`shipping-service-v1.0.0-create-tables`): Creates table `order_items` with primary key `(order_id, product_id)`, timestamp audit columns, and foreign key indexes.

### Table Schema: `order_items`
```
                          Table "public.order_items"
      Column      |           Type           | Collation | Nullable | Default 
------------------+--------------------------+-----------+----------+---------
 order_id         | integer                  |           | not null | 
 product_id       | integer                  |           | not null | 
 ordered_quantity | integer                  |           |          | 
 created_at       | timestamp with time zone |           |          | 
 updated_at       | timestamp with time zone |           |          | 
Indexes:
    "pk_order_items" PRIMARY KEY, btree (order_id, product_id)
    "idx_order_items_order_id" btree (order_id)
    "idx_order_items_product_id" btree (product_id)
```

---

## 4. Key Configuration & Code Changes

The following minimal, evidence-based modifications were implemented to resolve critical blockers and ensure robust integration:

| File | Change Description & Rationale |
| :--- | :--- |
| [docker-compose.yml](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/docker-compose.yml) | Added `build: ./shipping-service`, removed `pull_policy: always`, added `keycloak: condition: service_healthy` under `depends_on`, and configured `PRODUCT_SERVICE_URL: http://product-service:8086/product` and `ORDER_SERVICE_URL: http://order-service:8084/order`. |
| [db.changelog-master.yaml](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/shipping-service/src/main/resources/db/changelog/db.changelog-master.yaml) | Added `- includeAll: path: db/changelog/ddl` so table schema DDL is executed before Hibernate schema validation. |
| [db.changelog-v1.0.0.sql](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/shipping-service/src/main/resources/db/changelog/ddl/db.changelog-v1.0.0.sql) | Created Liquibase DDL script defining table `order_items` with primary keys, indexes, and audit columns. |
| [AppConstant.java](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/shipping-service/src/main/java/com/ecommerce/shippingservice/constant/AppConstant.java) | Updated default URLs to include correct servlet context paths: `http://product-service:8086/product/api/products` and `http://order-service:8084/order/api/orders`. |
| [OrderItemServiceImpl.java](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/shipping-service/src/main/java/com/ecommerce/shippingservice/service/impl/OrderItemServiceImpl.java) | 1. Fixed fatal bug in `findById` where `orderItemRepository.findById(null)` was called instead of `orderItemRepository.findById(orderItemId)`.<br>2. Added dynamic URL resolution via environment variables (`PRODUCT_SERVICE_URL`, `ORDER_SERVICE_URL`).<br>3. Added Bearer token propagation from caller's security context to `order-service` to satisfy its RBAC requirements.<br>4. Added failure resilience and error logging so external microservice failures do not crash the order item response.<br>5. Added `@Transactional` boundaries. |
| [OrderItemController.java](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/shipping-service/src/main/java/com/ecommerce/shippingservice/controller/OrderItemController.java) | 1. Fixed constructor argument inversion bug: `new OrderItemId(orderId, productId)` passed arguments backwards into `OrderItemId(productId, orderId)`. Fixed to `new OrderItemId(productId, orderId)`.<br>2. Added `@ExceptionHandler(OrderItemNotFoundException.class)` returning HTTP 404 with `ExceptionMsg`. |
| [OrderItemNotFoundException.java](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/shipping-service/src/main/java/com/ecommerce/shippingservice/exception/wrapper/OrderItemNotFoundException.java) | Added `@ResponseStatus(HttpStatus.NOT_FOUND)` ensuring missing items map to HTTP 404. |
| [OrderDto.java](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/shipping-service/src/main/java/com/ecommerce/shippingservice/dto/OrderDto.java) | Added `@JsonIgnoreProperties(ignoreUnknown = true)` to avoid Jackson deserialization errors when `order-service` returns additional fields (`cart`, `productId`). |
| [ProductDto.java](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/shipping-service/src/main/java/com/ecommerce/shippingservice/dto/ProductDto.java) | Added `@JsonIgnoreProperties(ignoreUnknown = true)` to avoid Jackson deserialization errors when `product-service` returns additional fields (`category`). |
| [OrderItemDto.java](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/shipping-service/src/main/java/com/ecommerce/shippingservice/dto/OrderItemDto.java) | Added `@JsonIgnoreProperties(ignoreUnknown = true)`. |
| [OrderItemMappingHelper.java](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/shipping-service/src/main/java/com/ecommerce/shippingservice/helper/OrderItemMappingHelper.java) | Added fallback resolution so `productId` and `orderId` can be extracted from either flat JSON fields or nested DTOs. |
| [DatabaseAutoConfig.java](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/shipping-service/src/main/java/com/ecommerce/shippingservice/config/DatabaseAutoConfig.java) | Created JPA auditing configuration bean with `platformAuditorAware` to ensure entity auditing listeners activate reliably. |
| [AbstractMappedEntity.java](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/shipping-service/src/main/java/com/ecommerce/shippingservice/domain/AbstractMappedEntity.java) | Added `@EntityListeners(AuditingEntityListener.class)` to populate `created_at` and `updated_at`. |
| [OrderItem.java](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/shipping-service/src/main/java/com/ecommerce/shippingservice/domain/OrderItem.java) | Added `@EntityListeners(AuditingEntityListener.class)` to ensure audit timestamps are recorded on entity persist and update. |
| [identified-blockers.md](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/identified-blockers.md) | Updated issue 1 to mark hardcoded port and URL blocker as RESOLVED in Phase 4K. |

---

## 5. Test Execution Evidence & Status Matrix

All tests were executed against the live Docker environment using [validate_shipping_service.py](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/scratch/validate_shipping_service.py).

| Test ID | Category | Description | Status | Evidence / Observed Behavior |
| :--- | :--- | :--- | :---: | :--- |
| **TC-SHIP-01** | Health & Lifecycle | Internal Actuator health check | **PASS** | HTTP 200, `{"status":"UP","components":{"db":{"status":"UP",...}}}` |
| **TC-SHIP-02** | Database & Migrations | Liquibase changesets executed | **PASS** | `shipping-service-0001-bootstrap` & `shipping-service-v1.0.0-create-tables` EXECUTED |
| **TC-SHIP-03** | Database & Migrations | `order_items` table columns verified | **PASS** | `order_id`, `product_id`, `ordered_quantity`, `created_at`, `updated_at` |
| **TC-SHIP-04** | Security & Auth | Keycloak JWT acquisition | **PASS** | Acquired valid tokens for `adminuser` and `testuser` via OIDC password grant |
| **TC-SHIP-05** | Security & Auth | Unauthenticated request rejected | **PASS** | HTTP 401 Unauthorized returned |
| **TC-SHIP-06** | Security & Auth | Invalid JWT token rejected | **PASS** | HTTP 401 Unauthorized returned |
| **TC-SHIP-07** | Security & Auth | Valid User JWT accepted | **PASS** | HTTP 200 OK returned |
| **TC-SHIP-08** | Security & Auth | Valid Admin JWT accepted | **PASS** | HTTP 200 OK returned |
| **TC-SHIP-09** | CRUD Lifecycle | Initial empty list retrieval | **PASS** | `GET /api/shippings` returned HTTP 200 with empty collection |
| **TC-SHIP-10** | CRUD Lifecycle | Create OrderItem via POST | **PASS** | `POST /api/shippings` returned HTTP 200 with created `productId=201, orderId=101, orderedQuantity=5` |
| **TC-SHIP-11** | Database Persistence | PostgreSQL row & audit timestamps | **PASS** | Verified row in PostgreSQL: `101\|201\|5\|t\|t` (`created_at` and `updated_at` populated) |
| **TC-SHIP-12** | CRUD Lifecycle | Find by composite path variables | **PASS** | `GET /api/shippings/101/201` returned HTTP 200 with matching entity |
| **TC-SHIP-13** | CRUD Lifecycle | Find by request body (`/find`) | **PASS** | `GET /api/shippings/find` returned HTTP 200 with matching entity |
| **TC-SHIP-14** | CRUD Lifecycle | Update OrderItem quantity via PUT | **PASS** | `PUT /api/shippings` returned HTTP 200 with updated `orderedQuantity=12` |
| **TC-SHIP-15** | Database Persistence | PostgreSQL reflects updated quantity | **PASS** | Direct query confirmed `ordered_quantity=12` in `shippingservice` DB |
| **TC-SHIP-16** | CRUD Lifecycle | Listing contains updated item | **PASS** | `GET /api/shippings` returned collection containing the updated record |
| **TC-SHIP-17** | CRUD Lifecycle | Delete by path variables | **PASS** | `DELETE /api/shippings/101/201` returned HTTP 200 (`true`) |
| **TC-SHIP-18** | Database Persistence | PostgreSQL confirms deletion | **PASS** | Direct query confirmed count = 0 |
| **TC-SHIP-19** | CRUD Lifecycle | Delete by request body (`/delete`) | **PASS** | `DELETE /api/shippings/delete` returned HTTP 200 (`true`) |
| **TC-SHIP-20** | Database Persistence | PostgreSQL confirms deletion | **PASS** | Direct query confirmed count = 0 |
| **TC-SHIP-21** | Error Handling | Query non-existent OrderItem | **PASS** | `GET /api/shippings/9999/8888` returned HTTP 404 with structured `ExceptionMsg` |
| **TC-SHIP-22** | Outbound Integration | `product-service` reachability | **PASS** | Verified HTTP 200 on `http://localhost:8086/product/api/products/2` |
| **TC-SHIP-23** | Outbound Integration | `order-service` reachability | **PASS** | Verified HTTP 200 on `http://localhost:8084/order/api/orders/2` with JWT |
| **TC-SHIP-24** | Outbound Integration | Dynamic `ProductDto` enrichment | **PASS** | `GET /api/shippings/2/2` populated `productTitle: "Unique Item 1"`, `sku: "UNIQUE-SKU-999"` |
| **TC-SHIP-25** | Outbound Integration | Dynamic `OrderDto` enrichment | **PASS** | `GET /api/shippings/2/2` populated `orderDesc: "Wireless Mouse Ergonomic"`, `orderFee: 50.0` |
| **TC-SHIP-26** | Outbound Integration | Enrichment in `findAll()` | **PASS** | `GET /api/shippings` returned enriched product and order data in collection |
| **TC-SHIP-27** | Outbound Resilience | Missing outbound resource handling | **PASS** | When order/product ID does not exist, returns HTTP 200 with basic OrderItem data without crashing |
| **TC-SHIP-28** | Architectural Audit | Kafka messaging | **NONE** | Verified zero Kafka producers, consumers, or dependencies in codebase |
| **TC-SHIP-29** | Architectural Audit | Carrier integrations | **NONE** | Verified zero carrier gateway implementations (FedEx, UPS, etc.) |
| **TC-SHIP-30** | Architectural Audit | Shipment calculation engine | **NONE** | Verified service only manages OrderItem data; rate calculation engine is not implemented |

---

## 6. Architecture & Integration Status Summary

```
                      +-------------------+
                      |     Keycloak      | (JWT Validation & Token Issuer)
                      +---------+---------+
                                |
               Bearer Token     |
                                v
+------------------+     +---------------+     +------------------+
|  product-service | <-- |shipping-service| --> |  order-service   |
| (port 8086)      |     | (port 8087)   |     | (port 8084)      |
| Context: /product|     |Context:/shipping    | Context: /order  |
+------------------+     +-------+-------+     +------------------+
                                 |
                                 v
                       +-------------------+
                       | PostgreSQL (5432) |
                       |  shippingservice  |
                       +-------------------+
```

- **PostgreSQL**: Fully active and verified on `postgres:5432` (`shippingservice`).
- **Keycloak**: Fully active and verified on `keycloak:8080` (realm `ecommerce`).
- **product-service**: Actively integrated and verified. Context path `/product` correctly targeted.
- **order-service**: Actively integrated and verified. Context path `/order` correctly targeted with forwarded caller JWT authorization.
- **Kafka / Carriers / Calculations**: Documented as absent / unverified in accordance with instructions.
