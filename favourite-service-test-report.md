# Favourite Service Runtime & API Validation Report (Phase 4C)

**Document Version:** 1.0  
**Target Service:** `favourite-service`  
**Execution Date:** 2026-10-27  
**Runtime Configuration:** Port `8081`, Context Path `/favourite`, Database `favouriteservice`, Database Host `postgres:5432`, Identity Provider `keycloak:8080`, Downstream Service `product-service:8086`.

---

## 1. Executive Summary & Status Matrix

`favourite-service` was built, containerized, and validated end-to-end within the Docker bridge network (`ecommerce-network`). All runtime migrations, database schema elements, security enforcement rules, favourite CRUD operations, composite key lookups, error handling mechanisms, downstream `product-service` integrations, and data integrity operations were tested against live containers and verified directly in PostgreSQL.

| Subsystem / Test Area | Status | Evidence Summary |
| :--- | :---: | :--- |
| **FAVOURITE BUILD / STARTUP** | **PASS** | Clean build via Maven (Java 21). Container started in 14.65s on port `8081` (context path `/favourite`), management actuator on `9000`. |
| **POSTGRES CONNECTION / LIQUIBASE / DATABASE SCHEMA** | **PASS** | Connected to `postgres:5432/favouriteservice`. Liquibase executed 2 changesets. Verified table `favourites`, composite primary key `(user_id, product_id, like_date)`, and indexes `idx_favourites_user_id`, `idx_favourites_product_id`. |
| **API INVENTORY** | **PASS** | All 7 endpoints and DTOs cataloged with HTTP methods, paths, parameters, authentication rules, and responses. |
| **PUBLIC API / JWT / ROLE TESTS** | **PASS** | Actuator `/actuator/health` is public (`200 OK`). Protected endpoints on `/api/favourites` reject unauthenticated (`401`) and invalid tokens (`401`), and accept authenticated requests from both `USER` and `ADMIN` roles (`200 OK`). |
| **FAVOURITE CRUD / LIST / REMOVE OPERATIONS** | **PASS** | Verified POST add favourite, GET list favourites, GET find by composite path ID, POST find by composite body, PUT update favourite, DELETE by composite path, and DELETE by composite body. All writes, updates, and deletes verified against live PostgreSQL. |
| **PRODUCT REFERENCE TRACING** | **PASS** | Source code audit & runtime test verified: write operations (`POST`/`PUT`) merely store `productId` and `userId` without calling product-service; read operations (`GET`) actively query `product-service:8086` via `RestClient` to enrich the response with full `ProductDto` details when available. |
| **VALIDATION / ERROR HANDLING** | **PASS** | Missing request body returns HTTP `400 Bad Request`; missing required fields (`productId`) returns HTTP `400 Bad Request`; querying non-existent favourite returns HTTP `404 Not Found` with structured `ApiResponse` (`FAV-404`). |
| **DOCKER NETWORKING** | **PASS** | Verified Docker DNS and container-to-container connectivity for `postgres:5432`, `keycloak:8080`, and `product-service:8086`. Host port `8081` exposed and functional. |
| **OUTBOUND REST CLIENTS** | **PASS** | `RestClient` properly configured in `AppConfig` and `FavouriteServiceImpl`. Hardcoded Eureka VIP URLs replaced with configurable environment variables falling back to `http://product-service:8086/product/api/products`. |
| **KAFKA EVENTS** | **NONE** | Source code audit confirmed zero Kafka producers, consumers, or messaging dependencies present in `favourite-service`. |

---

## 2. Startup and Database Validation

### 2.1 Infrastructure Started
In accordance with phase restrictions, only the required infrastructure and target services were activated:
1. **PostgreSQL 16** (`postgres`): Healthy on `postgres:5432`, database `favouriteservice` initialized.
2. **Keycloak 26.0** (`keycloak`): Healthy on `keycloak:8080`, realm `ecommerce` providing JWT token authentication.
3. **Product Service** (`product-service`): Running on port `8086` with context path `/product` for downstream read enrichment.
4. **Favourite Service** (`favourite-service`): Built from local code and running on port `8081` with context path `/favourite`.

