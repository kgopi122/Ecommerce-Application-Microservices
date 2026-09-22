    # Infrastructure Status & Health Validation Report

    This document reports the validation status for the infrastructure components of the e-commerce platform.

    ---

    ## Infrastructure Health Summary

    | Component | Image / Version | Container Name | Healthcheck / Readiness | Container Networking (Host : Container) | Operational Status |
    | :--- | :--- | :--- | :--- | :--- | :--- |
    | **PostgreSQL** | `postgres:16` | `postgres` | `pg_isready -U postgres -d ecommerce` | `5432:5432` | **HEALTHY** |
    | **Redis** | `redis:7.4-alpine` | `redis` | `redis-cli ping` | `6379:6379` | **HEALTHY** |
    | **Kafka** | `apache/kafka:3.9.0` | `kafka` | `/opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --list` | `9092:9092` | **HEALTHY** (KRaft mode) |
    | **Elasticsearch** | `elasticsearch:8.15.0` | `elasticsearch` | `curl -f http://localhost:9200/_cluster/health` | `9200:9200` | **HEALTHY** |
    | **RustFS** | `rustfs/rustfs:latest` | `rustfs` | `curl -f http://localhost:9000/health` | `9000:9000`<br>`9001:9001` | **HEALTHY** |
    | **Keycloak** | `quay.io/keycloak/keycloak:26.0` | `keycloak` | `echo > /dev/tcp/localhost/8080` (Realm import check) | `8080:8080` | **HEALTHY** |
    | **APISIX** | `apache/apisix:3.9.1-debian` | `apisix` | Dependent on Keycloak health | `9080:9080`<br>`9091:9091` | **HEALTHY** |

    ---

    ## Infrastructure Component Deep Dive

    ### 1. PostgreSQL 16
    * **Databases Verified**: `keycloak`, `authservice`, `productservice`, `orderservice`, `paymentservice`, `shippingservice`, `inventoryservice`, `favouriteservice`, `ratingservice`, `mediaservice`, `taxservice`, `promotionservice`, `ecommerce`.
    * **Init Script**: Executed `/docker/postgres/init/create-all-databases.sql` successfully.
    * **Connectivity**: Accepts TCP connections on `5432`.

    ### 2. Keycloak 26.0
    * **Realm Import**: Executed `--import-realm` reading `/docker/keycloak/import/ecommerce-realm.json`.
    * **Realm Verified**: `ecommerce`
    * **Client Verified**: `ecommerce-client` (Public OIDC client)
    * **Users Verified**: `adminuser`, `testuser`
    * **Connectivity**: Accepts HTTP requests on `8080`.

    ### 3. Kafka 3.9.0 (KRaft)
    * **Architecture**: Single-node combined broker/controller in KRaft mode. No ZooKeeper dependency.
    * **Listeners**: Internal `kafka:9092`, Controller `kafka:9093`.
    * **Connectivity**: Accepts bootstrap connections on `9092`.

    ### 4. Elasticsearch 8.15.0
    * **Security**: Disabled (`xpack.security.enabled=false`).
    * **Cluster Status**: Single-node cluster running cleanly on `9200`.

    ### 5. RustFS
    * **Console**: Reachable on `9001`.
    * **S3 API**: Reachable on `9000`.

    ### 6. APISIX 3.9.1
    * **Mode**: Standalone mode using `/deploy/apisix/config.yaml` and `/deploy/apisix/apisix.yaml`.
    * **Plugins**: CORS, Rate-Limiting, Prometheus, OpenID Connect.
