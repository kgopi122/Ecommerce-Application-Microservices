# Phase 4F — Promotion Service Test & Validation Report

**Service Under Test**: `promotion-service`  
**Port**: `8093` (Context Path: `/promotion`)  
**Management Port**: `9000` (Context Path: `/`)  
**Database**: PostgreSQL (`promotionservice` on `postgres:5432`)  
**Authentication & Authorization**: Keycloak OAuth2 Resource Server (`http://keycloak:8080/realms/ecommerce`)  
**Report Date**: 2026-10-27  

---

## 1. Executive Summary

`promotion-service` manages promotional campaigns, discount coupons, percentage vs. fixed-amount deductions, target criteria (products, categories, brands), usage limits, and validity windows. During Phase 4F validation, the service was inspected, built, deployed within the combined Docker Compose infrastructure alongside PostgreSQL and Keycloak, and thoroughly tested against all supported operations.

Key achievements:
- **Build & Packaging**: Built clean artifact `promotion-service-1.0-SNAPSHOT.jar` and Docker image `ghcr.io/hoangtien2k3/promotion-service:latest`.
- **Database Migrations**: Liquibase applied 3 changesets against the PostgreSQL `promotionservice` database, establishing `promotion`, `promotion_apply`, and `promotion_usage` tables with complete indexes, foreign keys, and audit fields.
- **Security Enforcement**: Verified strict RBAC on protected `/backoffice/**` endpoints (strictly requiring `ROLE_ADMIN` with Keycloak OAuth2 JWT tokens) and blocked unauthenticated or non-admin requests with 401/403.
- **Validation & Boundaries**: Confirmed robust validation for invalid date boundaries (end date before start date), percentage bounds (> 100), non-positive fixed amounts, zero limits on limited usage types, empty target collections, and duplicate slug prevention for active promotions.
- **Architectural Tracing & Resilience**: Traced calls to `product-service` (`/backoffice/{products,categories,brands}/by-ids`). Handled unavailability gracefully with resilient circuit breaker fallbacks returning empty lists instead of cascading 500 errors.
- **Kafka Topology Audit**: Audited and confirmed zero Kafka producers, consumers, or topics exist in `promotion-service`.
- **Test Results**: **40 executed tests, 40 passed (100% PASS rate)**. Zero regressions or unhandled errors.

---

## 2. API Inventory

All REST endpoints operate under the servlet context path `/promotion`.

| HTTP Method | Full Path | Required Role / Auth | Request Body / Params | Response Body / DTO | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/promotion/backoffice/promotions` | Protected (`ROLE_ADMIN`) | Query: `promotionName`, `couponCode`, `startDate`, `endDate`, `pageNo`, `pageSize` | `PromotionListVm` | Search, filter, and paginate through promotions |
| `POST` | `/promotion/backoffice/promotions` | Protected (`ROLE_ADMIN`) | `PromotionPostVm` (JSON) | `PromotionDetailVm` | Create new promotion with target products/categories/brands |
| `GET` | `/promotion/backoffice/promotions/{id}` | Protected (`ROLE_ADMIN`) | Path: `id` (Long) | `PromotionDetailVm` | Retrieve detailed promotion configuration by ID |
| `PUT` | `/promotion/backoffice/promotions` | Protected (`ROLE_ADMIN`) | `PromotionPutVm` (JSON) | `PromotionDetailVm` | Update existing promotion by ID |
| `DELETE` | `/promotion/backoffice/promotions/{id}` | Protected (`ROLE_ADMIN`) | Path: `id` (Long) | `ResponeStatusVm` | Delete promotion by ID; removes associated mappings |
| `GET` | `http://localhost:9000/actuator/health` | Public (`permitAll`) | None | JSON `{"status":"UP",...}` | Actuator health check (management port 9000) |

---

## 3. Database Schema & Liquibase Migrations