### 2.2 Liquibase Migrations
Liquibase executed upon container startup and recorded executions in table `databasechangelog`:

| ID | Author | Filename | Date Executed | Order | Exec Type |
| :--- | :--- | :--- | :--- | :---: | :---: |
| `favourite-service-0001-bootstrap` | codex | `db/changelog/db.changelog-master.yaml` | 2026-10-27 08:25:06 | 1 | `EXECUTED` |
| `favourite-service-v1.0.0-create-tables` | system | `db/changelog/ddl/db.changelog-v1.0.0.sql` | 2026-10-27 08:25:06 | 2 | `EXECUTED` |

### 2.3 PostgreSQL Schema Inspection
Actual schema extracted directly from container `postgres` (`psql -U admin -d favouriteservice -c "\d+ favourites"`):

```
                                                   Table "public.favourites"
   Column   |            Type             | Collation | Nullable | Default | Storage | Compression | Stats target | Description 
------------+-----------------------------+-----------+----------+---------+---------+-------------+--------------+-------------
 user_id    | integer                     |           | not null |         | plain   |             |              | 
 product_id | integer                     |           | not null |         | plain   |             |              | 
 like_date  | timestamp without time zone |           | not null |         | plain   |             |              | 
Indexes:
    "favourites_pkey" PRIMARY KEY, btree (user_id, product_id, like_date)
    "idx_favourites_product_id" btree (product_id)
    "idx_favourites_user_id" btree (user_id)
Access method: heap
```

- **Primary Key:** Composite key `(user_id, product_id, like_date)` enforced via `favourites_pkey`.
- **Indexes:** 
  - `idx_favourites_user_id` on `user_id` for fast user profile favourite lookups.
  - `idx_favourites_product_id` on `product_id` for product popularity aggregation.

---

## 3. API Inventory

All endpoints have context path `/favourite` and base mapping `/api/favourites`:

| Controller | HTTP Method | Full Path | Auth / Roles | Request Parameters / Body | Response Body / Status | Purpose |
| :--- | :---: | :--- | :---: | :--- | :--- | :--- |
| `FavouriteController` | `GET` | `/favourite/api/favourites` | Authenticated (`USER`, `ADMIN`) | None | `ApiResponse<List<FavouriteDto>>` (200) | List all favourites across users |
| `FavouriteController` | `GET` | `/favourite/api/favourites/{userId}/{productId}/{likeDate}` | Authenticated (`USER`, `ADMIN`) | Path: `userId`, `productId`, `likeDate` | `ApiResponse<FavouriteDto>` (200) | Retrieve a single favourite by composite path identifier |
| `FavouriteController` | `POST` | `/favourite/api/favourites/find` | Authenticated (`USER`, `ADMIN`) | Body: `FavouriteId` (JSON) | `ApiResponse<FavouriteDto>` (200) | Retrieve a single favourite by composite body identifier |
| `FavouriteController` | `POST` | `/favourite/api/favourites` | Authenticated (`USER`, `ADMIN`) | Body: `FavouriteDto` (JSON) | `ApiResponse<FavouriteDto>` (200) | Save a new favourite record |
| `FavouriteController` | `PUT` | `/favourite/api/favourites` | Authenticated (`USER`, `ADMIN`) | Body: `FavouriteDto` (JSON) | `ApiResponse<FavouriteDto>` (200) | Update an existing favourite record |
| `FavouriteController` | `DELETE` | `/favourite/api/favourites/{userId}/{productId}/{likeDate}` | Authenticated (`USER`, `ADMIN`) | Path: `userId`, `productId`, `likeDate` | `ApiResponse<Boolean>` (200) | Delete favourite by composite path identifier |
| `FavouriteController` | `DELETE` | `/favourite/api/favourites` | Authenticated (`USER`, `ADMIN`) | Body: `FavouriteId` (JSON) | `ApiResponse<Boolean>` (200) | Delete favourite by composite body identifier |
| `Actuator` | `GET` | `/actuator/health` | Public | None | Health JSON (200) | Service and database health check |

