# Phase 7 — Frontend Integration and UI Validation Report

**Project**: Multi-Vendor E-Commerce Microservices Platform  
**Target Applications**: Next.js 16 Storefront (`@ecommerce/web`) & Admin Backoffice (`@ecommerce/admin`)  
**Gateway**: Apache APISIX 3.8.0 Data Plane (`http://localhost:9080`)  
**Identity Provider**: Keycloak 24.0.5 (`http://localhost:8080/realms/ecommerce`)  
**Date**: October 28, 2026  
**Status**: COMPLETE (Stopped for Review prior to Phase 8 Regression & Deployment)

---

## 1. Executive Summary

In Phase 7, the Next.js 16 frontend monorepo was audited, hardened, and integrated with the live backend microservices ecosystem through the Apache APISIX gateway. All mock and hardcoded fixtures were eliminated from active storefront and backoffice workflows. The authentication architecture was validated against Keycloak OpenID Connect with strict role-based access control (RBAC). 

Comprehensive static analysis, TypeScript verification, Next.js production builds, and automated integration suites were executed against live containerized microservices through the gateway.

### High-Level Metrics
- **TypeScript Typecheck**: **PASS** (4/4 packages: `@ecommerce/lib`, `@ecommerce/ui`, `@ecommerce/web`, `@ecommerce/admin` — 0 errors)
- **ESLint Validation**: **PASS** (0 errors, 0 warnings across all workspace packages)
- **Next.js Production Build (`next build`)**: **PASS** (Exit code `0` — 19 storefront routes & 23 admin routes successfully compiled)
- **Live Gateway Integration Test Suite**: **25 Total Tests | 21 PASS | 0 FAIL | 2 BLOCKED | 2 NONE**

---

## 2. Frontend Architecture & Route Audit

The frontend is structured as a pnpm Turborepo monorepo with strict package boundaries:
- `frontend/apps/web`: Storefront application (Customer catalog, cart, checkout, order history, reviews).
- `frontend/apps/admin`: Backoffice portal (Product catalog management, category tree, order monitoring, user administration).
- `frontend/packages/lib`: Shared API clients, Axios gateway interceptors, Zustand state stores, TypeScript types, and utility functions.
- `frontend/packages/ui`: Shared design system component library (Modals, Buttons, DataTables, Badges, EmptyStates, Skeletons).

### Route Inventory

| Route | App | Type | Description | Auth / RBAC |
|---|---|---|---|---|
| `/[locale]` | Storefront | Dynamic / SSG | Landing page & hero carousel | Public |
| `/[locale]/products` | Storefront | Dynamic (SSR) | Catalog browsing, filtering, search | Public |
| `/[locale]/products/[id]` | Storefront | Dynamic (SSR) | Product detail, media, reviews | Public |
| `/[locale]/cart` | Storefront | Client / SSR | Cart management & item count | Public / User |
| `/[locale]/checkout` | Storefront | Client | Order creation & payment selection | Authenticated (`ROLE_USER`) |
| `/[locale]/orders` | Storefront | Client | Customer order history & statuses | Authenticated (`ROLE_USER`) |
| `/[locale]/login` | Storefront | SSR / Client | Keycloak SSO initiation & redirect | Public |
| `/[locale]/register` | Storefront | SSR / Client | User registration via Keycloak SSO | Public |
| `/[locale]/auth/callback` | Storefront | Client | OIDC ticket exchange & profile sync | Public (Callback) |
| `/[locale]/admin/dashboard` | Admin | Client | KPIs, recent orders, product list | Authenticated (`ROLE_ADMIN`) |
| `/[locale]/admin/products` | Admin | Client | Product CRUD & category association | Authenticated (`ROLE_ADMIN`) |
| `/[locale]/admin/categories` | Admin | Client | Category management & tree view | Authenticated (`ROLE_ADMIN`) |
| `/[locale]/admin/orders` | Admin | Client | System order audit & details | Authenticated (`ROLE_ADMIN`) |
| `/[locale]/admin/inventory` | Admin | Client | Warehouse stock monitoring | Authenticated (`ROLE_ADMIN`) |
| `/[locale]/admin/shipping` | Admin | Client | Shipping items & tracking details | Authenticated (`ROLE_ADMIN`) |
| `/[locale]/admin/users` | Admin | Client | User accounts & role assignments | Authenticated (`ROLE_ADMIN`) |
| `/[locale]/admin/settings` | Admin | Client | Tax classes & promotion configs | Authenticated (`ROLE_ADMIN`) |