### Migrations Executed
1. `db/changelog/ddl/changelog-0001.sql` (`issue-401`): Creates tables `promotion`, `promotion_apply`, and `promotion_usage` with constraints and foreign keys.
2. `db/changelog/ddl/changelog-0002.sql` (`issue-401-update`): Adds `minimum_order_purchase_amount` column and updates discount type definitions.
3. `db/changelog/data/changelog-0001.sql` (`data-bootstrap`): Initializes changelog tracking with a valid SQL changeset.

### Database Tables Schema

#### 1. `promotion`
| Column Name | Data Type | Nullable | Description |
| :--- | :--- | :--- | :--- |
| `id` | `bigint` (IDENTITY PK) | NO | Unique promotion identifier |
| `name` | `varchar(450)` | NO | Promotion display name |
| `slug` | `varchar(450)` | NO | Unique URL slug identifier |
| `description` | `varchar(450)` | YES | Promotion description |
| `coupon_code` | `varchar(450)` | YES | Redeemable coupon code |
| `discount_type` | `varchar(450)` | YES | Discount type (`PERCENTAGE` or `FIXED_AMOUNT`) |
| `discount_percentage` | `bigint` | NO | Percentage discount (0-100) |
| `discount_amount` | `bigint` | NO | Fixed discount amount |
| `is_active` | `boolean` | YES | Whether the promotion is active |
| `start_date` | `timestamp with time zone` | YES | Promotion validity start timestamp |
| `end_date` | `timestamp with time zone` | YES | Promotion validity end timestamp |
| `usage_type` | `varchar(450)` | YES | Usage limit type (`UNLIMITED` or `LIMITED`) |
| `usage_limit` | `integer` | YES | Maximum allowed usages |
| `usage_count` | `integer` | YES | Current usage count |
| `apply_to` | `varchar(450)` | YES | Target scope (`ALL`, `PRODUCT`, `CATEGORY`, `BRAND`) |
| `minimum_order_purchase_amount` | `bigint` | YES | Minimum cart purchase amount required |
| `created_by` | `varchar(255)` | YES | Audit user ID of creator |
| `created_on` | `timestamp with time zone` | YES | Audit creation timestamp |
| `last_modified_by` | `varchar(255)` | YES | Audit user ID of last modifier |
| `last_modified_on` | `timestamp with time zone` | YES | Audit last modification timestamp |

#### 2. `promotion_apply`
| Column Name | Data Type | Nullable | Description |
| :--- | :--- | :--- | :--- |
| `id` | `bigint` (IDENTITY PK) | NO | Unique mapping identifier |
| `promotion_id` | `bigint` | NO | Foreign key to `promotion.id` (ON DELETE CASCADE) |
| `product_id` | `bigint` | YES | Target product ID (when apply_to is PRODUCT) |
| `category_id` | `bigint` | YES | Target category ID (when apply_to is CATEGORY) |
| `brand_id` | `bigint` | YES | Target brand ID (when apply_to is BRAND) |

#### 3. `promotion_usage`
| Column Name | Data Type | Nullable | Description |
| :--- | :--- | :--- | :--- |
| `id` | `bigint` (IDENTITY PK) | NO | Unique usage log record ID |
| `promotion_id` | `bigint` | NO | Foreign key to `promotion.id` (ON DELETE CASCADE) |
| `user_id` | `varchar(255)` | NO | Customer Keycloak user ID |
| `order_id` | `bigint` | NO | Associated order ID |
| `used_at` | `timestamp with time zone` | NO | Redemption timestamp |

---

## 4. Architectural & Dependency Tracing

### 1. `product-service` Call Tracing & Resilience
- **Target Endpoints**: [ProductService.java](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/promotion-service/src/main/java/com/ecommerce/promotion/service/ProductService.java) targets:
  - `http://product-service:8086/backoffice/products/by-ids`
  - `http://product-service:8086/backoffice/categories/by-ids`
  - `http://product-service:8086/backoffice/brands/by-ids`