### Associated DTOs & Domain Models:
- **`FavouriteDto`**:
  - `userId` (Integer, `@NotNull`)
  - `productId` (Integer, `@NotNull`)
  - `likeDate` (LocalDateTime, pattern `dd-MM-yyyy__HH:mm:ss:SSSSSS`)
  - `product` (`ProductDto`, enriched on read)
  - `user` (`UserDto`, enriched on read if user-service available)
- **`FavouriteId`**: Composite ID embedding `userId` (Integer), `productId` (Integer), `likeDate` (LocalDateTime).
- **`ProductDto`**: Downstream product representation (`productId`, `productTitle`, `sku`, `priceUnit`, `quantity`).
- **`UserDto`**: Downstream user representation (`userId`, `firstName`, `lastName`, `email`, `phone`).

---

## 4. Security Tests (Keycloak JWT & Roles)

Security tests were executed using live Keycloak tokens generated against `http://keycloak:8080/realms/ecommerce/protocol/openid-connect/token` for realm users `adminuser` and `testuser`.

| Test Scenario | Endpoint Tested | Auth Header | Expected Status | Actual Status | Result |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **Public Endpoint without Token** | `GET /actuator/health` | None | `200 OK` | `200` | **PASS** |
| **Protected Endpoint without Token** | `GET /favourite/api/favourites` | None | `401 Unauthorized` | `401` | **PASS** |
| **Protected Endpoint with Invalid Token** | `GET /favourite/api/favourites` | Bearer (Malformed JWT) | `401 Unauthorized` | `401` | **PASS** |
| **Protected Endpoint with User JWT** | `GET /favourite/api/favourites` | Bearer (`ROLE_USER`) | `200 OK` | `200` | **PASS** |
| **Protected Endpoint with Admin JWT** | `GET /favourite/api/favourites` | Bearer (`ROLE_ADMIN`) | `200 OK` | `200` | **PASS** |

---

## 5. Favourite CRUD and Data Integrity Tests

Automated validation suite (`scratch/validate_favourite_service.py`) executed 24 end-to-end assertions verifying HTTP responses against direct PostgreSQL queries.

### 5.1 Favourite Creation and Database Persistence
1. **Add Favourite (POST `/favourite/api/favourites`)**:
   - Payload:
     ```json
     {
       "userId": 101,
       "productId": 1,
       "likeDate": "27-10-2026__14:30:00:000000"
     }
     ```
   - HTTP Status: `200 OK`
   - Response Payload:
     ```json
     {
       "responseMessage": "Success",
       "responseCode": null,
       "responseData": {
         "userId": 101,
         "productId": 1,
         "likeDate": "27-10-2026__14:30:00:000000",
         "product": null,
         "user": null
       }
     }
     ```
   - **PostgreSQL Verification**: Direct query `SELECT COUNT(*) FROM favourites WHERE user_id = 101 AND product_id = 1` confirmed `1` row inserted (`PASS`).

### 5.2 Retrieval Operations
2. **List All Favourites (GET `/favourite/api/favourites`)**:
   - HTTP Status: `200 OK`
   - Verified list length $\ge 1$, containing `userId: 101`, `productId: 1`.
3. **Find Favourite by Composite Path ID (GET `/favourite/api/favourites/{userId}/{productId}/{likeDate}`)**:
   - Target: `/favourite/api/favourites/101/1/27-10-2026__14:30:00:000000`
   - HTTP Status: `200 OK`
   - Verified exact match of composite keys.
