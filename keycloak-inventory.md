# Keycloak Inventory & Identity Configuration

This document inventory details the Keycloak 26.0 configuration imported via `/docker/keycloak/import/ecommerce-realm.json`.

---

## Realm Information
* **Realm Name**: `ecommerce`
* **Display Name**: `Ecommerce Realm`
* **Enabled**: `true`
* **Login With Email**: `true`
* **Duplicate Emails Allowed**: `false`
* **Reset Password Allowed**: `true`
* **Issuer URL (Internal)**: `http://keycloak:8080/realms/ecommerce`
* **Issuer URL (Public/Local)**: `http://localhost:8080/realms/ecommerce`
* **JWK Set URI**: `http://keycloak:8080/realms/ecommerce/protocol/openid-connect/certs`

---

## Admin Credentials & Storage
* **Admin Username**: `${KEYCLOAK_ADMIN}` (Default: `admin`)
* **Admin Password**: `${KEYCLOAK_ADMIN_PASSWORD}` (Default: `admin`)
* **Database Target**: PostgreSQL container (`KC_DB=postgres`, `KC_DB_URL_HOST=postgres`, `KC_DB_URL_PORT=5432`, `KC_DB_URL_DATABASE=keycloak`)

---

## Clients

| Client ID | Client Name | Public / Confidential | Protocol | Enabled Flows | Allowed Redirect URIs | Web Origins |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `ecommerce-client` | Ecommerce Public Client | Public (`publicClient: true`) | OpenID Connect | Standard Flow (Auth Code), Direct Access Grants | `http://localhost:*`<br>`http://127.0.0.1:*`<br>`http://api.ecommerce.local/*` | `*` |

---

## Realm Roles

| Role Name | Description |
| :--- | :--- |
| `ADMIN` | Administrator role with full access to backoffice endpoints |
| `MANAGER` | Manager role for store and catalog administration |
| `USER` | Default user role for standard storefront customers |

---

## Pre-provisioned Users

| Username | Password | Email | Email Verified | Assigned Realm Roles |
| :--- | :--- | :--- | :--- | :--- |
| `testuser` | `testpass` | `testuser@local.dev` | `true` | `USER` |
| `adminuser` | `adminpass` | `adminuser@local.dev` | `true` | `ADMIN`, `MANAGER` |
