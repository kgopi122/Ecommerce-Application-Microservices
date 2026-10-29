# Media Service Runtime & Storage Validation Report (Phase 4D)

**Document Version:** 1.0  
**Target Service:** `media-service`  
**Execution Date:** 2026-10-27  
**Runtime Configuration:** Port `8083`, Context Path `/media`, Database `mediaservice`, Database Host `postgres:5432`, Storage Backend `rustfs:9000` (S3 API), Identity Provider `keycloak:8080`.

---

## 1. Executive Summary & Status Matrix

`media-service` was built, containerized, and validated end-to-end within the Docker bridge network (`ecommerce-network`). All runtime migrations, database schema elements, RustFS/S3 object storage connectivity, bucket auto-creation, security enforcement rules, image uploads (PNG and JPEG), metadata persistence, byte-for-byte download verification, MIME/ImageIO validation, container restart resilience, error handling, and product service reference tracing were tested against live containers and verified directly in PostgreSQL and RustFS.

| Subsystem / Test Area | Status | Evidence Summary |
| :--- | :---: | :--- |
| **MEDIA BUILD / STARTUP** | **PASS** | Clean build via Maven (Java 21). Container started in 15.11s on port `8083` (context path `/media`), actuator on port `9000`. |
| **POSTGRES / LIQUIBASE / SCHEMA** | **PASS** | Connected to `postgres:5432/mediaservice`. Liquibase executed changeset `issue-848`. Verified table `media`, primary key `media_pkey`, and columns (`id`, `caption`, `file_name`, `file_path`, `media_type`). |
| **RUSTFS / S3 STORAGE & BUCKET** | **PASS** | Connected to `rustfs:9000` using path-style S3 access. Auto-created bucket `ecommerce-media` upon startup. Objects successfully stored, retrieved, and deleted. |
| **API INVENTORY** | **PASS** | All 5 REST endpoints and actuator cataloged with HTTP methods, paths, parameters, authentication rules, and view models. |
| **PUBLIC ACCESS / JWT / ROLE ENFORCEMENT** | **PASS** | Public endpoints (`GET /medias/{id}`, `GET /medias?ids=...`, `GET /medias/{id}/file/{fileName}`) accessible without token. Protected endpoints reject unauthenticated (`401`) and invalid tokens (`401`). `POST /medias` strictly enforces `ROLE_ADMIN` (`403 Forbidden` for standard `USER` role). |
| **FILE UPLOAD & PERSISTENCE** | **PASS** | Uploaded valid PNG with `fileNameOverride` and JPEG without override. Verified metadata persistence in PostgreSQL and object keys in S3. |
| **DOWNLOAD & BYTE-FOR-BYTE INTEGRITY** | **PASS** | Downloaded PNG and JPEG files from `/medias/{id}/file/{fileName}`. Binary streams matched uploaded byte arrays 100% identically. |
| **VALIDATION & INVALID FILE HANDLING** | **PASS** | Upload of unapproved MIME type (`text/plain`), corrupted image bytes (rejected by `ImageIO.read`), and missing file parameter rejected with HTTP `400 Bad Request`. |
| **ERROR RESPONSES & MISSING OBJECTS** | **PASS** | Non-existent media metadata lookups and missing storage object requests return HTTP `404 Not Found` cleanly. |
| **DELETION & PERSISTENCE** | **PASS** | `DELETE /medias/{id}` with ADMIN token returned `204 No Content`. Database row removed (`COUNT == 0`) and subsequent lookups return `404`. |
| **CONTAINER RESTART RESILIENCE** | **PASS** | After `docker restart media-service`, PostgreSQL metadata remained intact and binary image content remained downloadable byte-for-byte from RustFS. |
| **PRODUCT-SERVICE INTEGRATION TRACE** | **PASS** | Source code audit and runtime checks confirmed `product-service` merely stores `imageUrl` as a `VARCHAR(255)` string in entity/DTO models; zero outbound HTTP calls to `media-service`. |
| **DOCKER NETWORKING & COMPOSE** | **PASS** | Verified Docker DNS and container-to-container connectivity for `postgres:5432`, `keycloak:8080`, `rustfs:9000`, and `product-service:8086`. Host port `8083` functional. |
| **KAFKA EVENTS** | **NONE** | Source code audit confirmed zero Kafka producers, consumers, or messaging dependencies present in `media-service`. |

---

## 2. Startup, Database, and S3 Storage Validation

### 2.1 Infrastructure Started
In accordance with phase restrictions, only necessary services were activated:
1. **PostgreSQL 16** (`postgres`): Healthy on `postgres:5432`, database `mediaservice` initialized.
2. **Keycloak 26.0** (`keycloak`): Healthy on `keycloak:8080`, realm `ecommerce` providing JWT token authentication.
3. **RustFS S3 Storage** (`rustfs`): Healthy on `rustfs:9000` (API) and `rustfs:9001` (console), backed by Docker volume `ecommerce-microservices_rustfs_data`.
4. **Product Service** (`product-service`): Running on port `8086` (context path `/product`) for compatibility verification.
5. **Media Service** (`media-service`): Built from local code and running on port `8083` with context path `/media`.

