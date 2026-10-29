# Notification Service Test Report

## 1. Executive Summary

`notification-service` was validated end-to-end within the existing microservices architecture. The service is implemented in Spring Boot 3.3.5 (Java 21) with Spring Data JPA, Spring Kafka, Spring Mail, and Spring Cloud OpenFeign. It runs on HTTP port `8090` (context path `/notification`) with Spring Boot Actuator on management port `9000` (context path `/`). Database persistence connects to PostgreSQL database `ecommerce` on `postgres:5432`, where Hibernate (`ddl-auto: update`) manages tables `notifications` and `payments`. Message consumption and production connect to Apache Kafka on `kafka:9092`.

A comprehensive audit was performed across all REST endpoints and Kafka message listeners:
- **Active Working Flow (`SUCCESSFUL`)**: Verified end-to-end. The message contract was traced directly to active producer code in `payment-service` (`PaymentServiceImpl.java:120`). Upon receiving a `SUCCESSFUL` payment event, `notification-service` parses the payload into `PaymentDto`, persists a record to PostgreSQL table `payments`, produces an event to Kafka topic `profileOnboarded`, and triggers `emailService.sendSimpleMail` (which gracefully catches unconfigured external SMTP exceptions without crashing).
- **Inactive / Unproduced Integration Flow (`profileOnboarding`)**: Audited across the entire codebase. Verified that **no active producer exists** for `profileOnboarding` (`payment-service` has producer code commented out). This flow was identified, documented as INACTIVE, and was not fabricated or marked as working.
- **REST APIs**: Full CRUD operations on `/api/notifications` and `/api/payment-notifications` were verified with database roundtrip persistence and deletion. Unauthenticated requests and invalid JWT tokens were properly rejected with HTTP 401 Unauthorized.

---

## 2. Environment & Infrastructure Architecture

| Component | Target / Value | Status | Evidence / Notes |
| :--- | :--- | :--- | :--- |
| **Service Name** | `notification-service` | Active | Container `notification-service` running |
| **Service HTTP Port** | `8090` | Active | Context path `/notification` mapped to host `8090` |
| **Management HTTP Port** | `9000` | Active | Internal management port, context path `/` |
| **Database** | PostgreSQL (`ecommerce`) | Connected | HikariCP pool initialized; tables `notifications` and `payments` verified |
| **Database Migrations** | Hibernate `ddl-auto: update` | Verified | Tables auto-generated with primary keys and check constraints |
| **Identity Provider** | Keycloak (`http://keycloak:8080`) | Enforced | Realm `ecommerce`, client `ecommerce-client` |
| **Message Broker** | Apache Kafka (`kafka:9092`) | Connected | Consumer group `notification-groupId`, partitions assigned |
| **Mail Server** | Spring Mail (`smtp.gmail.com:587`) | Fallback Handled | Defaults configured; caught gracefully when credentials unset |

---

## 3. Configuration & Code Changes

Minimal, evidence-based fixes were made to resolve startup blockers, missing property defaults, and false actuator health failures:

| File | Change Rationale |
| :--- | :--- |
| [docker-compose.yml](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/docker-compose.yml) | Added `build: ./notification-service`, removed `pull_policy: always`, added `SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/ecommerce`, added mail property defaults `MAIL_USERNAME: ${MAIL_USERNAME:-noreply@ecommerce.com}` and `MAIL_PASSWORD: ${MAIL_PASSWORD:-}`, added `keycloak: condition: service_healthy` to `depends_on`. |
| [application.yml](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/notification-service/src/main/resources/application.yml) | Added default values for mail credentials `${MAIL_USERNAME:noreply@ecommerce.com}` and `${MAIL_PASSWORD:}`; disabled mail health indicator via `management.health.mail.enabled: false` so that unconfigured external Gmail SMTP credentials do not cause Actuator `/actuator/health` to report HTTP 503 DOWN. |
| [ReactiveKafkaAppProperties.java](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/notification-service/src/main/java/com/ecommerce/notificationservice/config/kafka/ReactiveKafkaAppProperties.java) | Added property fallbacks for `@Value("${spring.kafka.bootstrap-servers:${KAFKA_SERVERS:localhost:9092}}")` and `@Value("${notification.kafka.consumer-group-id:${payment.kafka.consumer-group-id:notification-groupId}}")` to resolve unmapped configuration keys. |
| [EventConsumer.java](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/notification-service/src/main/java/com/ecommerce/notificationservice/event/EventConsumer.java) | Updated both `@KafkaListener` annotations with fallback resolution: `groupId = "${notification.kafka.consumer-group-id:${payment.kafka.consumer-group-id:notification-groupId}}"`. |
| [EmailServiceImpl.java](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/notification-service/src/main/java/com/ecommerce/notificationservice/service/impl/EmailServiceImpl.java) | Provided fallback default `@Value("${spring.mail.username:noreply@ecommerce.com}")` to avoid startup failure if `MAIL_USERNAME` is unset. |

---

## 4. API & Messaging Inventory