---

## 3. Feature-to-Endpoint & APISIX Gateway Mapping

All browser network requests communicate strictly through the APISIX gateway (`http://localhost:9080`).

| Frontend Feature | API Client Method | APISIX Route Path | Upstream Service & Port | Status |
|---|---|---|---|---|
| SSO Login Redirect | `buildSsoLoginUrl()` | `GET /api/v1/auth/login` | `auth-service:8088` | **PASS** |
| SSO Callback Session | `authApi.getSession(ticket)` | `POST /api/v1/auth/session` | `auth-service:8088` | **PASS** |
| User Profile | `authApi.getProfile()` | `GET /api/v1/users/me` | `auth-service:8088` | **PASS** |
| Product Catalog | `productApi.getAll()` | `GET /api/products` | `product-service:8086` | **PASS** |
| Category List | `categoryApi.getAll()` | `GET /api/categories` | `product-service:8086` | **PASS** |
| Catalog Search | `searchApi.catalogSearch()` | `GET /storefront/catalog-search` | `search-service:8094` | **PASS** |
| Media Retrieval | `mediaApi.getById()` | `GET /medias/{id}` | `media-service:8083` | **PASS** |
| Storefront Ratings | `ratingApi.getByProduct(id)` | `GET /storefront/ratings/products/{productId}` | `rating-service:8089` | **PASS** |
| Customer Cart | `cartApi.getCart()` | `GET /api/carts` | `order-service:8084` | **PASS** |
| Customer Favourites | `favouriteApi.getAll()` | `GET /api/favourites` | `favourite-service:8081` | **PASS** |
| Order Creation | `orderApi.create()` | `POST /api/orders` | `order-service:8084` | **PASS** |
| Order Listing | `orderApi.getAll()` | `GET /api/orders` | `order-service:8084` | **PASS** |
| Payment Initiation | `paymentApi.create()` | `POST /api/payments` | `payment-service:8085` | **PASS** |
| Admin Users List | `userApi.getAll()` | `GET /api/v1/users/all` | `auth-service:8088` | **PASS** |
| Admin Shipping | `shippingApi.getAll()` | `GET /api/shippings` | `shipping-service:8087` | **PASS** |
| Backoffice Tax Classes | `taxApi.getTaxClasses()` | `GET /backoffice/tax-classes` | `tax-service:8091` | **PASS** |
| Backoffice Promotions | `promotionApi.getAll()` | `GET /backoffice/promotions` | `promotion-service:8093` | **PASS** |
| System Notifications | `notificationApi.getAll()` | `GET /api/notifications` | `notification-service:8090` | **PASS** |
| Backoffice Ratings | `ratingApi.getBackofficeRatings()`| `GET /backoffice/ratings` | `rating-service:8089` | **PASS** |
| Storefront Tax Calculation | `taxApi.calculateTax()` | `GET /api/tax/calculate` | `tax-service:8091` | **BLOCKED** |
| Inventory Reservation | `inventoryApi.reserve()` | `POST /api/inventories/reserve` | `inventory-service:8082` | **NONE** |
| CDC Search Synchronization | Debezium Connector | Kafka `dbserver1.*` | `search-service:8094` | **BLOCKED** |
| Onboarding Email Event | Kafka Producer | Kafka `registration-topic` | `notification-service:8090` | **NONE** |

---

## 4. Key Engineering & Integration Fixes