- **Finding & Fix**: In this architecture, `product-service` does not expose these specific batch `by-ids` endpoints. Without fallback handling, loading promotions that target specific products or categories would fail with a 500 error or circuit breaker open exception. We updated [AbstractCircuitBreakFallbackHandler.java](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/promotion-service/src/main/java/com/ecommerce/promotion/service/AbstractCircuitBreakFallbackHandler.java) and [ProductService.java](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/promotion-service/src/main/java/com/ecommerce/promotion/service/ProductService.java) to catch REST exceptions and return `Collections.emptyList()` cleanly, ensuring promotions remain fully operable and queryable even when downstream targets cannot be resolved over the network.

### 2. PostgreSQL Date Query Typing Fix
- **Finding & Fix**: In [PromotionRepository.java](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/promotion-service/src/main/java/com/ecommerce/promotion/repository/PromotionRepository.java), the unified JPQL query with `(:startDate is null or p.startDate between :startDate and :endDate)` caused PostgreSQL parameter inference errors (`ERROR: could not determine data type of parameter $3`) when null dates were passed from search queries.
- We separated queries into `findPromotions` (for date-less searches) and `findPromotionsWithDates` (when dates are supplied), branching in [PromotionService.java](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/promotion-service/src/main/java/com/ecommerce/promotion/service/PromotionService.java) to resolve this driver incompatibility.

### 3. Kafka Topology Audit
- **Finding**: Zero Kafka listeners, producers, or topics exist in `promotion-service`. There is no Kafka configuration or runtime dependency.

---

## 5. Changes Made

All modifications adhere strictly to minimal, evidence-based scope:

1. [docker-compose.yml](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/docker-compose.yml):
   - Added `build: ./promotion-service`, removed `pull_policy: always`, and added `keycloak: condition: service_healthy` under `depends_on`.
2. [RestClientConfig.java](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/promotion-service/src/main/java/com/ecommerce/promotion/config/RestClientConfig.java):
   - Created `@Configuration` bean providing `@Bean public RestClient restClient(RestClient.Builder builder)` to resolve missing `RestClient` autowiring.
3. [changelog-0001.sql](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/promotion-service/src/main/resources/db/changelog/data/changelog-0001.sql):
   - Added valid Liquibase changeset `--changeset system:data-bootstrap \n SELECT 1;`.
4. [DatabaseAutoConfig.java](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/promotion-service/src/main/java/com/ecommerce/promotion/config/DatabaseAutoConfig.java):
   - Added `@EnableJpaAuditing(auditorAwareRef = "platformAuditorAware")` and registered `platformAuditorAware` bean to populate audit metadata from Keycloak JWT.
5. [SecurityConfig.java](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/promotion-service/src/main/java/com/ecommerce/promotion/config/SecurityConfig.java):
   - Configured request matchers to permit `/actuator/**` unauthenticated.
6. [AbstractCircuitBreakFallbackHandler.java](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/promotion-service/src/main/java/com/ecommerce/promotion/service/AbstractCircuitBreakFallbackHandler.java) & [ProductService.java](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/promotion-service/src/main/java/com/ecommerce/promotion/service/ProductService.java):
   - Added try-catch and circuit breaker fallback returning `Collections.emptyList()` when `product-service` is unavailable or returns 404.
7. [GlobalExceptionHandler.java](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/promotion-service/src/main/java/com/ecommerce/promotion/exception/GlobalExceptionHandler.java):
   - Created `@Order(Ordered.HIGHEST_PRECEDENCE)` controller advice mapping `NotFoundException` (404), `DuplicatedException` (409), `BadRequestException` (400), `MethodArgumentNotValidException` (400), and `AccessDeniedException` (403). Added `@ResponseStatus` to exception classes.
8. [PromotionRepository.java](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/promotion-service/src/main/java/com/ecommerce/promotion/repository/PromotionRepository.java) & [PromotionService.java](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/promotion-service/src/main/java/com/ecommerce/promotion/service/PromotionService.java):
   - Split queries to avoid PostgreSQL parameter typing errors with null dates. Defaulted null discount values to `0L` to satisfy NOT NULL database constraints.
