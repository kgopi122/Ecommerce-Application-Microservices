# Environment Variable Inventory

This document inventory lists all critical environment variables defined across `.env`, `docker-compose.yml`, Spring Boot `application.yml` files, and Kubernetes manifests (`k8s/configmap.yaml` and `k8s/secrets.yaml`).

---

## 1. Infrastructure Environment Variables

| Variable Name | Default / Example Value | Description | Used By |
| :--- | :--- | :--- | :--- |
| `POSTGRES_HOST` | `localhost` / `postgres` | Hostname for PostgreSQL DB server | Backend services, Notification Service |
| `POSTGRES_PORT` | `5432` | Port for PostgreSQL DB | Backend services |
| `POSTGRES_USER` | `admin` | Database admin user name | PostgreSQL, Keycloak, Backend services |
| `POSTGRES_PASSWORD` | `admin` | Database admin password | PostgreSQL, Keycloak, Backend services |
| `REDIS_HOST` | `localhost` / `redis` | Redis cache hostname | Redis, Kubernetes ConfigMap |
| `REDIS_PORT` | `6379` | Redis port | Redis |
| `REDIS_PASSWORD` | `admin` | Redis password | Redis |
| `KAFKA_SERVERS` | `localhost:9092` / `kafka:9092` | Kafka broker bootstrap list | Order, Payment, Search, Notification services |
| `ELASTICSEARCH_URL` | `http://localhost:9200` | Elasticsearch HTTP endpoint | Search Service |
| `ELASTICSEARCH_USERNAME` | `""` | Elasticsearch username | Search Service |
| `ELASTICSEARCH_PASSWORD` | `""` | Elasticsearch password | Search Service |
| `STORAGE_ENDPOINT` | `http://localhost:9000` / `http://rustfs:9000` | RustFS/S3 Object storage endpoint | Media Service |
| `STORAGE_REGION` | `us-east-1` | S3 Storage region | Media Service |
| `STORAGE_ACCESS_KEY` | `admin` | S3 Storage access key | Media Service, RustFS |
| `STORAGE_SECRET_KEY` | `admin` | S3 Storage secret key | Media Service, RustFS |
| `STORAGE_BUCKET` | `ecommerce-media` | S3 Storage bucket name | Media Service |

---

## 2. Security & Keycloak Environment Variables

| Variable Name | Default / Example Value | Description | Used By |
| :--- | :--- | :--- | :--- |
| `KEYCLOAK_ADMIN` | `admin` | Keycloak admin account username | Keycloak container |
| `KEYCLOAK_ADMIN_PASSWORD` | `admin` | Keycloak admin account password | Keycloak container |
| `KEYCLOAK_SERVER_URL` | `http://localhost:8080` / `http://keycloak:8080` | Keycloak internal server URL | Auth Service, APISIX, Swagger UI |
| `KEYCLOAK_PUBLIC_SERVER_URL` | `http://localhost:8080` / `http://keycloak.ecommerce.local` | Keycloak public browser URL | Auth Service |
| `KEYCLOAK_REALM` | `ecommerce` | Keycloak realm name | Auth Service, APISIX |
| `KEYCLOAK_CLIENT_ID` | `ecommerce-client` | OIDC Client ID | Auth Service, APISIX |
| `KEYCLOAK_CLIENT_SECRET` | `""` / `changeme-ecommerce-client-secret` | OIDC Client secret | APISIX (openid-connect plugin) |
| `JWT_ISSUER_URI` | `http://localhost:8080/realms/ecommerce` | JWT Issuer URI for OAuth2 Resource Server | All 13 Backend Microservices |
| `KEYCLOAK_JWK_SET_URI` | `http://localhost:8080/realms/ecommerce/protocol/openid-connect/certs` | JWK Set URI for token verification | Common Security Library |

---

## 3. Application & Service Specific Variables

| Variable Name | Default / Example Value | Description | Used By |
| :--- | :--- | :--- | :--- |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://postgres:5432/<dbname>` | Service JDBC connection URL | All Spring Boot microservices |
| `MAIL_USERNAME` | `hoangtien2k3qx1@yopmail.com` | Email SMTP account | Notification Service |
| `MAIL_PASSWORD` | `"ecommerce@!@#"` | Email SMTP password / app pass | Notification Service |
| `SSO_BACKEND_CALLBACK_URL` | `http://localhost:8088/api/v1/auth/callback` | OAuth2 redirect URL to backend | Auth Service |
| `SSO_DEFAULT_FRONTEND_REDIRECT` | `http://localhost:3000/auth/callback` | Frontend callback URL post-login | Auth Service |
| `SSO_ALLOWED_REDIRECT_URIS` | `http://localhost:3000/auth/callback,http://localhost:3001/auth/callback` | Whitelisted redirect URIs | Auth Service |
| `NEXT_PUBLIC_API_URL` | `http://localhost:9080` | API Gateway public origin | Frontend (Next.js) |
| `APP_VERSION` | `v1` | Application version tag for OpenAPI | Microservices OpenAPI |