### 1. API Base URL and Gateway Routing
- **Problem**: `frontend/apps/web/.env` and `frontend/apps/admin/.env` contained `NEXT_PUBLIC_API_URL=http://api.ecommerce.local`, which was unresolvable on host browser environments without external DNS manipulation.
- **Resolution**: Updated `NEXT_PUBLIC_API_URL` to `http://localhost:9080` in both application environment configs and updated `resolveApiBaseUrl()` in [api.ts](file:///c:/Users/gsai4/Documents/Capstone(4-1)/Ecommerce-Microservices-Application/ecommerce-microservices/frontend/packages/lib/src/api.ts) to fallback cleanly to `http://localhost:9080` for browser origins.

### 2. Spring Boot Response Structure Normalization
- **Problem**: The frontend UI components expected backend endpoints to return wrapped `ApiResponse<PaginatedResponse<T>>` objects (e.g., `res.data.data.content`). However, several Spring Boot controllers (`ProductController`, `CategoryController`, `OrderController`) return raw Java `List<Dto>` arrays directly. This caused storefront catalog pages, admin dashboard panels, and order tables to render empty states despite HTTP 200 responses.
- **Resolution**: Implemented the polymorphic list extractor [`extractList<T>`](file:///c:/Users/gsai4/Documents/Capstone(4-1)/Ecommerce-Microservices-Application/ecommerce-microservices/frontend/packages/lib/src/utils.ts) in `@ecommerce/lib/utils`. Applied normalization across `products/page.tsx`, `orders/page.tsx`, `categories/page.tsx`, and `dashboard/page.tsx` to handle both wrapped and raw array payloads transparently.

### 3. Jackson DateTime Incompatibility in Order Creation
- **Problem**: In [checkout/page.tsx](file:///c:/Users/gsai4/Documents/Capstone(4-1)/Ecommerce-Microservices-Application/ecommerce-microservices/frontend/apps/web/src/app/[locale]/(storefront)/checkout/page.tsx), order creation previously sent `orderDate: new Date().toISOString()`. However, `order-service`'s Jackson parser enforces `@JsonFormat(pattern = "dd-MM-yyyy__HH:mm:ss:SSSSSS")`, resulting in HTTP 400 Bad Request / `DateTimeParseException`.
- **Resolution**: Removed the client-side `orderDate` string from order creation payloads, allowing `order-service` to assign server-side timestamps automatically, while correctly unpacking the resulting `orderId` to pass directly to `paymentApi.create()`.

### 4. React 19 Hydration & ESLint Guardrails
- **Problem**: React 19 and `@next/eslint-plugin-next` flagged `react-hooks/set-state-in-effect` in [Header.tsx](file:///c:/Users/gsai4/Documents/Capstone(4-1)/Ecommerce-Microservices-Application/ecommerce-microservices/frontend/apps/web/src/components/layout/Header.tsx) and [products/page.tsx](file:///c:/Users/gsai4/Documents/Capstone(4-1)/Ecommerce-Microservices-Application/ecommerce-microservices/frontend/apps/web/src/app/[locale]/(storefront)/products/page.tsx), along with directive ordering in [dashboard/page.tsx](file:///c:/Users/gsai4/Documents/Capstone(4-1)/Ecommerce-Microservices-Application/ecommerce-microservices/frontend/apps/admin/src/app/[locale]/admin/dashboard/page.tsx).
- **Resolution**: Replaced imperative `useEffect` mount flags with React 19's idiomatic `useSyncExternalStore` pattern in `Header.tsx`, placed `"use client";` at line 1, and eliminated all unused imports and variables across both applications.

---

## 5. Verification Results

### 5.1 Static Analysis & Build

```text
> pnpm typecheck
• Packages in scope: @ecommerce/admin, @ecommerce/config, @ecommerce/lib, @ecommerce/ui, @ecommerce/web
Tasks:    4 successful, 4 total
Time:     6.144s
Status:   PASS (0 errors)

> pnpm --filter=@ecommerce/web lint
Status:   PASS (0 errors, 0 warnings)

> pnpm --filter=@ecommerce/admin lint
Status:   PASS (0 errors, 0 warnings)

> pnpm build
✓ Compiled successfully in 12.8s
✓ Generating static pages using 11 workers (23/23 admin, 19/19 web)
Status:   PASS (Exit code 0)
```

### 5.2 Automated Gateway Integration Suite Results

```text
===========================================================================
PHASE 7 INTEGRATION TEST RESULTS: Total: 25 | PASS: 21 | FAIL: 0 | BLOCKED: 2 | NONE: 2
===========================================================================
[PASS] SSO Login Redirect (GET /api/v1/auth/login) -> HTTP 302
[PASS] User JWT Authentication (POST /protocol/openid-connect/token) -> HTTP 200
[PASS] Admin JWT Authentication (POST /protocol/openid-connect/token) -> HTTP 200
[PASS] User Profile (/me) (GET /api/v1/users/me) -> HTTP 200
[PASS] Protected Route Guard (Unauthenticated) (GET /api/v1/users/me) -> HTTP 401
[PASS] Product Catalog List (GET /api/products) -> HTTP 200
[PASS] Category List (GET /api/categories) -> HTTP 200
[PASS] Catalog Search (GET /storefront/catalog-search) -> HTTP 200
[PASS] Media Display (GET /medias/1) -> HTTP 200
[PASS] Ratings & Reviews (Product) (GET /storefront/ratings/products/2) -> HTTP 200
[PASS] Cart Management (GET /api/carts) -> HTTP 200
[PASS] Favourites Management (GET /api/favourites) -> HTTP 200
[PASS] Order Creation (POST /api/orders) -> HTTP 200
[PASS] Order Listing (GET /api/orders) -> HTTP 200
[PASS] Payment Initiation (POST /api/payments) -> HTTP 200
[PASS] Admin User Management (GET /api/v1/users/all) -> HTTP 200
[PASS] Shipping Details (GET /api/shippings) -> HTTP 200
[PASS] Tax Classes (Backoffice) (GET /backoffice/tax-classes) -> HTTP 200
[PASS] Promotions (Backoffice) (GET /backoffice/promotions) -> HTTP 200
[PASS] Notifications (GET /api/notifications) -> HTTP 200
[PASS] Ratings (Backoffice) (GET /backoffice/ratings) -> HTTP 200
[BLOCKED] Tax Calculation (Storefront) (GET /api/tax/calculate) -> HTTP 404
[NONE] Inventory Reservation Mutation (POST /api/inventories/reserve) -> HTTP 404
[BLOCKED] CDC Debezium Pipeline (EVENT Kafka CDC Connect) -> HTTP 0
[NONE] User Registration Notification (EVENT Kafka onboarding topic) -> HTTP 0
```

---

## 6. Known Backend Limitations & Phase 5 Gaps

In accordance with strict verification rules, unsupported backend capabilities have been accurately recorded:

1. **Tax Location Service Dependency (`BLOCKED`)**:
   - `GET /api/tax/calculate` requires an external location service integration that is unconfigured in local environments. As documented in Phase 5, tax calculation fails gracefully without bringing down order checkout.
2. **Inventory Stock Mutation (`NONE`)**:
   - `inventory-service` exposes read-only stock query endpoints. It does not provide a reservation mutation endpoint (`/api/inventories/reserve`). Checkout relies on product quantity validation.
3. **Kafka Debezium CDC Pipeline (`BLOCKED`)**:
   - Automated product catalog synchronization to Elasticsearch via Debezium CDC was not provisioned in infrastructure. Search queries execute against existing Elasticsearch indices.
4. **User Registration Onboarding Notification (`NONE`)**:
   - `auth-service` does not produce an onboarding Kafka event upon user sign-up; `notification-service` is active and responsive to administrative notifications.

---

## 7. Modified Files Inventory

- `frontend/apps/web/.env`: Updated `NEXT_PUBLIC_API_URL` to point to APISIX (`http://localhost:9080`).
- `frontend/apps/admin/.env`: Updated `NEXT_PUBLIC_API_URL` to point to APISIX (`http://localhost:9080`).
- `frontend/packages/lib/src/api.ts`: Resolved gateway base URL fallback; corrected rating route to `/storefront/ratings/products/{productId}`; added API clients for `userApi`, `shippingApi`, `taxApi`, `promotionApi`, `notificationApi`.
- `frontend/packages/lib/src/utils.ts`: Implemented `extractList<T>()` polymorphic response normalizer.
- `frontend/apps/web/src/components/layout/Header.tsx`: Replaced React 19 setState cascading effect with `useSyncExternalStore`; linked mobile search callback.
- `frontend/apps/web/src/components/cart/CartItemRow.tsx`: Cleaned unused icon imports.
- `frontend/apps/web/src/components/product/ProductParts.tsx`: Exported `ProductCardProps`.
- `frontend/apps/web/src/app/[locale]/(storefront)/products/page.tsx`: Fixed React key-based pagination reset; normalized category data extraction.
- `frontend/apps/web/src/app/[locale]/(storefront)/orders/page.tsx`: Applied `extractList<Order>` response normalization.
- `frontend/apps/web/src/app/[locale]/(storefront)/checkout/page.tsx`: Normalized order response parsing; eliminated Jackson datetime format mismatch.
- `frontend/apps/admin/src/app/[locale]/admin/dashboard/page.tsx`: Replaced raw HTML anchors with Next-intl `<Link>`; resolved translation context calls; normalized orders and products data binding.
- `frontend/apps/admin/src/app/[locale]/admin/products/page.tsx`: Applied `extractList<Product>` and `extractList<Category>`.
- `frontend/apps/admin/src/app/[locale]/admin/categories/page.tsx`: Applied `extractList<Category>`.
- `frontend/apps/admin/src/app/[locale]/admin/orders/page.tsx`: Applied `extractList<Order>`.
- `scratch/test_phase7_frontend_integration.py`: End-to-end integration and verification script.

---

## 8. Conclusion and Next Steps

Phase 7 frontend integration and UI validation is **COMPLETE**. All production builds and linters pass cleanly, and all supported microservice features communicate effectively through the APISIX gateway.

As instructed, execution is **STOPPED**. No end-to-end regression or deployment tasks will commence until this report is reviewed.

---

## 9. Browser Runtime Issues & Resolution

During interactive browser testing of the Next.js storefront (`http://localhost:3000`), five distinct categories of client-side errors were identified and resolved:

### 1. `CORS net::ERR_FAILED` on `http://api.localhost:3000/api/products`
- **Root Cause**: `docker-compose.yml` was configured to use `image: ghcr.io/hoangtien2k3/frontend:latest` (an outdated precompiled image from June 27) instead of building the local monorepo source. That precompiled image derived the API origin by prepending `api.` to the current hostname, computing `http://api.localhost:3000` (which targeted the Next.js container rather than APISIX on port 9080).
- **Fix**:
  1. Updated `docker-compose.yml` to build the frontend container directly from `./frontend` (`apps/web/Dockerfile`) with `ARG NEXT_PUBLIC_API_URL=http://localhost:9080`.
  2. Hardened `resolveApiBaseUrl()` in `frontend/packages/lib/src/api.ts` so that loopback origins (`localhost`, `127.0.0.1`, `0.0.0.0`, and `*.localhost`) unconditionally resolve to `http://localhost:9080`.
  3. Verified that APISIX responds with valid CORS headers (`Access-Control-Allow-Origin: http://localhost:3000`, `Access-Control-Allow-Methods: GET,POST,PUT,DELETE,PATCH,OPTIONS`).

### 2. Prefetch HTTP 404 Errors (`about?_rsc`, `contact?_rsc`, `promotions?_rsc`, etc.)
- **Root Cause**: Next.js automatically prefetches `<Link>` targets when they enter the viewport. `Footer.tsx` and header elements linked to informational pages (`/about`, `/contact`, `/promotions`, `/help`, `/shipping`, `/returns`, `/terms`, `/privacy`, `/warranty`, `/installment`, `/stores`, `/favourites`, `/profile`) that had no corresponding Next.js App Router route files.
- **Fix**:
  1. Added `prefetch={false}` to footer info and policy links in `frontend/apps/web/src/components/layout/Footer.tsx`.
  2. Implemented clean, accessible storefront pages under `frontend/apps/web/src/app/[locale]/(storefront)/` for all 13 routes (`about`, `contact`, `promotions`, `help`, `shipping`, `returns`, `terms`, `privacy`, `warranty`, `installment`, `stores`, `favourites`, and `profile`).
  3. Verified that all routes return HTTP 200 with proper layout, headers, and metadata.

### 3. React Hydration Mismatch (`NotFoundError: Failed to execute 'insertBefore' on 'Node'`)
- **Root Cause**: The outdated prebuilt Docker container had an earlier version of `Header.tsx` where client-only authentication state rendered conditionally during SSR, causing a DOM tree divergence between the server-rendered HTML and client hydration.
- **Fix**: Building from the local workspace incorporated the React 19 `useSyncExternalStore` hydration fix in `Header.tsx`, ensuring consistent initial render between server and client.

### 4. Direct Signup Form CORS Failure (`POST http://api.localhost:3000/api/v1/auth/signup`)
- **Root Cause**: The outdated precompiled container contained a legacy registration form that attempted a direct POST request to `http://api.localhost:3000/api/v1/auth/signup`.
- **Fix**: The local workspace implementation routes authentication through Keycloak OIDC via `buildSsoLoginUrl()`, redirecting users to Keycloak SSO (`http://localhost:9080/api/v1/auth/login`) and processing the ticket via `/auth/callback`.

### 5. Docker Build Context Exclusion (`.dockerignore`)
- **Root Cause**: Building the frontend Docker container failed with `invalid file request apps/admin/.next/standalone/.../node_modules/next` because Windows symlinks in local build artifacts were copied into the Docker build context.
- **Fix**: Created `frontend/.dockerignore` with recursive patterns (`**/.next`, `**/node_modules`, `**/out`, `**/dist`, `**/.turbo`) to keep the build context lightweight (~971 KB) and prevent symlink collisions.
