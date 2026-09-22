# Database Inventory

This document inventory details all PostgreSQL databases initialized by `/docker/postgres/init/create-all-databases.sql` and container environment variables.

---

## PostgreSQL Database Mapping

| Database Name | Created By | Owning Service / Component | Purpose | Verification Status |
| :--- | :--- | :--- | :--- | :--- |
| `ecommerce` | Docker `POSTGRES_DB` env | Default DB / `notification-service` | PostgreSQL initial database; used by `notification-service` | Verified |
| `keycloak` | `create-all-databases.sql` | `keycloak` (IAM) | Keycloak realm, user, client, role & session persistence | Verified |
| `authservice` | `create-all-databases.sql` | `auth-service` | User accounts, roles, addresses, SSO tickets | Verified |
| `productservice` | `create-all-databases.sql` | `product-service` | Products, categories, brands, product attributes, images | Verified |
| `orderservice` | `create-all-databases.sql` | `order-service` | Customer orders, order line items, shopping carts | Verified |
| `paymentservice` | `create-all-databases.sql` | `payment-service` | Payment records, payment transactions, PayPal states | Verified |
| `shippingservice` | `create-all-databases.sql` | `shipping-service` | Shipping methods, shipments, order shipping tracking | Verified |
| `inventoryservice` | `create-all-databases.sql` | `inventory-service` | Inventory stock counts, stock movement history | Verified |
| `favouriteservice` | `create-all-databases.sql` | `favourite-service` | Customer favourite product wishlists | Verified |
| `ratingservice` | `create-all-databases.sql` | `rating-service` | Product ratings, customer reviews, star scores | Verified |
| `mediaservice` | `create-all-databases.sql` | `media-service` | Media file metadata (S3 URLs, file sizes, mime types) | Verified |
| `taxservice` | `create-all-databases.sql` | `tax-service` | Tax classes, country/zone tax rates | Verified |
| `promotionservice` | `create-all-databases.sql` | `promotion-service` | Discounts, promotional codes, coupon rules | Verified |

---

## Initialization Script Audit
The initialization script `docker/postgres/init/create-all-databases.sql` contains:
```sql
CREATE DATABASE keycloak;
CREATE DATABASE authservice;
CREATE DATABASE productservice;
CREATE DATABASE orderservice;
CREATE DATABASE paymentservice;
CREATE DATABASE shippingservice;
CREATE DATABASE inventoryservice;
CREATE DATABASE favouriteservice;
CREATE DATABASE ratingservice;
CREATE DATABASE mediaservice;
CREATE DATABASE taxservice;
CREATE DATABASE promotionservice;
```

All 12 databases correspond 1-to-1 with Keycloak and the 12 Spring Boot relational microservices. No additional databases are required by repository configuration.