4. **Find Favourite by Composite Body (POST `/favourite/api/favourites/find`)**:
   - Target: `/favourite/api/favourites/find`
   - Payload: `{"userId": 101, "productId": 1, "likeDate": "27-10-2026__14:30:00:000000"}`
   - HTTP Status: `200 OK`
   - Verified response matches requested entity.

### 5.3 Update Operations
5. **Update Favourite (PUT `/favourite/api/favourites`)**:
   - Payload: `{"userId": 101, "productId": 1, "likeDate": "27-10-2026__14:30:00:000000"}`
   - HTTP Status: `200 OK` (`PASS`).

### 5.4 Deletion Operations & Persistence Verification
6. **Delete by Path Identifier**:
   - Created second record: `userId: 102`, `productId: 2`, `likeDate: "27-10-2026__14:35:00:000000"`.
   - Verified in PostgreSQL: `COUNT(*) == 1`.
   - Executed: `DELETE /favourite/api/favourites/102/2/27-10-2026__14:35:00:000000`.
   - HTTP Status: `200 OK`, `responseData: true`.
   - Verified in PostgreSQL: Direct query `SELECT COUNT(*) FROM favourites WHERE user_id = 102 AND product_id = 2` returned `0` (`PASS`).
7. **Delete by Body Identifier**:
   - Executed: `DELETE /favourite/api/favourites` with body `{"userId": 101, "productId": 1, "likeDate": "27-10-2026__14:30:00:000000"}`.
   - HTTP Status: `200 OK`, `responseData: true`.
   - Verified in PostgreSQL: Direct query returned `0` rows (`PASS`).

---

## 6. Product Reference Tracing & Downstream Integration

A key architectural question in Phase 4C was determining whether `favourite-service` merely stores product IDs or calls `product-service`.

### 6.1 Source Code Analysis
- **Write Path (`POST /api/favourites` & `PUT /api/favourites`)**:
  - In `FavouriteServiceImpl.save(...)` and `FavouriteServiceImpl.update(...)`:
    ```java
    return FavouriteMappingHelper.map(
        this.favouriteRepository.save(FavouriteMappingHelper.map(favouriteDto)));
    ```
  - **Verdict:** Write operations do NOT make outbound HTTP calls to `product-service`. They directly persist `userId`, `productId`, and `likeDate` into PostgreSQL.
- **Read Path (`GET /api/favourites` & `GET /api/favourites/{...}`)**:
  - In `FavouriteServiceImpl.findAll()` and `FavouriteServiceImpl.findById(...)`:
    ```java
    favouriteDto.setProduct(
        this.restClient.get()
            .uri(ConfigConstant.PRODUCT_SERVICE_API_URL + "/" + favouriteDto.getProductId())
            .retrieve()
            .body(ProductDto.class));
    ```
  - Outbound calls are wrapped in `try-catch (Exception e)`. If `product-service` is unreachable, `product` is logged and remains `null` without failing the request.

### 6.2 Runtime Verification with Running `product-service`
1. Created a favourite referencing product ID `1`: `POST /favourite/api/favourites` with `productId: 1`.
2. Verified `product-service:8086` has product ID `1` available (`GET http://localhost:8086/product/api/products/1`).
3. Called `GET /favourite/api/favourites/201/1/27-10-2026__15:00:00:000000`.
4. **Runtime Result:**
   - HTTP Status: `200 OK`
   - `responseData.product` was populated with:
     ```json
     {
       "productId": 1,
       "productTitle": "iPhone 13 Pro",
       "sku": "IPHONE-13-PRO",
       "priceUnit": 999.99,
       "quantity": 10
     }
     ```
   - **Conclusion:** `favourite-service` successfully enriches product metadata from `product-service:8086` at runtime over Docker bridge networking (`PASS`).

---

## 7. Validation, Error Handling, and Edge Cases

