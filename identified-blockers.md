# Identified Blockers & Risk Assessment

This document lists all architectural, configuration, compilation, runtime, and deployment blockers identified during the repository audit.

---

## High Impact Runtime & Communication Blockers

### 1. Hardcoded Incorrect Ports in `shipping-service` (`AppConstant.java`)
* **File**: `shipping-service/src/main/java/com/ecommerce/shippingservice/constant/AppConstant.java`
* **Issue**:
  ```java
  public static final String PRODUCT_SERVICE_API_URL = "http://localhost:8830/api/products";
  public static final String ORDER_SERVICE_API_URL = "http://localhost:8300/api/orders";
  ```
  `product-service` runs on port **`8086`**, NOT `8830`.
  `order-service` runs on port **`8084`**, NOT `8300`.
* **Impact**: When `shipping-service` attempts to fetch product or order details via REST, HTTP connection errors (`ConnectException`) occur immediately.

### 2. Invalid Uppercase Hostnames in `payment-service` (`CallAPI.java`)
* **File**: `payment-service/src/main/java/com/ecommerce/paymentservice/service/CallAPI.java`
* **Issue**:
  ```java
  restClientBuilder.baseUrl("http://ORDER-SERVICE").build();
  restClientBuilder.baseUrl("http://AUTH-SERVICE").build();
  ```
  Spring Cloud Gateway and Eureka were removed from the project in favor of Apache APISIX. There is no Ribon/Eureka client resolving uppercase hostnames `ORDER-SERVICE` or `AUTH-SERVICE`.
* **Impact**: `payment-service` cannot resolve `http://ORDER-SERVICE` or `http://AUTH-SERVICE` in Docker/K8s DNS (`UnknownHostException`).

### 3. Missing `ecommerce.services` Configuration Properties
* **Affected Services**: `rating-service`, `promotion-service`, `search-service`, `tax-service`.
* **Issue**: Service classes bind `@ConfigurationProperties(prefix = "ecommerce.services")` to construct URIs with `UriComponentsBuilder.fromHttpUrl(serviceUrlConfig.product())`.
  However, no default values or environment overrides exist in `application.yml` or `k8s/configmap.yaml` for:
  * `ecommerce.services.product`
  * `ecommerce.services.customer`
  * `ecommerce.services.order`
  * `ecommerce.services.location`
* **Impact**: Invoking methods that use these HTTP clients results in `IllegalArgumentException: HTTP URL must not be null` or `NullPointerException`.

### 4. Missing Debezium / Kafka Connect for `search-service` CDC
* **File**: `search-service/src/main/resources/application.yml` (`product.topic.name: dbproduct.public.product`)
* **Issue**: `search-service` listens to Debezium CDC topic `dbproduct.public.product`. Neither `docker-compose.yml` nor Kubernetes manifests deploy Kafka Connect or Debezium PostgreSQL connector.
* **Impact**: PostgreSQL product table changes are not automatically published to Kafka, so `search-service` Elasticsearch index never receives sync updates unless externally driven.

### 5. Missing Kafka Producer for `profileOnboarding` Topic
* **Affected Services**: `notification-service` (`EventConsumer.java`) listens to `profileOnboarding`.
* **Issue**: No active producer generates events for `profileOnboarding` (the producer in `payment-service` was commented out).
* **Impact**: Onboarding email notifications are never triggered via Kafka.

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
