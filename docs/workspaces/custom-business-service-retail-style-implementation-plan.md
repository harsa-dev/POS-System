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
service demo tenant helper
service demo seed data
service OpenAPI/client coverage
service quote/invoice/payment preview delegate
service smoke test + scoped CI gate
service migration baseline/idempotency hardening
```

Reference docs:

```txt
docs/workspaces/custom-business-service-backend-phases.md
docs/workspaces/custom-business-service-prisma-delegate-cleanup.md
docs/workspaces/custom-business-service-seed-demo-data.md
docs/workspaces/custom-business-service-openapi-client-coverage.md
docs/workspaces/custom-business-service-preview-delegate.md
docs/workspaces/custom-business-service-smoke-test-scoped-ci.md
docs/workspaces/custom-business-service-migration-baseline-idempotency.md
```

Current known gap compared with Retail and Raw Material:

```txt
no full Service generated-client consolidation lane yet
no explicit Service audit + permission policy assertion lane yet
no explicit Service status API route family yet
no Service quote/invoice/payment reversal workflow yet
```

## Retail-style Service Business phases

```txt
Phase 1  - Service persistence foundation                         Done
Phase 2  - Backend route, guard, workflow preview                 Done
Phase 3  - Shared dashboard backend summary                       Done
Phase 4  - Seed service request/job/quote/invoice demo data       Done
Phase 5  - Frontend service workflow API wiring                   Partial
Phase 6  - Service OpenAPI/client coverage                        Done
Phase 7A - Prisma schema model mapping                            Done
Phase 7B - Summary read delegate                                  Done
Phase 7C - Workflow read delegate                                 Done
Phase 7D - Service quote/invoice preview delegate                 Done
Phase 7E - Service write delegate                                 Done
Phase 7F - Guarded workflow status delegate                       Done
Phase 8A - Service status API route family                        Next
Phase 8B - Service status frontend action                         Planned
Phase 8C - Quote/invoice cancellation reversal workflow           Planned
Phase 8D - Payment reversal workflow                              Planned
Phase 8E - Generated API client consolidation                     Planned
Phase 8F - Service smoke test + scoped CI gate                    Done
Phase 8G - Service migration baseline/idempotency hardening       Done
Phase 8H - Service audit + permission policy hardening            Planned
```

## Implemented phase notes

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

Status: implemented.

Implemented files:

```txt
artifacts/api-server/scripts/ensure-service-business-demo.ts
artifacts/api-server/scripts/seed-service-business-demo-data-idempotent.ts
artifacts/api-server/package.json
docs/workspaces/custom-business-service-seed-demo-data.md
```

Implemented commands:

```bash
pnpm --filter @workspace/api-server run service:ensure-business
pnpm --filter @workspace/api-server run service:seed
```

Seed coverage:

```txt
3 service requests
3 service jobs across several workflow statuses
6 cost lines
3 quotations
2 invoices
6 checklist items
5 timeline items
```

The seed is idempotent through deterministic IDs scoped by business and Prisma upsert. The current seed command uses sequential upserts instead of one large Prisma transaction to avoid Neon/pooler transaction start timeouts.

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
clear API-first/fallback status in UI
read delegate coverage for workflow lists if still mixed with mock data
```

### Phase 6 - Service OpenAPI/client coverage

Status: implemented.

Implemented files:

```txt
lib/api-spec/service-business.openapi.yaml
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-api-operations.ts
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-api.ts
docs/workspaces/custom-business-service-openapi-client-coverage.md
```

Implemented operation IDs:

```txt
serviceBusinessGetWorkspace
serviceBusinessGetSummary
serviceBusinessListJobs
serviceBusinessGetWorkflowStatuses
serviceBusinessGetTransitionPreview
serviceBusinessPreviewQuotation
serviceBusinessPreviewInvoice
serviceBusinessPreviewInvoicePayment
serviceBusinessCreateRequest
serviceBusinessUpdateJobStatus
serviceBusinessAddCostLine
serviceBusinessCreateQuotation
serviceBusinessApproveQuotation
serviceBusinessCreateInvoice
serviceBusinessRecordInvoicePayment
```

The handwritten frontend client now routes through the Service operation registry. Full generated-client consolidation remains a later Phase 8E task.

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

Status: implemented.

Implemented endpoints:

```txt
POST /api/custom-business/service/previews/quotation
POST /api/custom-business/service/previews/invoice
POST /api/custom-business/service/previews/invoice-payment
```

Implemented files:

```txt
artifacts/api-server/src/features/service-business/service-business-preview.service.ts
artifacts/api-server/src/routes/service-business-preview.ts
artifacts/api-server/src/routes/index.ts
artifacts/api-server/tsconfig.service.json
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-api-operations.ts
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-api-contract-types.ts
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-api.ts
lib/api-spec/service-business.openapi.yaml
docs/workspaces/custom-business-service-preview-delegate.md
```

Preview behavior:

```txt
quotation preview calculates cost, margin, discount, tax, and projected total
invoice preview calculates invoice total and warns about quote state/existing invoices
invoice payment preview calculates remaining balance, applied amount, overflow, next invoice status, and next workflow status
```

No mutation happens in this phase.

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

## Next recommended phase

```txt
Service Phase 8A - Service status API route family
```
