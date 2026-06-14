# Custom Business Service Retail-Style Implementation Plan

This document maps Business Mode Service / Custom Business Service into the same implementation format used by Retail and Raw Material.

The goal is parity across business modes without pretending every mode needs the exact same domain actions. Service Business has service requests, jobs, cost lines, quotes, invoices, payments, and workflow transitions instead of stock movements or product returns.

## Current validation baseline

Service Business backend implementation is already mature through the delegate cleanup lane.

Known completed capabilities:

```txt
persistence foundation
backend route family
workflow transition guard
workflow transition preview
service layer split
permission hardening
audit integration
shared dashboard backend summary
Prisma schema model mapping
summary read delegate
workflow read delegate
CRUD/billing write delegate
guarded workflow status delegate
```

Reference docs:

```txt
docs/workspaces/custom-business-service-backend-phases.md
docs/workspaces/custom-business-service-prisma-delegate-cleanup.md
```

Current known gap compared with Retail and Raw Material:

```txt
no root service:check gate
no scoped service typecheck config
no service smoke script
no service seed script
no service idempotent db apply/verify lane
no service OpenAPI/client consolidation lane
no explicit service audit + permission policy assertion lane
```

The API package currently has a basic Service DB apply script:

```txt
pnpm --filter @workspace/api-server run service:db:apply
```

That command directly executes the original migration SQL. It is useful, but it is not yet equivalent to the Retail/Raw Material scoped DB baseline pattern with guard + idempotent SQL + verify.

## Retail-style Service Business phases

```txt
Phase 1  - Service persistence foundation                         Done
Phase 2  - Backend route, guard, workflow preview                 Done
Phase 3  - Shared dashboard backend summary                       Done
Phase 4  - Seed service request/job/quote/invoice demo data       Planned
Phase 5  - Frontend service workflow API wiring                   Partial
Phase 6  - Service OpenAPI/client coverage                        Planned
Phase 7A - Prisma schema model mapping                            Done
Phase 7B - Summary read delegate                                  Done
Phase 7C - Workflow read delegate                                 Done
Phase 7D - Service quote/invoice preview delegate                 Planned
Phase 7E - Service write delegate                                 Done
Phase 7F - Guarded workflow status delegate                       Done
Phase 8A - Service status API route family                        Planned
Phase 8B - Service status frontend action                         Planned
Phase 8C - Quote/invoice cancellation reversal workflow           Planned
Phase 8D - Payment reversal workflow                              Planned
Phase 8E - Generated API client consolidation                     Planned
Phase 8F - Service smoke test + scoped CI gate                    Planned
Phase 8G - Service migration baseline/idempotency hardening       Planned
Phase 8H - Service audit + permission policy hardening            Planned
```

## Phase mapping notes

### Phase 1 - Service persistence foundation

Status: implemented.

Implemented by the original Service Business backend pass:

```txt
service business SQL migration
service request creation
job listing and workspace loading
cost line creation
quotation creation and approval
invoice creation
payment recording
timeline event creation
```

Main files:

```txt
artifacts/api-server/prisma/migrations/202606140002_add_service_business_core/migration.sql
artifacts/api-server/src/routes/service-business.ts
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-api.ts
```

### Phase 2 - Backend route, guard, workflow preview

Status: implemented.

Implemented endpoints:

```txt
GET   /api/custom-business/service/workflow/statuses
GET   /api/custom-business/service/jobs/:id/transition-preview?nextStatus=...
PATCH /api/custom-business/service/jobs/:id/guarded-status
```

### Phase 3 - Shared dashboard backend summary

Status: implemented.

Implemented endpoint:

```txt
GET /api/custom-business/service/summary
```

The frontend shared dashboard bridge reads backend summary first and falls back to local mock data when the API is unavailable.

### Phase 4 - Seed service request/job/quote/invoice demo data

Status: planned.

Recommended next implementation.

Expected output:

```txt
artifacts/api-server/scripts/seed-service-business-demo-data.ts
api-server script: service:seed
root or service docs command examples
```

Seed should be idempotent and cover:

```txt
service requests
service jobs across several workflow statuses
cost lines
approved quotation
issued invoice
paid or partially paid invoice
service timeline items
```

### Phase 5 - Frontend service workflow API wiring

Status: partial.

Already exists:

```txt
frontend service API client
frontend guarded status call
shared dashboard backend summary with fallback
```

Still needs parity hardening:

```txt
explicit contract metadata coverage
clear API-first/fallback status in UI
read delegate coverage for workflow lists if still mixed with mock data
```

### Phase 6 - Service OpenAPI/client coverage

Status: planned.

Expected output:

```txt
OpenAPI tag/path coverage for Service Business
operationId mapping in frontend service contract
client boundary similar to Raw Material generated API client consolidation
```