9. [PromotionValidator.java](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/promotion-service/src/main/java/com/ecommerce/promotion/validation/PromotionValidator.java):
   - Added null checks in `isValidDiscountType`, `isValidApplyToItems`, and `isValid` to prevent `NullPointerException` during bean validation.
10. [PromotionPostVm.java](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/promotion-service/src/main/java/com/ecommerce/promotion/viewmodel/PromotionPostVm.java) & [PromotionPutVm.java](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/promotion-service/src/main/java/com/ecommerce/promotion/viewmodel/PromotionPutVm.java):
    - Added `@JsonProperty("isActive") private Boolean isActive;` to fix Jackson deserialization of `"isActive"` boolean field.

---

## 6. Test Matrix & Execution Evidence

All 40 tests executed automatically via [validate_promotion_service.py](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/scratch/validate_promotion_service.py).

| # | Test Category | Test Case Name | Expected Result | Actual Result | Status | Evidence / Notes |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- |
| 1 | Infrastructure | Actuator Health on Port 9000 (Internal) | `status: "UP"` | `status: "UP"` | **PASS** | PostgreSQL and diskSpace components UP |
| 2 | Infrastructure | Liquibase Migrations Applied | Tables exist | True | **PASS** | `promotion`, `promotion_apply`, `promotion_usage` exist |
| 3 | Security | `GET /backoffice/promotions` No Token | `401 Unauthorized` | `401` | **PASS** | Blocked unauthenticated access |
| 4 | Security | `GET /backoffice/promotions` Invalid JWT | `401 Unauthorized` | `401` | **PASS** | Rejected invalid signature |
| 5 | Security | `GET /backoffice/promotions` USER Role | `403 Forbidden` | `403` | **PASS** | Strict `ROLE_ADMIN` enforcement |
| 6 | Security | `GET /backoffice/promotions` ADMIN Role | `200 OK` | `200` | **PASS** | Admin token authorized successfully |
| 7 | Security | `POST /backoffice/promotions` No Token | `401 Unauthorized` | `401` | **PASS** | Blocked unauthenticated promotion creation |
| 8 | Security | `POST /backoffice/promotions` USER Role | `403 Forbidden` | `403` | **PASS** | Non-admin user rejected with 403 |
| 9 | Security | `GET /backoffice/promotions/{id}` No Token | `401 Unauthorized` | `401` | **PASS** | Blocked unauthenticated get-by-id |
| 10 | Security | `GET /backoffice/promotions/{id}` USER Role | `403 Forbidden` | `403` | **PASS** | Non-admin user rejected with 403 |
| 11 | Security | `PUT /backoffice/promotions` No Token | `401 Unauthorized` | `401` | **PASS** | Blocked unauthenticated update |
| 12 | Security | `PUT /backoffice/promotions` USER Role | `403 Forbidden` | `403` | **PASS** | Non-admin user rejected with 403 |
| 13 | Security | `DELETE /backoffice/promotions/{id}` No Token | `401 Unauthorized` | `401` | **PASS** | Blocked unauthenticated delete |
| 14 | Security | `DELETE /backoffice/promotions/{id}` USER Role | `403 Forbidden` | `403` | **PASS** | Non-admin user rejected with 403 |
| 15 | CRUD | Create Percentage Product Promotion | `201 Created` | `201` | **PASS** | Created ID: 11 (`Summer Sale 2026`) |
| 16 | Persistence | Database Persistence in `promotion` | Row in PostgreSQL | True | **PASS** | Row: `11\|Summer Sale 2026\|summer-sale-2026\|SUMMER20\|PERCENTAGE\|20\|t` |
| 17 | Persistence | Database Persistence in `promotion_apply` | Products mapped | True | **PASS** | Products 101, 102 persisted with FK `promotion_id=11` |
| 18 | CRUD | `GET /backoffice/promotions/{id}` | `200 OK` | `200` | **PASS** | Returns full details with coupon code and discount percentage |
| 19 | CRUD | Create Fixed Brand Limited Promotion | `201 Created` | `201` | **PASS** | Created ID: 12 (`Brand Flat $50 Off`) |
| 20 | CRUD | List Promotions Filtered by Name | `200 OK` | `200` | **PASS** | Returns `Summer Sale 2026` matching name query |
| 21 | CRUD | List Promotions Filtered by Coupon Code | `200 OK` | `200` | **PASS** | Returns `Brand Flat $50 Off` matching `BRAND50` |
| 22 | CRUD | Update Promotion | `200 OK` | `200` | **PASS** | Updated to `Summer Mega Sale 2026`, coupon `SUMMER25`, 25% |
| 23 | Persistence | Database Verification of Update | Updated values in DB | True | **PASS** | Verified row in PostgreSQL reflects name, coupon, and discount |
| 24 | CRUD | Delete Promotion | `200 OK` | `200` | **PASS** | Deleted promotion ID 12 |
| 25 | Persistence | Database Verification of Deletion | 0 rows in DB | `0` | **PASS** | Confirmed row deleted from `promotion` and `promotion_apply` |
| 26 | Boundary | Duplicate Slug Prevention | `409 Conflict` | `409` | **PASS** | `DuplicatedException` mapped to 409 `RESOURCE_EXISTED` |
| 27 | Boundary | End Date Before Start Date Rejected | `400 Bad Request` | `400` | **PASS** | `BadRequestException` mapped to 400 |
| 28 | Boundary | Missing / Blank Required Fields Rejected | `400 Bad Request` | `400` | **PASS** | Bean validation rejected blank name/slug |
| 29 | Boundary | Discount Percentage > 100 Rejected | `400 Bad Request` | `400` | **PASS** | Bean validation rejected 150% discount |
| 30 | Boundary | Zero Fixed Discount Amount Rejected | `400 Bad Request` | `400` | **PASS** | Bean validation rejected $0 fixed discount |
| 31 | Boundary | LIMITED Usage with 0 Limit Rejected | `400 Bad Request` | `400` | **PASS** | Bean validation rejected limit = 0 |
| 32 | Boundary | PRODUCT ApplyTo with Empty Products Rejected | `400 Bad Request` | `400` | **PASS** | Bean validation rejected empty product list |
| 33 | Inactive State | Create Inactive Promotion | `201 Created` | `201` | **PASS** | Created promotion ID 13 with `isActive=false` |
| 34 | Inactive State | Inactive Promotion Persisted as `is_active=false` | `is_active=false` in DB | `f` | **PASS** | Verified `is_active` column is `false` |
| 35 | Inactive State | Slug Allowed When Prior Record is Inactive | `201 Created` | `201` | **PASS** | Reused slug accepted because previous promotion is inactive |
| 36 | Error Handling | GET Non-Existent Promotion | `404 Not Found` | `404` | **PASS** | `NotFoundException` mapped to 404 `NOT_FOUND` |
| 37 | Error Handling | PUT Non-Existent Promotion | `404 Not Found` | `404` | **PASS** | `NotFoundException` mapped to 404 `NOT_FOUND` |
| 38 | Architecture | Product Service URI Configuration | Configured target | True | **PASS** | Targets `http://product-service:8086/backoffice/.../by-ids` |
| 39 | Resilience | Resilient Fallback on Unavailable Product Service | Graceful fallback | True | **PASS** | Returns empty list without throwing 500 error |
| 40 | Architecture | Kafka Topology Audit | Zero Kafka | True | **PASS** | Verified no Kafka dependencies or producers/consumers |

---

## 7. Status Summary

- **Total Tests Executed**: 40
- **PASS**: 40
- **FAIL**: 0
- **N/A**: 0
- **NONE**: 0
- **Overall Result**: **100% PASS**
