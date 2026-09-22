# Service Dependency Map

This document documents the verified synchronous (REST) and asynchronous (Kafka) dependencies existing across microservices in the codebase.

---

## 1. Verified Synchronous (REST) Communication Map

```mermaid
graph LR
    frontend["frontend (Next.js)"] --> apisix["apisix (Gateway)"]
    
    apisix --> auth-service
    apisix --> product-service
    apisix --> order-service
    apisix --> payment-service
    apisix --> shipping-service
    apisix --> inventory-service
    apisix --> favourite-service
    apisix --> rating-service
    apisix --> media-service
    apisix --> tax-service
    apisix --> promotion-service
    apisix --> search-service
    apisix --> notification-service

    auth-service --> Keycloak["keycloak (IAM)"]

    order-service -->|RestClient| auth-service
    order-service -->|RestClient| product-service

    payment-service -.->|RestClient (BROKEN: http://ORDER-SERVICE)| order-service
    payment-service -.->|RestClient (BROKEN: http://AUTH-SERVICE)| auth-service

    shipping-service -.->|RestClient (BROKEN: http://localhost:8830)| product-service
    shipping-service -.->|RestClient (BROKEN: http://localhost:8300)| order-service

    rating-service -.->|RestClient (UNCONFIGURED: ecommerce.services.customer)| auth-service
    rating-service -.->|RestClient (UNCONFIGURED: ecommerce.services.order)| order-service
    rating-service -.->|RestClient (UNCONFIGURED: ecommerce.services.product)| product-service

    promotion-service -.->|RestClient (UNCONFIGURED: ecommerce.services.product)| product-service
    search-service -.->|RestClient (UNCONFIGURED: ecommerce.services.product)| product-service
    tax-service -.->|RestClient (UNCONFIGURED: ecommerce.services.location)| location-provider
    media-service -->|S3 Client| rustfs["rustfs (S3 Storage)"]
```

---

## Service-by-Service Communication Inventory

### `auth-service`
* **Inbound HTTP**: APISIX Gateway (`/api/v1/auth/*`, `/api/v1/users/*`, `/api/v1/roles/*`), `order-service` (`/api/manager/user/{id}`), `payment-service` (`/api/manager/user/{id}`).
* **Outbound HTTP**: `keycloak` (`http://keycloak:8080/realms/ecommerce/...`).
* **Kafka**: None.

### `product-service`
* **Inbound HTTP**: APISIX Gateway (`/api/products/*`, `/api/categories/*`), `order-service` (`/api/products/{id}`), `promotion-service` (`/backoffice/products/by-ids`), `search-service` (`/storefront/products-es/{id}`).
* **Outbound HTTP**: None.
* **Kafka**: Debezium CDC exports table changes to topic `dbproduct.public.product`.

### `order-service`
* **Inbound HTTP**: APISIX Gateway (`/api/orders/*`, `/api/carts/*`), `payment-service` (`/api/orders/{id}`), `shipping-service` (`/api/orders/{id}`).
* **Outbound HTTP**:
  * `auth-service` -> `http://auth-service:8088/api/manager/user/{id}`
  * `product-service` -> `http://product-service:8086/api/products/{id}`
* **Kafka**: None.

### `payment-service`
* **Inbound HTTP**: APISIX Gateway (`/api/payments/*`).
* **Outbound HTTP**:
  * `order-service` -> `http://ORDER-SERVICE/api/orders/{id}` (**Fails**: missing Eureka / hostname resolution for `ORDER-SERVICE`)
  * `auth-service` -> `http://AUTH-SERVICE/api/manager/user/{id}` (**Fails**: missing Eureka / hostname resolution for `AUTH-SERVICE`)
* **Kafka Outbound**: Topic `paymentSuccessful` (`STATUS_PAYMENT_SUCCESSFUL`).

### `shipping-service`
* **Inbound HTTP**: APISIX Gateway (`/shipping/api/shippings/*`).
* **Outbound HTTP**:
  * `product-service` -> `http://localhost:8830/api/products/{id}` (**Fails**: wrong port `8830`, actual port `8086`)
  * `order-service` -> `http://localhost:8300/api/orders/{id}` (**Fails**: wrong port `8300`, actual port `8084`)
* **Kafka**: None.

### `inventory-service`
* **Inbound HTTP**: APISIX Gateway (`/api/inventory/*`).
* **Outbound HTTP**: None.
* **Kafka**: None.

### `favourite-service`
* **Inbound HTTP**: APISIX Gateway (`/api/favourites/*`).
* **Outbound HTTP**: None.
* **Kafka**: None.

### `rating-service`
* **Inbound HTTP**: APISIX Gateway (`/storefront/ratings/*`, `/rating/backoffice/ratings/*`).
* **Outbound HTTP**:
  * Uses `ServiceUrlConfig` (`ecommerce.services.product`, `customer`, `order`). (**Fails**: properties missing in YAML).
* **Kafka**: None.

### `media-service`
* **Inbound HTTP**: APISIX Gateway (`/media/medias/*`).
* **Outbound HTTP**: `rustfs` -> `http://rustfs:9000` (S3 API).
* **Kafka**: None.

### `tax-service`
* **Inbound HTTP**: APISIX Gateway (`/tax/backoffice/tax-classes/*`, `/tax/backoffice/tax-rates/*`).
* **Outbound HTTP**: Uses `ServiceUrlConfig` (`ecommerce.services.location`). (**Fails**: property missing in YAML).
* **Kafka**: None.

### `promotion-service`
* **Inbound HTTP**: APISIX Gateway (`/promotion/backoffice/promotions/*`).
* **Outbound HTTP**: Uses `ServiceUrlConfig` (`ecommerce.services.product`). (**Fails**: property missing in YAML).
* **Kafka**: None.

### `search-service`
* **Inbound HTTP**: APISIX Gateway (`/storefront/catalog-search`, `/storefront/search_suggest`).
* **Outbound HTTP**:
  * `elasticsearch` -> `http://elasticsearch:9200`
  * `product-service` -> Uses `ServiceUrlConfig` (`ecommerce.services.product`). (**Fails**: property missing in YAML).
* **Kafka Inbound**: Topic `dbproduct.public.product`.

### `notification-service`
* **Inbound HTTP**: APISIX Gateway (`/notification/api/email/*`, `/notification/api/notifications/*`, `/notification/api/payment-notifications/*`).
* **Outbound HTTP**: SMTP (`smtp.gmail.com:587`).
* **Kafka Inbound**: Topics `profileOnboarding`, `paymentSuccessful`.
* **Kafka Outbound**: Topic `profileOnboarded`.
