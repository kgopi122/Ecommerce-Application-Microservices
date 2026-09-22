# Unresolved Service Dependencies & Architecture Gaps

This document records missing or unresolvable service dependencies discovered during the repository architecture audit and dependency analysis.

---

## 1. Missing `location-service` Dependency in `tax-service`

### Overview
`tax-service` contains a client class `LocationService.java` which attempts to call an external service at `serviceUrlConfig.location()` (`/backoffice/state-or-provinces/state-country-names`).

### Discovery & Code Evidence
* **File**: `tax-service/src/main/java/com/ecommerce/tax/service/LocationService.java`
* **Configuration Class**: `tax-service/src/main/java/com/ecommerce/tax/config/ServiceUrlConfig.java` (`public record ServiceUrlConfig(String location)`)
* **Endpoint Called**: `GET /backoffice/state-or-provinces/state-country-names?stateOrProvinceIds=...`
* **Invocation Site**: `TaxRateService.java` line 139 (`locationService.getStateOrProvinceAndCountryNames(stateOrProvinceIds)`), exposed via `TaxRateController.java` (`GET /tax/backoffice/tax-rates/location-based-batch`).

### Investigation Findings
1. **Repository Inventory**: Search across the entire repository confirms there is **NO `location-service`** module or codebase present in this repository.
2. **Impact on Startup**: `tax-service` starts up **SUCCESSFULLY** without error because `LocationService` is a standard Spring `@Service` bean and property binding defaults to `http://location-service`.
3. **Runtime Impact**: Invoking the batch endpoint `GET /tax/backoffice/tax-rates/location-based-batch` triggers a REST request to `http://location-service`. Because `LocationService.java` is annotated with Resilience4j `@CircuitBreaker(name = "restCircuitBreaker", fallbackMethod = "handleLocationNameListFallback")`, the call gracefully fails over to the fallback handler when `location-service` is unreachable.
4. **Conclusion**: `location-service` represents a legacy or unmigrated external service dependency. No `location-service` should be created in this codebase; the fallback mechanism handles missing responses gracefully.

---

## Summary of Unresolved Dependencies

| Target Service | Invoking Service | Triggering Endpoint | Impact on Startup | Resilience / Fallback | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `location-service` | `tax-service` | `GET /tax/backoffice/tax-rates/location-based-batch` | **None** (Starts OK) | Covered by Resilience4j Fallback | Documented (No Action) |
