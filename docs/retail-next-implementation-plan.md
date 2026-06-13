# Retail Next Implementation Plan

This document tracks implementation gaps after the Retail Phase 1-7F backend delegate cleanup.

## Current assessment

The Retail foundation is functional, but the implementation is not complete enough to call the mode production-ready. The missing work is mostly generated-client consolidation, scoped validation, migration baseline hardening, and permission policy hardening.

## Missing implementation list

```txt
Phase 8A - Receiving status API route integration: implemented
Phase 8B - Receiving status frontend action wiring: implemented
Phase 8C - Return persistence + refund reversal workflow: implemented
Phase 8D - Sale cancellation + stock/cashflow reversal workflow: implemented
Phase 8E - Generated API client consolidation: planned
Phase 8F - Retail smoke test script and scoped CI gate: planned
Phase 8G - Retail migration baseline / idempotency hardening: planned
Phase 8H - Retail audit and permission policy hardening: planned
```

## Phase 8A - Receiving status API route integration: implemented

Implemented scope:

```txt
- PATCH /api/retail/receiving/:id/status is exposed
- Route is protected by Retail business context guard
- Route is protected by operations role guard
- Request body accepts only receiving statuses: draft, ordered, partial, received
- Route calls updateRetailReceivingStatusWithDelegate
- Invalid transitions return 409 instead of mutating rows
- Missing receiving records return 404
- Same-status updates remain idempotent and return 200 with updated=false
- OpenAPI spec documents the route
- React API client helper exists for receiving status updates
```

Primary files:

```txt
artifacts/api-server/src/routes/retail.ts
artifacts/api-server/src/services/retail/retail.workflow-status.repository.ts
lib/api-spec/openapi.yaml
lib/api-client-react/src/generated/api.schemas.ts
lib/api-client-react/src/generated/retail-receiving-status.ts
```

Endpoint contract:

```txt
PATCH /api/retail/receiving/:id/status
Body: { "status": "ordered" | "partial" | "received" | "draft" }
```

Allowed transitions remain enforced by the backend helper:

```txt
draft -> ordered
ordered -> partial
ordered -> received
partial -> received
received -> no forward transition yet
```

Validation examples:

```txt
PATCH /api/retail/receiving/{id}/status { "status": "ordered" }
PATCH /api/retail/receiving/{id}/status { "status": "partial" }
PATCH /api/retail/receiving/{id}/status { "status": "received" }
```

## Phase 8B - Receiving status frontend action wiring: implemented

Implemented scope:

```txt
- /v3/retail/receiving now renders an API-backed receiving workspace
- Receiving queue loads from GET /api/retail/receiving
- UI falls back to local mock receiving rows when API/auth/business mode is unavailable
- Mock fallback is read-only and disables mutation buttons
- Action buttons are shown from allowed status transitions
- draft rows show Mark ordered
- ordered rows show Mark partial and Mark received
- partial rows show Mark received
- received rows show final-status state and no mutation button
- Action buttons call PATCH /api/retail/receiving/:id/status
- UI shows per-action loading state
- UI reloads the receiving queue after successful mutation
- UI surfaces backend errors, including invalid transition 409 responses
```

Primary files:

```txt
artifacts/pos-system/src/app/workspace/retail/retail-receiving-api-workspace.tsx
artifacts/pos-system/src/app/workspace/retail/retail-workspace.tsx
lib/api-client-react/src/generated/retail-receiving-status.ts
```

Validation examples:

```txt
Open /v3/retail/receiving
Confirm the badge says Prisma API when authenticated in Retail mode
Select a draft receiving row and click Mark ordered
Select an ordered receiving row and click Mark partial or Mark received
Confirm fallback mode disables action buttons
```

## Phase 8C - Return persistence + refund reversal workflow: implemented

Implemented scope:

```txt
- RetailReturn and RetailReturnItem tables exist through scoped return migration
- Return Prisma schema sync exists and runs the base Retail schema sync first
- POST /api/retail/returns/preview keeps non-mutating preview behavior
- POST /api/retail/returns persists return workflow
- Original receipt number is validated against completed RetailSale rows
- Return lines are validated against original sale items
- Over-return is blocked using previous RetailReturnItem totals
- Restockable return lines increment RetailProduct.currentStock
- Restockable return lines create RetailStockMovement rows
- Refund creates CashflowEntry EXPENSE row
- Workflow writes AuditLog entry
- React API helper exists for return preview and persistence
```