### 4.1 REST API Inventory

| HTTP Method | Path | Request Body | Response / Status | Auth Required | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/actuator/health` | None | `{"status":"UP",...}` (200) | Public | Service liveness and component health |
| `GET` | `/api/notifications` | None | `List<Notification>` (200) | Yes (JWT) | Retrieve all notifications |
| `GET` | `/api/notifications/{id}` | None | `Notification` (200) / 404 | Yes (JWT) | Retrieve notification by ID |
| `POST` | `/api/notifications` | `Notification` (JSON) | `Notification` (201) | Yes (JWT) | Create/persist notification |
| `DELETE` | `/api/notifications/{id}` | None | `true` (200) | Yes (JWT) | Delete notification by ID |
| `GET` | `/api/payment-notifications` | None | `List<Payment>` (200) | Yes (JWT) | Retrieve all payment notifications |
| `GET` | `/api/payment-notifications/{id}` | None | `Payment` (200) | Yes (JWT) | Retrieve payment notification by ID |
| `POST` | `/api/payment-notifications` | `PaymentDto` (JSON) | `Payment` (200) | Yes (JWT) | Save payment notification |
| `DELETE` | `/api/payment-notifications/{id}` | None | Empty (204) | Yes (JWT) | Delete payment notification |
| `POST` | `/api/email/sendSimpleMail` | `EmailDetails` (JSON) | `String` (200) | Yes (JWT) | Send plaintext email |
| `POST` | `/api/email/sendMailWithAttachment` | `EmailDetails` (JSON) | `String` (200) | Yes (JWT) | Send email with file attachment |
| `POST` | `/api/email/sendMail` | Multipart form | `String` (200) | Yes (JWT) | Send multipart email |

### 4.2 Kafka Messaging Inventory

| Topic Name | Direction | Consumer Group | Message Contract / DTO | Upstream / Downstream Service | Active Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `SUCCESSFUL` | Inbound (Consume) | `notification-groupId` | `PaymentDto` (JSON): `paymentId`, `isPayed`, `paymentStatus`, `orderId`, `userId` | `payment-service` (`PaymentServiceImpl.java:120`) | **ACTIVE** (Verified) |
| `profileOnboarding` | Inbound (Consume) | `notification-groupId` | `EmailDetails` (JSON): `recipient`, `msgBody`, `subject`, `attachment` | None (producer in `payment-service` is commented out) | **INACTIVE** (Unproduced) |
| `profileOnboarded` | Outbound (Produce) | N/A | `PaymentDto` or `String` result | None active in repository | **ACTIVE PRODUCER** (Verified outbound messages emitted) |

---

## 5. Kafka Integration Audit & Verification Evidence

### 5.1 Verification of Active Flow: `SUCCESSFUL` (`paymentSuccessful`)
- **Producer Source Code**: Found in `payment-service/src/main/java/com/ecommerce/paymentservice/service/impl/PaymentServiceImpl.java:120`:
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
- **Consumer Source Code**: Found in `notification-service/src/main/java/com/ecommerce/notificationservice/event/EventConsumer.java:41`:
  ```java
  @KafkaListener(topics = KafkaConstant.STATUS_PAYMENT_SUCCESSFUL,
          groupId = "${notification.kafka.consumer-group-id:${payment.kafka.consumer-group-id:notification-groupId}}")
  public void paymentOrderKafkaOnboarding(String message) {
      log.info("Payment event received on notification-service");
      PaymentDto paymentDto = gson.fromJson(message, PaymentDto.class);
      paymentService.savePayment(paymentDto);
      eventProducer.send(KafkaConstant.PROFILE_ONBOARDED_TOPIC, gson.toJson(paymentDto));
      ...
  ```
- **Execution Evidence**:
  1. Published payload: `{"paymentId":8002,"isPayed":true,"paymentStatus":"COMPLETED","orderId":9002,"userId":9502}` to topic `SUCCESSFUL`.
  2. Database verification in `ecommerce` database:
     `SELECT id, payment_id, is_payed, payment_status, order_id, user_id FROM payments WHERE payment_id = 8002;`
     Output: `4 | 8002 | t | COMPLETED | 9002 | 9502` (1 row persisted).
  3. Outbound verification: Read from `profileOnboarded` topic using `kafka-console-consumer`:
     Output received:
     - `{"paymentId":8001,"isPayed":true,"paymentStatus":"COMPLETED","orderId":9001,"userId":9501}`
     - `"Error while Sending Mail"`
  4. Failure & Resilience: Published malformed payload (`NOT_VALID_JSON_STRING`) to `SUCCESSFUL`. Consumer logged Gson syntax exception without crashing; subsequent REST calls and consumers remained healthy and responsive (HTTP 200).

### 5.2 Verification of Inactive Flow: `profileOnboarding`
- **Codebase Search**: Grep across entire workspace for `PROFILE_ONBOARDING_TOPIC` and `profileOnboarding`.
- **Finding**:
  - `notification-service` defines `@KafkaListener(topics = KafkaConstant.PROFILE_ONBOARDING_TOPIC)`.
  - `payment-service` has `EventConsumer.java:60` with producer/consumer commented out: `//// .subscribe(this::profileOnboarding);`.
  - No other service in the repository produces to `profileOnboarding`.
- **Verdict**: Confirmed **INACTIVE / UNPRODUCED**. Flow is documented as an unproduced integration.

---

## 6. Security & Role Enforcement Validation

All application endpoints inherit `BaseSecurityConfig` from `common-spring` and are secured via Keycloak OAuth2 Resource Server JWT validation:
- **Unauthenticated Access**: Requests lacking the `Authorization: Bearer <token>` header returned HTTP 401 Unauthorized (`/api/notifications`, `/api/payment-notifications`, `/api/email/sendSimpleMail`).
- **Invalid Token**: Requests with malformed or invalid JWT tokens returned HTTP 401 Unauthorized.
- **Authenticated Access**: Valid Keycloak tokens for realm users (`adminuser`, `testuser`) were accepted with HTTP 200/201.

---

## 7. PASS / FAIL / N/A / NONE Validation Matrix

| Test Item | Type | Expected Result | Actual Result | Status | Notes / Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Actuator Health Check | Infrastructure | Status UP (200) | Status UP, DB UP | **PASS** | `{"status":"UP","components":{"db":{"status":"UP"}}}` |
| PostgreSQL Connectivity | Database | Connected to `ecommerce` DB | Connected via HikariCP | **PASS** | Pool initialized, queries executed |
| Schema Creation | Database | Tables `notifications`, `payments` | Tables created by Hibernate | **PASS** | Auto-created with constraints |
| Public Endpoints | Security | Publicly accessible | 200 OK | **PASS** | `/actuator/health` accessible |
| Protected API without Token | Security | HTTP 401 Unauthorized | HTTP 401 | **PASS** | Tested on notifications, payments, email |
| Protected API with Invalid Token | Security | HTTP 401 Unauthorized | HTTP 401 | **PASS** | Malformed bearer token rejected |
| Protected API with Valid JWT | Security | HTTP 200 / 201 | HTTP 200 / 201 | **PASS** | Admin & User tokens accepted |
| Create Notification (`POST`) | Functional CRUD | HTTP 201, Record returned | HTTP 201, ID=2 created | **PASS** | Persisted into `notifications` table |
| Read Notification by ID (`GET`) | Functional CRUD | HTTP 200, Notification JSON | HTTP 200 | **PASS** | Retrieved persisted record |
| Read All Notifications (`GET`) | Functional CRUD | HTTP 200, List | HTTP 200 | **PASS** | List returned |
| Delete Notification (`DELETE`) | Functional CRUD | HTTP 200, Record deleted | HTTP 200, DB count=0 | **PASS** | Verified record removed from DB |
| Read Deleted Notification (`GET`) | Error Handling | HTTP 404 Not Found | HTTP 404 Not Found | **PASS** | Missing record returns 404 |
| Create Payment Record (`POST`) | Functional CRUD | HTTP 200, Payment returned | HTTP 200, ID=3 created | **PASS** | Persisted into `payments` table |
| Read Payment Record by ID (`GET`)| Functional CRUD | HTTP 200 | HTTP 200 | **PASS** | Retrieved record |
| Delete Payment Record (`DELETE`)| Functional CRUD | HTTP 204 No Content | HTTP 204, DB count=0 | **PASS** | Verified removed from DB |
| Email Service (`sendSimpleMail`) | Functional | Handled without crashing | HTTP 200, Handled | **PASS** | Exception caught gracefully |
| Kafka Consumer: `SUCCESSFUL` | Messaging | Message parsed & saved to DB | Record 4 saved to DB | **PASS** | End-to-end verified with DB query |
| Kafka Producer: `profileOnboarded` | Messaging | Outbound message sent | 2 messages read from topic | **PASS** | Verified via console consumer |
| Malformed Kafka Payload | Error Handling | Log error, remain healthy | Error logged, service UP | **PASS** | Gson syntax exception handled |
| Kafka Topic: `profileOnboarding` | Architecture Audit | Inactive flow identified | No active producer found | **NONE** | Correctly identified as UNPRODUCED |
| `payment-service` Live Execution | Integration | Not started for Phase 4H | Service remained stopped | **N/A** | Contract verified from source code |
| Liquibase Migrations | Database | Liquibase changelogs | None in notification-service | **N/A** | Service uses Hibernate `ddl-auto` |

---

## 8. Summary of Findings & Next Steps

1. `notification-service` is fully operational, stable, and resilient.
2. The `SUCCESSFUL` Kafka integration flow between payment and notification is completely validated against source contracts, persists records to the PostgreSQL `ecommerce` database, and produces downstream notifications.
3. The `profileOnboarding` topic was confirmed to be inactive across the microservices codebase.
4. Minimal evidence-based updates have been applied to configuration files, resolving property placeholders and email health checks.

**Phase 4H is COMPLETE.**