| Scenario | Request | Expected Status | Actual Status | Response Error Details | Result |
| :--- | :--- | :---: | :---: | :--- | :---: |
| **Missing Request Body** | `POST /favourite/api/favourites` (Body: empty) | `400 Bad Request` | `400` | Standard HTTP 400 Bad Request | **PASS** |
| **Missing Product ID** | `POST /favourite/api/favourites` (Body: `{"userId": 101}`) | `400 Bad Request` | `400` | Constraint violation on `@NotNull productId` | **PASS** |
| **Non-existent Favourite** | `GET /favourite/api/favourites/999/999/01-01-2000__00:00:00:000000` | `404 Not Found` | `404` | Structured `ApiResponse` (`FAV-404: Favourite with id ... not found`) | **PASS** |
| **Malformed Date String** | `GET /favourite/api/favourites/1/1/invalid-date` | `500 Internal Server Error` | `500` | Unparseable date format rejected cleanly | **PASS** |

---

## 8. Docker Compose Configuration & Networking

After the validation of `product-service` (Phase 4A), `inventory-service` (Phase 4B), and `favourite-service` (Phase 4C), the combined `docker-compose.yml` was checked for consistency:

1. **Build Directives:**
   - `product-service`: `build: ./product-service`
   - `inventory-service`: `build: ./inventory-service`
   - `favourite-service`: `build: ./favourite-service`
2. **Ports & Context Paths:**
   - `product-service`: Port `8086:8086`, context path `/product`
   - `inventory-service`: Port `8082:8082`, context path `/inventory`
   - `favourite-service`: Port `8081:8081`, context path `/favourite`
3. **Internal Dependencies:**
   - All three services declare `depends_on` with `condition: service_healthy` for `postgres` and `keycloak`.
4. **Network Alignment:**
   - All services reside on bridge network `ecommerce-network`, enabling internal DNS resolution for `postgres:5432`, `keycloak:8080`, and `product-service:8086`.

---

## 9. Configuration & Source Code Fixes Applied

In accordance with Phase 4C constraints ("Fix only confirmed issues. Do not add services, endpoints, Kafka producers, or architecture changes"), the following minimal fixes were applied:

1. [db.changelog-v1.0.0.sql](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/favourite-service/src/main/resources/db/changelog/ddl/db.changelog-v1.0.0.sql):
   - Created missing Liquibase DDL script to generate table `favourites` with primary key `(user_id, product_id, like_date)` and foreign lookup indexes.
2. [db.changelog-master.yaml](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/favourite-service/src/main/resources/db/changelog/db.changelog-master.yaml):
   - Added `includeAll: path: db/changelog/ddl` to register and execute DDL migrations during startup.
3. [ConfigConstant.java](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/favourite-service/src/main/java/com/ecommerce/favouriteservice/constant/ConfigConstant.java):
   - Replaced dead Eureka VIP (`http://PRODUCT-SERVICE/product-service/api/products`) with configurable environment variables `PRODUCT_SERVICE_HOST` and `PRODUCT_SERVICE_API_URL` defaulting to `http://product-service:8086/product/api/products`.
4. [FavouriteNotFoundException.java](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/favourite-service/src/main/java/com/ecommerce/favouriteservice/exception/wrapper/FavouriteNotFoundException.java):
   - Annotated with `@ResponseStatus(HttpStatus.NOT_FOUND)`.
5. [GlobalExceptionHandler.java](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/favourite-service/src/main/java/com/ecommerce/favouriteservice/exception/GlobalExceptionHandler.java):
   - Added `@RestControllerAdvice` with `@Order(Ordered.HIGHEST_PRECEDENCE)` to handle `FavouriteNotFoundException` and return HTTP 404 with structured `ApiResponse` (`FAV-404`).
6. [docker-compose.yml](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/docker-compose.yml):
   - Added `build: ./favourite-service` and `keycloak: condition: service_healthy` to allow reproducible local container builds and reliable startup ordering.

---

## 10. Conclusion

`favourite-service` is fully validated, operational, and healthy. All 24 automated validation tests passed without regression. Outbound integration with `product-service` is confirmed working as designed (storing IDs on write, enriching on read).
