# Custom Business Service Retail-Style Implementation Plan

This document maps Business Mode Service / Custom Business Service into the same implementation format used by Retail and Raw Material.

The goal is parity across business modes without pretending every mode needs the exact same domain actions. Service Business has service requests, jobs, cost lines, quotes, invoices, payments, and workflow transitions instead of stock movements or product returns.

## Current validation baseline

Service Business backend implementation is mature through the delegate cleanup, status-route lanes, seeded demo data, scoped validation, idempotent DB setup, OpenAPI/client coverage, preview delegates, quote/invoice cancellation reversal, payment reversal workflow, and generated-client-style frontend consolidation.

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
explicit service status API route family
service status frontend action migration
service demo tenant helper
service demo seed data
service OpenAPI/client coverage
service generated-client-style frontend consolidation
service quote/invoice/payment preview delegate
service quote/invoice cancellation reversal workflow
service invoice payment reversal workflow
service smoke test + scoped CI gate
service migration baseline/idempotency hardening
```

Reference docs:

```txt
docs/workspaces/custom-business-service-backend-phases.md
docs/workspaces/custom-business-service-prisma-delegate-cleanup.md
docs/workspaces/custom-business-service-seed-demo-data.md
docs/workspaces/custom-business-service-openapi-client-coverage.md
docs/workspaces/custom-business-service-generated-client-consolidation.md
docs/workspaces/custom-business-service-preview-delegate.md
docs/workspaces/custom-business-service-status-api-route.md
docs/workspaces/custom-business-service-status-frontend-action.md
docs/workspaces/custom-business-service-quote-invoice-cancellation-reversal.md
docs/workspaces/custom-business-service-payment-reversal.md
docs/workspaces/custom-business-service-smoke-test-scoped-ci.md
docs/workspaces/custom-business-service-migration-baseline-idempotency.md
```

Current known gap compared with Retail and Raw Material:

```txt
no explicit Service audit + permission policy assertion lane yet
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
Phase 8A - Service status API route family                        Done
Phase 8B - Service status frontend action                         Done
Phase 8C - Quote/invoice cancellation reversal workflow           Done
Phase 8D - Payment reversal workflow                              Done
Phase 8E - Generated API client consolidation                     Done
Phase 8F - Service smoke test + scoped CI gate                    Done
Phase 8G - Service migration baseline/idempotency hardening       Done
Phase 8H - Service audit + permission policy hardening            Next
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
frontend status route migration
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
serviceBusinessSetJobStatus
serviceBusinessSetRequestStatus
serviceBusinessAddCostLine
serviceBusinessCreateQuotation
serviceBusinessApproveQuotation
serviceBusinessCancelQuotation
serviceBusinessCreateInvoice
serviceBusinessRecordInvoicePayment
serviceBusinessCancelInvoice
serviceBusinessReverseInvoicePayment
```

The frontend client now has both operation registry coverage and a generated-client-style facade. Full automatic OpenAPI code generation is still not implemented.

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

### Phase 8A - Service status API route family

Status: implemented.

Implemented endpoints:

```txt
POST /api/custom-business/service/status/jobs/:id
POST /api/custom-business/service/status/requests/:id
```

Behavior:

```txt
uses service-business.job.status.update permission
reuses workflow target lookup
reuses readiness and transition preview guard
rejects invalid/disallowed/unmet status transitions
writes ServiceWorkflowStatus audit entry on success
keeps PATCH /custom-business/service/jobs/:id/guarded-status as compatibility route
```

### Phase 8B - Service status frontend action

Status: implemented.

Frontend behavior:

```txt
serviceBusinessApi.updateJobStatus now calls POST /api/custom-business/service/status/jobs/:id
serviceBusinessApi.updateRequestStatus calls POST /api/custom-business/service/status/requests/:id
existing UpdateServiceJobStatusInput still accepts nextStatus and the client translates it into status
legacy PATCH /api/custom-business/service/jobs/:id/guarded-status remains available as compatibility surface
```

### Phase 8C - Quote/invoice cancellation reversal workflow

Status: implemented.

Implemented endpoints:

```txt
POST /api/custom-business/service/reversals/quotations/:id/cancel
POST /api/custom-business/service/reversals/invoices/:id/cancel
```

Behavior:

```txt
quotation cancellation rejects terminal quotes and quotes with active invoices
quotation cancellation sets quote status to rejected and workflow back to JOB_PLANNING
invoice cancellation rejects paid/partial invoices
invoice cancellation sets invoice status to cancelled and workflow back to DELIVERED
audit logs capture reversal type, previous status, next status, workflow rollback, entity code, and note
payment reversal remains Phase 8D
```

### Phase 8D - Payment reversal workflow

Status: implemented.

Implemented endpoint:

```txt
POST /api/custom-business/service/reversals/invoices/:id/reverse-payment
```

Implemented files:

```txt
artifacts/api-server/src/features/service-business/service-business-reversal.service.ts
artifacts/api-server/src/routes/service-business-reversal.ts
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-api-operations.ts
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-api-contract-types.ts
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-api.ts
lib/api-spec/service-business.openapi.yaml
docs/workspaces/custom-business-service-payment-reversal.md
```

Behavior:

```txt
reject cancelled invoices
reject invoices with no paid amount
allow full payment reversal by omitting amount
allow partial reversal when amount is greater than zero and not above current paidAmount
updates invoice paidAmount
rolls invoice status back to issued, partial, or paid based on remaining paid amount
rolls workflow back to INVOICED unless the invoice remains fully paid
writes timeline item and ServiceInvoice audit entry
```

This phase does not create gateway refunds or cashflow refund entries.

### Phase 8E - Generated API client consolidation

Status: implemented.

Implemented files:

```txt
artifacts/pos-system/src/app/workspace/custom-business/service/service-business.generated-api-client.ts
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-api.ts
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-api-operations.ts
docs/workspaces/custom-business-service-generated-client-consolidation.md
```

Behavior:

```txt
centralizes Service API request dispatch behind operationId
reuses Service operation registry as route source
handles GET, POST, and PATCH dispatch
handles path params and query params
unwraps ApiEnvelope data consistently
keeps serviceBusinessApi as the domain-facing client
```

This phase does not introduce automatic OpenAPI TypeScript generation.

### Phase 8F - Service smoke test + scoped CI gate

Status: implemented.

Implemented commands:

```bash
pnpm service:check
pnpm service:smoke
```

### Phase 8G - Service migration baseline/idempotency hardening

Status: implemented.

Implemented by the scoped DB apply hotfix:

```txt
artifacts/api-server/scripts/apply-service-business-db.mjs
artifacts/api-server/prisma/sql/service-business-baseline-guard.sql
artifacts/api-server/prisma/migrations/202606140007_add_service_business_core_idempotent/migration.sql
artifacts/api-server/prisma/sql/service-business-schema-verify.sql
```

## Next recommended phase

```txt
Service Phase 8H - Service audit + permission policy hardening
```