### 2.2 Liquibase Migrations
Liquibase executed upon container startup and recorded execution in table `databasechangelog`:

| ID | Author | Filename | Date Executed | Order | Exec Type |
| :--- | :--- | :--- | :--- | :---: | :---: |
| `issue-848` | bangvan | `db/changelog/ddl/changelog-0001.sql` | 2026-10-27 09:09:05 | 1 | `EXECUTED` |

### 2.3 PostgreSQL Schema Inspection
Actual schema extracted directly from container `postgres` (`psql -U admin -d mediaservice -c "\d+ media"`):

```
                                                                 Table "public.media"
   Column   |          Type          | Collation | Nullable |              Default              | Storage  | Compression | Stats target | Description 
------------+------------------------+-----------+----------+-----------------------------------+----------+-------------+--------------+-------------
 id         | bigint                 |           | not null | nextval('media_id_seq'::regclass) | plain    |             |              | 
 caption    | character varying(255) |           |          |                                   | extended |             |              | 
 file_name  | character varying(255) |           |          |                                   | extended |             |              | 
 file_path  | text                   |           |          |                                   | extended |             |              | 
 media_type | character varying(128) |           |          |                                   | extended |             |              | 
Indexes:
    "media_pkey" PRIMARY KEY, btree (id)
Access method: heap
```

### 2.4 RustFS / S3 Object Storage Inspection
- **Endpoint:** `http://rustfs:9000` (internal network) / `http://localhost:9000` (host).
- **Addressing:** Path-style access enabled (`path-style-access: true`).
- **Bucket:** `ecommerce-media` automatically created on startup via `S3ObjectStorageService.ensureBucketExists(...)`.
- **Object Key Scheme:** UUID-prefixed safe filename (e.g. `dc476140-a1da-4045-aaac-f42473945528-product-logo.png`).

---

## 3. API Inventory

All endpoints have context path `/media`:

| Controller | HTTP Method | Full Path | Auth / Roles | Request Parameters / Body | Response Body / Status | Purpose |
| :--- | :---: | :--- | :---: | :--- | :--- | :--- |
| `MediaController` | `POST` | `/media/medias` | Authenticated (`ROLE_ADMIN`) | Multipart form: `caption` (String), `fileNameOverride` (String), `multipartFile` (MultipartFile) | `NoFileMediaVm` (200) | Upload and persist image into S3 and PostgreSQL |
| `MediaController` | `GET` | `/media/medias/{id}` | Public (`permitAll`) | Path: `id` (Long) | `MediaVm` (200) or 404 | Retrieve media metadata and public download URL |
| `MediaController` | `GET` | `/media/medias` | Public (`permitAll`) | Query: `ids` (List<Long>, `@NotEmpty`) | `List<MediaVm>` (200) or 404 | Retrieve batch media metadata by ID list |
| `MediaController` | `GET` | `/media/medias/{id}/file/{fileName}` | Public (`permitAll`) | Path: `id` (Long), `fileName` (String) | `InputStreamResource` (200) or 404 | Stream/download binary file content from RustFS/S3 |
| `MediaController` | `DELETE` | `/media/medias/{id}` | Authenticated (`ROLE_ADMIN` / Authenticated) | Path: `id` (Long) | Void (204 No Content) | Delete media record from DB and remove object from S3 |
| `Actuator` | `GET` | `/actuator/health` | Public (Port 9000) | None | Health JSON (200) | Service, DB, and disk health metrics |

### Associated DTOs & View Models:
- **`MediaPostVm`**: Request model containing `caption` (String), `fileNameOverride` (String), and `multipartFile` (`MultipartFile`, validated via `@ValidFileType`).
- **`NoFileMediaVm`**: Creation response containing `id` (Long), `caption` (String), `fileName` (String), `mediaType` (String).
- **`MediaVm`**: Detailed view model extending `NoFileMediaVm` with `url` (String).
- **`MediaDto`**: Internal transfer object carrying `mediaType` (`MediaType`) and `content` (`InputStream`).

---

## 4. Security Tests (Keycloak JWT & Roles)

Security tests were executed using live Keycloak tokens generated against `http://keycloak:8080/realms/ecommerce/protocol/openid-connect/token` for realm users `adminuser` and `testuser`.

