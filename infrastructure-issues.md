# Infrastructure Issues & Discrepancies Report

This document details all infrastructure, networking, gateway, and messaging configuration issues discovered during the Phase 1 audit.

---

## Issue 1: Hardcoded Hostname & Port Mismatches in `shipping-service`

* **Component**: `shipping-service` (`AppConstant.java`)
* **Expected**: `shipping-service` calls `product-service` at `http://product-service:8086/api/products` and `order-service` at `http://order-service:8084/api/orders`.
* **Actual**: `AppConstant.java` hardcodes:
  ```java
  public static final String PRODUCT_SERVICE_API_URL = "http://localhost:8830/api/products";
  public static final String ORDER_SERVICE_API_URL = "http://localhost:8300/api/orders";
  ```
* **Root cause**: `AppConstant.java` contains outdated ports (`8830` and `8300`) and uses `localhost` instead of container names (`product-service` and `order-service`).
* **Evidence**:
  * `shipping-service/src/main/java/com/ecommerce/shippingservice/constant/AppConstant.java` lines 21 & 24.
  * `product-service` actual port is `8086`. `order-service` actual port is `8084`.
* **Required change**: Update `PRODUCT_SERVICE_API_URL` to `http://product-service:8086/api/products` and `ORDER_SERVICE_API_URL` to `http://order-service:8084/api/orders` (or inject via environment variables).
* **Risk**: High runtime failure (`ConnectException`) when `shipping-service` fetches product or order details.

---

## Issue 2: Uppercase Eureka Hostnames in `payment-service`

* **Component**: `payment-service` (`CallAPI.java`)
* **Expected**: Inter-service REST calls resolve lower-case container names `http://order-service:8084` and `http://auth-service:8088`.
* **Actual**: `CallAPI.java` uses:
  ```java
  restClientBuilder.baseUrl("http://ORDER-SERVICE").build();
  restClientBuilder.baseUrl("http://AUTH-SERVICE").build();
  ```
* **Root cause**: Eureka discovery server was removed from the project in favor of Apache APISIX gateway. Without Eureka or a Spring Cloud LoadBalancer ribbon client, uppercase Eureka VIP names (`ORDER-SERVICE`, `AUTH-SERVICE`) cannot be resolved by Docker or Kubernetes DNS.
* **Evidence**:
  * `payment-service/src/main/java/com/ecommerce/paymentservice/service/CallAPI.java` lines 17 & 26.
  * Root `pom.xml` line 52: `<!-- removed: spring-cloud (gateway migrated to Apache APISIX) -->`.
* **Required change**: Change URLs to `http://order-service:8084` and `http://auth-service:8088`.
* **Risk**: High runtime failure (`UnknownHostException`) when `payment-service` calls `order-service` or `auth-service`.

---

## Issue 3: Missing Service URL Properties in `@ConfigurationProperties` Binds

* **Component**: `rating-service`, `promotion-service`, `search-service`, `tax-service`
* **Expected**: Service target URLs are defined in `application.yml` or ConfigMaps under `ecommerce.services.*`.
* **Actual**: Property prefix `ecommerce.services` is missing in `application.yml` for these services.
* **Root cause**: Java classes bind `@ConfigurationProperties(prefix = "ecommerce.services")` (e.g., `ServiceUrlConfig.java`), but no values are declared in YAML files.
* **Evidence**:
  * `promotion-service/src/main/java/com/ecommerce/promotion/service/ProductService.java` calls `serviceUrlConfig.product()`, which returns `null`.
  * `UriComponentsBuilder.fromHttpUrl(null)` throws `IllegalArgumentException: HTTP URL must not be null`.
* **Required change**: Add `ecommerce.services` entries to `application.yml` or `k8s/configmap.yaml` pointing to container endpoints (e.g. `product: http://product-service:8086`).
* **Risk**: High runtime failure (`IllegalArgumentException` / `NullPointerException`) during inter-service validation.

---

## Issue 4: Missing Debezium CDC Connector for Search Synchronization

* **Component**: `search-service` / Kafka Pipeline
* **Expected**: Changes to PostgreSQL table `product` in `productservice` database automatically publish CDC events to Kafka topic `dbproduct.public.product`.
* **Actual**: `search-service` listens to topic `dbproduct.public.product`, but no Debezium PostgreSQL connector or Kafka Connect container is included in `docker-compose.yml` or Kubernetes manifests.
* **Root cause**: Infrastructure lacks Kafka Connect / Debezium engine.
* **Evidence**:
  * `search-service/src/main/resources/application.yml`: `product.topic.name: dbproduct.public.product`.
  * `docker-compose.yml` contains `kafka` but no `debezium` or `kafka-connect` container.
* **Required change**: Add a Debezium connector or application-level event publisher to emit events to `dbproduct.public.product`.
* **Risk**: Medium. Search index in Elasticsearch will not receive automatic updates when products are created or modified.

---

## Issue 5: Unproduced `profileOnboarding` Topic

* **Component**: `notification-service` (`EventConsumer.java`)
* **Expected**: An upstream service produces events to topic `profileOnboarding`.
* **Actual**: `notification-service` `@KafkaListener` subscribes to `profileOnboarding`, but no service produces to it (producer code in `payment-service` was commented out).
* **Root cause**: Producer code was deactivated.
* **Evidence**:
  * `payment-service/src/main/java/com/ecommerce/paymentservice/event/EventConsumer.java` lines 24–76 (commented out).
  * `notification-service/src/main/java/com/ecommerce/notificationservice/event/EventConsumer.java` line 31.
* **Required change**: Enable or update the producer of `profileOnboarding` events if onboarding notifications are required.
* **Risk**: Low. `notification-service` simply sits idle waiting for messages on that topic.