### Phase 7A - Prisma schema model mapping

Status: implemented.

Known mapped models:

```txt
ServiceRequest
ServiceJob
ServiceCostLine
ServiceQuotation
ServiceInvoice
ServiceChecklistItem
ServiceTimelineItem
```

### Phase 7B - Summary read delegate

Status: implemented.

The summary path now uses generated Prisma delegates through the Service Business delegate repository.

### Phase 7C - Workflow read delegate

Status: implemented.

Workflow target lookup and readiness checks use delegate-backed read helpers.

### Phase 7D - Service quote/invoice preview delegate

Status: planned.

This should provide read-only preview endpoints for:

```txt
quotation draft preview
invoice preview
payment recording preview
workflow transition preview normalization if needed
```

No mutation should happen in this phase.

### Phase 7E - Service write delegate

Status: implemented.

CRUD and billing writes moved to generated Prisma delegate helpers:

```txt
createServiceRequestRecordWithDelegate
createServiceCostLineRecordWithDelegate
createServiceQuotationRecordWithDelegate
approveServiceQuotationRecordWithDelegate
createServiceInvoiceRecordWithDelegate
recordServiceInvoicePaymentRecordWithDelegate
```

### Phase 7F - Guarded workflow status delegate

Status: implemented.

Guarded workflow status transition writes now use generated Prisma delegates.

### Phase 8A - Service status API route family

Status: planned.

Goal: add an explicit status route family like Raw Material did, while keeping compatibility routes.

Candidate endpoint:

```txt
POST /api/custom-business/service/status/jobs/:id
```

Body:

```json
{
  "status": "IN_PROGRESS",
  "note": "Move job into execution after approved quote."
}
```

### Phase 8B - Service status frontend action

Status: planned.

Goal: migrate frontend workflow status action to the new Phase 8A route family.

### Phase 8C - Quote/invoice cancellation reversal workflow

Status: planned.

Goal: safely reverse quote/invoice lifecycle where possible without deleting historical rows.

Candidate cases:

```txt
void issued invoice before payment
cancel quotation before invoice
reject quotation draft with timeline note
```

### Phase 8D - Payment reversal workflow

Status: planned.

Goal: support payment reversal/correction without deleting the original payment record.

This may require schema review before implementation. Do not force this phase without inspecting current invoice/payment data model first.

### Phase 8E - Generated API client consolidation

Status: planned.

Goal: centralize Service Business API calls by operation ID / generated-client boundary.

### Phase 8F - Service smoke test + scoped CI gate

Status: planned.

Expected output:

```txt
scripts/service-check.mjs
scripts/service-api-smoke.mjs
api-server tsconfig.service.json
pos-system tsconfig.service.json
root package scripts: service:check, service:smoke
```

Default scoped gate should avoid unrelated global errors.

### Phase 8G - Service migration baseline/idempotency hardening

Status: planned.

Expected output:

```txt
artifacts/api-server/scripts/apply-service-db.mjs
prisma/sql/service-baseline-guard.sql
idempotent service baseline SQL
prisma/sql/service-schema-verify.sql
api-server script: service:db:apply updated to scoped guard/apply/verify flow
service:check -- --db support
```

### Phase 8H - Service audit + permission policy hardening

Status: planned.

Expected output:

```txt
service-business.audit constants
service-business.policy matrix
service policy assertion script
service:check includes service policy check
```

## Recommended execution order

Because Service Business already has backend delegate work through Phase 7F, do not restart from Phase 1.

Recommended next sequence:

```txt
1. Phase 4  - Seed service request/job/quote/invoice demo data
2. Phase 8F - Service smoke test + scoped CI gate
3. Phase 8G - Service migration baseline/idempotency hardening
4. Phase 6  - Service OpenAPI/client coverage
5. Phase 8E - Generated API client consolidation
6. Phase 8H - Audit + permission policy hardening
7. Phase 8A - Service status API route family
8. Phase 8B - Service status frontend action
9. Phase 7D - Quote/invoice/payment preview delegate
10. Phase 8C - Quote/invoice cancellation reversal workflow
11. Phase 8D - Payment reversal workflow
```

Why this order:

```txt
seed first gives stable demo data
scoped check prevents Service work from being blocked by unrelated global errors
DB hardening makes local setup repeatable
OpenAPI/client work is easier once endpoints and smoke coverage are stable
policy hardening should happen before more mutation/reversal routes
reversal workflows should wait until schema and audit boundaries are confirmed
```

## Next phase

```txt
Service Phase 4 - Seed service request/job/quote/invoice demo data
```

Keep it idempotent, small, and demo-focused. Do not unlock unrelated business modes in this phase.
