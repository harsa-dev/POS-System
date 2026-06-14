# Retail Phase 8H - Audit and Permission Policy Hardening

Status: implemented

## Goal

Harden Retail mutation access and make audit payloads consistent across the Retail workflows that affect money, stock, or operational state.

## Implemented scope

```txt
- Added explicit Retail permission policy constants
- Retail read routes use RETAIL_READ_ROLES
- Retail checkout preview/mock/checkout use RETAIL_CHECKOUT_ROLES
- Retail receiving status updates use RETAIL_RECEIVING_ROLES
- Retail return preview uses RETAIL_RETURN_PREVIEW_ROLES
- Retail return persistence uses RETAIL_RETURN_ROLES
- Retail sale cancellation uses RETAIL_CANCELLATION_ROLES
- Return persistence is now management-only instead of broad operations-only
- Added shared createRetailAuditPayload helper
- Checkout audit payload uses the normalized Retail audit shape
- Receiving status update audit payload uses the normalized Retail audit shape
- Return persistence audit payload uses the normalized Retail audit shape
- Sale cancellation audit payload uses the normalized Retail audit shape
```

## Permission matrix

```txt
Read Retail dashboard/products/inventory/receiving:
OWNER, MANAGER, ADMIN, OPERATOR, STAFF, VIEWER

Checkout preview/mock/commit:
OWNER, MANAGER, ADMIN, OPERATOR, STAFF

Receiving status update:
OWNER, MANAGER, ADMIN, OPERATOR, STAFF

Return preview:
OWNER, MANAGER, ADMIN, OPERATOR, STAFF

Return persistence/refund:
OWNER, MANAGER, ADMIN

Sale cancellation/full reversal:
OWNER, MANAGER, ADMIN
```

## Normalized audit payload shape

Retail audit `changes` now follows this shape for checkout, receiving status update, return persistence, and sale cancellation:

```txt
event
actor
references
totals
stockMovementIds
reason
metadata
```

## Primary files

```txt
artifacts/api-server/src/services/retail/retail.policy.ts
artifacts/api-server/src/services/retail/retail.audit.ts
artifacts/api-server/src/routes/retail.ts
artifacts/api-server/src/services/retail/retail.prisma-repository.ts
artifacts/api-server/src/services/retail/retail.workflow-status.repository.ts
artifacts/api-server/src/services/retail/retail.return-repository.ts
artifacts/api-server/src/services/retail/retail.sale-cancellation-repository.ts
```

## Validation

```bash
pnpm retail:check
```

Mutation smoke remains opt-in through explicit IDs and auth cookie:

```bash
pnpm retail:smoke
```