Primary files:

```txt
artifacts/api-server/prisma/migrations/202606140004_add_retail_returns/migration.sql
artifacts/api-server/scripts/sync-retail-return-prisma-schema.ts
artifacts/api-server/src/services/retail/retail.return-repository.ts
artifacts/api-server/src/services/retail/retail.service.ts
artifacts/api-server/src/routes/retail.ts
lib/api-client-react/src/generated/retail-returns.ts
```

Validation examples:

```txt
POST /api/retail/sales/checkout
POST /api/retail/returns/preview
POST /api/retail/returns
Confirm stock movement, cashflow expense, and audit rows are created
```

## Phase 8D - Sale cancellation + stock/cashflow reversal workflow: implemented

Implemented scope:

```txt
- POST /api/retail/sales/:id/cancel is exposed
- Route is protected by Retail business context guard
- Route is protected by management role guard
- Request body accepts optional reason string
- Sale lookup is business-scoped
- Only completed sales can be cancelled
- Sales with persisted returns are blocked and must use the return workflow
- Sale status is guarded with updateMany where status=completed
- Paid payment rows are marked refunded
- Product stock is restored with guarded RetailProduct updateMany
- RetailStockMovement reversal rows are created with type=in and reason=sale_cancellation
- CashflowEntry EXPENSE reversal is created
- AuditLog captures previous status, next status, refund amount, restocked quantity, and movement IDs
- OpenAPI spec documents cancellation endpoint
- React API client helper exists for cancellation
```

Primary files:

```txt
artifacts/api-server/src/services/retail/retail.sale-cancellation-repository.ts
artifacts/api-server/src/routes/retail.ts
artifacts/api-server/src/services/retail/retail.types.ts
lib/api-spec/openapi.yaml
lib/api-client-react/src/generated/api.schemas.ts
lib/api-client-react/src/generated/retail-sale-cancellation.ts
```

Endpoint contract:

```txt
POST /api/retail/sales/:id/cancel
Body: { "reason": "Customer voided sale before settlement." }
```

Validation examples:

```txt
Create checkout with POST /api/retail/sales/checkout
Cancel the sale with POST /api/retail/sales/{saleId}/cancel
Confirm sale status becomes cancelled
Confirm payment status becomes refunded
Confirm stock is restored
Confirm CashflowEntry EXPENSE and AuditLog rows exist
Try cancelling the same sale again and expect cancellation to be blocked
Try cancelling a sale that already has RetailReturn rows and expect cancellation to be blocked
```

## Phase 8E - Generated API client consolidation: planned

Goal:

```txt
Move all manual Retail client helper exports into the generated api.ts surface once codegen is stable.
```

Scope:

```txt
- Regenerate OpenAPI client locally
- Ensure retailUpdateReceivingStatus, retailPersistReturn, and retailCancelSale land in generated api.ts
- Remove standalone temporary receiving/return/cancellation helpers if generated output covers them
- Replace remaining raw fetch calls in Retail frontend bridge
```

## Phase 8F - Retail smoke test script and scoped CI gate: planned

Goal:

```txt
Create a repeatable Retail-only validation command that catches broken API contracts before demo/testing.
```

Scope:

```txt
- Add script for retail:schema:sync + generate + typecheck:retail
- Add optional API smoke script for health/products/preview/checkout/receiving status/return/cancel flows
- Keep full backend typecheck separate until legacy non-retail files are cleaned
```

## Phase 8G - Retail migration baseline / idempotency hardening: planned

Goal:

```txt
Make Retail database setup safer on existing non-empty databases.
```

Scope:

```txt
- Add idempotent Retail table creation guard where practical
- Document baseline strategy for existing Neon/Postgres databases
- Avoid full prisma migrate deploy until legacy migration history is repaired
```

## Phase 8H - Retail audit and permission policy hardening: planned

Goal:

```txt
Move from broad operations guard to explicit policy rules per mutation.
```

Scope:

```txt
- Define who can mark receiving ordered/partial/received
- Define who can persist checkout
- Define who can refund, cancel sale, and reverse cashflow
- Normalize audit log payload shape across Retail workflows
```
