# Custom Business Service Prisma Delegate Cleanup

Status: Phase 7F implemented  
Scope: Business Mode Service / Custom Business Service  
Branch: main

## Goal

Move the Service Business backend from raw SQL-only access toward generated Prisma model delegates without creating another database migration.

The database tables already exist from:

```txt
artifacts/api-server/prisma/migrations/202606140002_add_service_business_core/migration.sql
```

The active schema now includes Service Business models and enums, so the cleanup can proceed incrementally from read paths to write paths.

## Active schema state

The active schema file is:

```txt
artifacts/api-server/prisma/schema.prisma
```

It includes these Service Business models:

```txt
ServiceRequest
ServiceJob
ServiceCostLine
ServiceQuotation
ServiceInvoice
ServiceChecklistItem
ServiceTimelineItem
```

Mapped SQL tables:

```txt
ServiceRequest        -> service_requests
ServiceJob            -> service_jobs
ServiceCostLine       -> service_cost_lines
ServiceQuotation      -> service_quotations
ServiceInvoice        -> service_invoices
ServiceChecklistItem  -> service_checklist_items
ServiceTimelineItem   -> service_timeline_items
```

Mapped SQL enums:

```txt
ServiceBusinessWorkflowStatus -> service_business_workflow_status
ServiceBusinessPriority       -> service_business_priority
ServiceBusinessCostCategory   -> service_business_cost_category
ServiceBusinessQuoteStatus    -> service_business_quote_status
ServiceBusinessInvoiceStatus  -> service_business_invoice_status
```

## Important relation note

`Business` should only expose the direct relation that exists in the SQL schema:

```prisma
serviceRequests ServiceRequest[]
```

Do not add this relation unless a new migration adds `business_id` to `service_timeline_items`:

```prisma
serviceTimelineItems ServiceTimelineItem[]
```

`ServiceTimelineItem` belongs to `ServiceRequest` through `requestId`, so the safe relation path is:

```txt
Business -> ServiceRequest[] -> ServiceTimelineItem[]
```

This avoids Prisma validation error P1012 for a missing opposite relation field.

## Phase 7B and 7C implemented

A delegate-backed read repository exists at:

```txt
artifacts/api-server/src/features/service-business/service-business.delegate.repository.ts
```

It uses generated Prisma delegates for:

```txt
summary read path
workflow target lookup
workflow readiness checks
```

Main delegate calls include:

```txt
prisma.serviceRequest.findMany(...)
prisma.serviceRequest.findFirst(...)
prisma.serviceCostLine.count(...)
prisma.serviceQuotation.count(...)
prisma.serviceInvoice.count(...)
prisma.serviceChecklistItem.count(...)
```

The summary service calls:

```txt
loadServiceBusinessSummaryJobs(businessId)
```

from the delegate repository instead of using the raw SQL `loadServiceJobs` path.

The summary response source identifies this path as:

```txt
api-server-prisma-delegate-summary
```

## Phase 7D and 7E implemented

A delegate-backed write helper exists at:

```txt
artifacts/api-server/src/features/service-business/service-business.delegate-writes.repository.ts
```

The CRUD and billing write paths moved to generated Prisma delegates are:

```txt
createServiceRequestRecordWithDelegate(...)
createServiceCostLineRecordWithDelegate(...)
createServiceQuotationRecordWithDelegate(...)
approveServiceQuotationRecordWithDelegate(...)
createServiceInvoiceRecordWithDelegate(...)
recordServiceInvoicePaymentRecordWithDelegate(...)
```

The public CRUD repository keeps stable exported names:

```txt
createServiceRequestRecord(...)
createServiceCostLineRecord(...)
createServiceQuotationRecord(...)
approveServiceQuotationRecord(...)
createServiceInvoiceRecord(...)
recordServiceInvoicePaymentRecord(...)
```

Those functions delegate to Prisma write helpers instead of writing raw SQL directly.

The CRUD repository is now a thin storage facade at:

```txt
artifacts/api-server/src/features/service-business/service-business.crud.repository.ts
```

It owns target lookup and stable exports, while actual Prisma write implementation lives in the delegate write helper.

## Phase 7F implemented

The guarded workflow status transition write path now uses generated Prisma delegates too.

The remaining transition helper is:

```txt
updateServiceWorkflowStatusWithDelegate(...)
```

It updates these records in a Prisma transaction:

```txt
ServiceRequest.status
ServiceJob.status
ServiceJob.startedAt
ServiceJob.completedAt
ServiceTimelineItem
```

The public workflow repository now delegates both reads and writes:

```txt
artifacts/api-server/src/features/service-business/service-business.repository.ts
```

Current facade responsibilities:

```txt
findServiceWorkflowTarget(...)        -> delegate read repository
loadServiceWorkflowReadiness(...)     -> delegate read repository
updateServiceWorkflowStatus(...)      -> delegate write repository
```

## Current raw SQL boundary

Service Business core CRUD, billing, summary, and workflow paths no longer have a known raw SQL dependency in the dedicated Service Business repositories.

Keep a local verification pass before declaring the full API server clean, because global typecheck still has unrelated non-service errors.

## Local validation status

Recent local result shared during cleanup:

```txt
pnpm --filter @workspace/api-server run generate -> passed
pnpm --filter @workspace/api-server run build    -> passed
pnpm --filter @workspace/api-server run typecheck -> failed outside service-business files
```

Known non-service typecheck failures were previously in:

```txt
src/routes/misc.ts
src/routes/raw-material-pens.ts
src/routes/raw-material.ts
src/services/financial-reports/report-audit.ts
src/services/inventory/inventory.service.ts
src/services/orders/transition-order-status.service.ts
src/services/sales-analytics/sales-analytics.service.ts
```

## Validation commands

Run from the repository root:

```bash
pnpm --filter @workspace/api-server run generate
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/api-server run typecheck
```

A Service Business cleanup should be considered safe when errors do not come from:

```txt
src/features/service-business
src/routes/service-business.ts
src/routes/service-business-workflow.ts
```

## Safety constraints

Do not add migrations for this cleanup unless a future phase changes the actual database shape.

Do not add `Business.serviceTimelineItems` without a migration that adds `business_id` to `service_timeline_items`.

Do not alter Restaurant, Retail, Raw Material, or mode-selector behavior as part of this cleanup.
