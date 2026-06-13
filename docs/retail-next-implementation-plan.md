# Retail Next Implementation Plan

This document tracks implementation gaps after the Retail Phase 1-7F backend delegate cleanup.

## Current assessment

The Retail foundation is functional, but the implementation is not complete enough to call the mode production-ready. The missing work is mostly reversal workflows, generated-client consolidation, scoped validation, migration baseline hardening, and permission policy hardening.

## Missing implementation list

```txt
Phase 8A - Receiving status API route integration: implemented
Phase 8B - Receiving status frontend action wiring: implemented
Phase 8C - Return persistence + refund reversal workflow: planned
Phase 8D - Sale cancellation + stock/cashflow reversal workflow: planned
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

## Phase 8C - Return persistence + refund reversal workflow: planned

Goal:

```txt
Turn return preview into persisted Retail return workflow.
```

Scope:

```txt
- Persist return header and return lines or reuse a dedicated RetailReturn table
- Validate original receipt number
- Create refund payment or negative payment signal
- Create stock movement for restockable lines
- Create cashflow reversal entry
- Write audit log
- Require manager review for damaged/expired/missing receipt cases
```

## Phase 8D - Sale cancellation + stock/cashflow reversal workflow: planned

Goal:

```txt
Allow safe sale cancellation without corrupting stock or cashflow.
```

Scope:

```txt
- Business-scoped sale lookup
- Guard cancellation by sale status
- Restore stock through RetailProduct updateMany guard
- Create RetailStockMovement reversal rows
- Create payment/cashflow reversal
- Write audit log
- Reject cancellation after configured settlement window unless manager/owner
```

## Phase 8E - Generated API client consolidation: planned

Goal:

```txt
Move all manual Retail client helper exports into the generated api.ts surface once codegen is stable.
```

Scope:

```txt
- Regenerate OpenAPI client locally
- Ensure retailUpdateReceivingStatus lands in generated api.ts
- Remove standalone temporary receiving-status helper if generated output covers it
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
- Add optional API smoke script for health/products/preview/checkout/receiving status
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