| Test Scenario | Endpoint Tested | Auth Header | Expected Status | Actual Status | Result |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **Public Metadata Lookup** | `GET /media/medias/999999` | None | `404 Not Found` | `404` | **PASS** |
| **Public Batch Lookup** | `GET /media/medias?ids=999998,999999` | None | `404 Not Found` | `404` | **PASS** |
| **Upload without Token** | `POST /media/medias` | None | `401 Unauthorized` | `401` | **PASS** |
| **Upload with Invalid Token** | `POST /media/medias` | Bearer (Malformed JWT) | `401 Unauthorized` | `401` | **PASS** |
| **Upload with USER Role** | `POST /media/medias` | Bearer (`ROLE_USER`) | `403 Forbidden` | `403` | **PASS** |
| **Upload with ADMIN Role** | `POST /media/medias` | Bearer (`ROLE_ADMIN`) | `200 OK` | `200` | **PASS** |
| **Delete without Token** | `DELETE /media/medias/999999` | None | `401 Unauthorized` | `401` | **PASS** |
| **Delete with Invalid Token** | `DELETE /media/medias/999999` | Bearer (Malformed JWT) | `401 Unauthorized` | `401` | **PASS** |
| **Delete with ADMIN Token** | `DELETE /media/medias/{id}` | Bearer (`ROLE_ADMIN`) | `204 No Content` | `204` | **PASS** |

---

## 5. File Upload, Storage, and Data Integrity Tests

Automated validation suite (`scratch/validate_media_service.py`) executed 40 end-to-end assertions.

### 5.1 Upload & Database Persistence
1. **PNG Upload with `fileNameOverride` (`POST /media/medias`)**:
   - Payload: `caption: "Logo Image"`, `fileNameOverride: "product-logo.png"`, `multipartFile: sample.png`.
   - Response: `HTTP 200 OK`, assigned ID `5`.
   - PostgreSQL Verification: Query `SELECT id, caption, file_name, file_path, media_type FROM media WHERE id = 5` returned `5|Logo Image|product-logo.png|dc476140-a1da-4045-aaac-f42473945528-product-logo.png|image/png` (`PASS`).
2. **JPEG Upload without override (`POST /media/medias`)**:
   - Payload: `caption: "Banner Image"`, `multipartFile: sample.jpg` (original filename `banner.jpg`).
   - Response: `HTTP 200 OK`, assigned ID `6`.
   - PostgreSQL Verification: Query returned `6|Banner Image|banner.jpg|image/jpeg` (`PASS`).

### 5.2 Retrieval & Download Integrity
3. **Metadata & URL Format Verification (`GET /media/medias/5`)**:
   - HTTP Status: `200 OK`.
   - Response URL: `http://localhost:8083/media/medias/5/file/product-logo.png`.
   - Verified that URL incorporates servlet context path `/media` (`PASS`).
4. **Batch ID Lookup (`GET /media/medias?ids=5,6`)**:
   - HTTP Status: `200 OK`.
   - Returned array of 2 items matching metadata for IDs 5 and 6 (`PASS`).
5. **Binary Download & Integrity (`GET /media/medias/5/file/product-logo.png`)**:
   - HTTP Status: `200 OK`, `Content-Type: image/png`.
   - Downloaded stream: 82 bytes.
   - Verified byte-for-byte exact equality against the uploaded PNG payload (`PASS`).
6. **Binary Download & Integrity (`GET /media/medias/6/file/banner.jpg`)**:
   - HTTP Status: `200 OK`, `Content-Type: image/jpeg`.
   - Downloaded stream: 643 bytes.
   - Verified byte-for-byte exact equality against the uploaded JPEG payload (`PASS`).

---

## 6. Validation and Error Handling Tests

| Scenario | Request | Expected Status | Actual Status | Error Detail / Behavior | Result |
| :--- | :--- | :---: | :---: | :--- | :---: |
| **Unapproved MIME Type** | `POST /media/medias` (`text/plain`) | `400 Bad Request` | `400` | Rejected by `@ValidFileType`: allowed types JPEG, PNG, GIF | **PASS** |
| **Corrupted Image Bytes** | `POST /media/medias` (Corrupt header) | `400 Bad Request` | `400` | Rejected by `ImageIO.read` in `FileTypeValidator` | **PASS** |
| **Missing Multipart File** | `POST /media/medias` (No file field) | `400 Bad Request` | `400` | Constraint violation on `@NotNull multipartFile` | **PASS** |
| **Missing Media Entity** | `GET /media/medias/888888` | `404 Not Found` | `404` | Non-existent entity handled cleanly | **PASS** |
| **Missing Media File Stream** | `GET /media/medias/888888/file/nonexistent.png` | `404 Not Found` | `404` | Safeguard in `MediaController.getFile` returns 404 | **PASS** |

---

## 7. Deletion Operations and Container Restart Resilience

### 7.1 Deletion Verification
1. Executed `DELETE /media/medias/5` with ADMIN token: `HTTP 204 No Content`.
2. Verified in PostgreSQL: `SELECT COUNT(*) FROM media WHERE id = 5` returned `0` (`PASS`).
3. Verified subsequent metadata lookup `GET /media/medias/5` returned `404 Not Found` (`PASS`).
4. Verified subsequent file stream `GET /media/medias/5/file/product-logo.png` returned `404 Not Found` (`PASS`).

### 7.2 Container Restart Resilience
1. Retained Media ID 6 (`banner.jpg`) in PostgreSQL and RustFS.
2. Restarted the container via `docker restart media-service`.
3. Polled until container became ready and healthy.
4. Verified metadata lookup `GET /media/medias/6` returned `HTTP 200 OK` (`PASS`).
5. Downloaded `GET /media/medias/6/file/banner.jpg` (643 bytes): stream content remained 100% intact and identical to the original JPEG (`PASS`).
6. Cleaned up Media ID 6 via `DELETE /media/medias/6` (`204 No Content`).

---

## 8. Product Reference Tracing & Downstream Integration

Requirement 7 asked to determine whether `product-service` calls `media-service` or simply stores media references based on source code evidence:

1. **Source Code Inspection (`product-service`):**
   - In [Product.java](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/product-service/src/main/java/com/ecommerce/productservice/entity/Product.java#L28-L29):
     ```java
     @Column(name = "image_url")
     private String imageUrl;
     ```
   - In [Category.java](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/product-service/src/main/java/com/ecommerce/productservice/entity/Category.java#L31-L32):
     ```java
     @Column(name = "image_url")
     private String imageUrl;
     ```
   - In [ProductMappingHelper.java](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/product-service/src/main/java/com/ecommerce/productservice/helper/ProductMappingHelper.java#L24) and [CategoryMappingHelper.java](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/product-service/src/main/java/com/ecommerce/productservice/helper/CategoryMappingHelper.java#L25): DTO mapping transfers `imageUrl` as a raw string.
   - Search across `product-service` confirmed zero `RestClient`, `WebClient`, `RestTemplate`, or Feign clients referencing `media-service`.
2. **Architectural Finding:**
   - `product-service` does **not** call `media-service`. It merely stores image URLs/references (`imageUrl`) provided by clients or frontend applications.
3. **Runtime Compatibility:**
   - `product-service:8086` was verified healthy and responding with HTTP 200 during testing.

---

## 9. Docker Compose Configuration & Networking

The combined `docker-compose.yml` was validated:
- `media-service` configured with `build: ./media-service` for local builds.
- Dependencies on `postgres`, `keycloak`, and `rustfs` enforced with `condition: service_healthy`.
- Environment variable `HOANGTIEN2K3_PUBLICURL: http://localhost:8083/media` ensures generated media URLs match the Tomcat servlet context path `/media`.
- Verified container-to-container DNS resolution from `media-service` to `postgres:5432`, `keycloak:8080`, and `rustfs:9000` via netcat tests.

---

## 10. Configuration & Source Code Fixes Applied

In accordance with Phase 4D constraints ("Fix only confirmed issues. Do not add services, change architecture, add Kafka producers, or modify APISIX/Kubernetes or unrelated services"), the following minimal fixes were applied:

1. [MediaController.java](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/media-service/src/main/java/com/ecommerce/media/controller/MediaController.java#L92-L96):
   - Added null guard in `getFile(...)`: `if (mediaDto == null || mediaDto.getContent() == null) return ResponseEntity.notFound().build();`. This prevents an `IllegalArgumentException` (HTTP 500) when requesting non-existent files.
2. [MediaServiceImpl.java](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/media-service/src/main/java/com/ecommerce/media/service/MediaServiceImpl.java#L30):
   - Updated `publicUrl` default from `http://localhost:8083` to `http://localhost:8083/media` so generated URLs incorporate the servlet context path.
   - Wrapped storage download in `getFile(...)` with try-catch to return an empty builder on missing S3 objects instead of throwing uncaught exceptions.
3. [application.yml](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/media-service/src/main/resources/application.yml#L47-L49):
   - Added `hoangtien2k3.publicUrl: ${HOANGTIEN2K3_PUBLICURL:${MEDIA_PUBLIC_URL:http://localhost:8083/media}}`.
4. [docker-compose.yml](file:///c:/Users/gsai4/Documents/Capstone%284-1%29/Ecommerce-Microservices-Application/ecommerce-microservices/docker-compose.yml#L315-L338):
   - Added `build: ./media-service`.
   - Added `keycloak: condition: service_healthy` under `depends_on`.
   - Added `HOANGTIEN2K3_PUBLICURL: http://localhost:8083/media`.

---

## 11. Conclusion

`media-service` is fully validated, operational, and healthy. All 40 automated validation tests passed (100% pass rate). Storage persistence in RustFS/S3 across container restarts is confirmed, and role-based access control for administrative uploads is strictly enforced.
