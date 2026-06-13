# Custom Business Service Prisma Delegate Cleanup

Status: Phase 7E implemented  
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

It now includes these Service Business models:

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

Updated files:

```txt
artifacts/api-server/src/features/service-business/service-business.summary.ts
artifacts/api-server/src/features/service-business/service-business.repository.ts
```

The summary response source identifies this path as:

```txt
api-server-prisma-delegate-summary
```

The guarded status write transaction still uses explicit SQL for now.

## Phase 7D and 7E implemented

A delegate-backed write helper exists at:

```txt
artifacts/api-server/src/features/service-business/service-business.delegate-writes.repository.ts
```

The write paths moved to generated Prisma delegates are now:

```txt
createServiceRequestRecordWithDelegate(...)
createServiceCostLineRecordWithDelegate(...)
createServiceQuotationRecordWithDelegate(...)
approveServiceQuotationRecordWithDelegate(...)
createServiceInvoiceRecordWithDelegate(...)
recordServiceInvoicePaymentRecordWithDelegate(...)
```

The public CRUD repository still keeps stable exported names:

```txt
createServiceRequestRecord(...)
createServiceCostLineRecord(...)
createServiceQuotationRecord(...)
approveServiceQuotationRecord(...)
createServiceInvoiceRecord(...)
recordServiceInvoicePaymentRecord(...)
```

Those functions now delegate to Prisma write helpers instead of writing raw SQL directly.

The CRUD repository is now a thin storage facade at:

```txt
artifacts/api-server/src/features/service-business/service-business.crud.repository.ts
```

It owns target lookup and stable exports, while actual Prisma write implementation lives in the delegate write helper.

## Current raw SQL boundary

The remaining raw SQL boundary is intentionally limited to the guarded workflow status transition transaction:

```txt
artifacts/api-server/src/features/service-business/service-business.repository.ts::updateServiceWorkflowStatus
```

Recommended next order:

```txt
1. Run generate/build/typecheck after Phase 7E.
2. If service-business stays clean, move updateServiceWorkflowStatus to Prisma delegate transaction.
3. Remove raw SQL import needs from service-business.repository.ts after the workflow write is migrated.
```

Keep transaction boundaries explicit when replacing raw SQL multi-step writes.

## Validation result from local run

Latest local report before Phase 7E:

```txt
pnpm --filter @workspace/api-server run generate -> passed
pnpm --filter @workspace/api-server run build    -> passed
pnpm --filter @workspace/api-server run typecheck -> failed outside service-business files
```

The typecheck errors reported were in misc, raw-material, inventory, order stock movement, financial reports, and sales analytics files. No service-business file was reported in that run.

## Validation commands

Run from the repository root:

```bash
pnpm --filter @workspace/api-server run generate
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/api-server run build
```

If `generate` fails with a relation error around `Business.serviceTimelineItems`, remove that field from `model Business`. The timeline relation does not have a direct `business_id` column.

## No migration rule

Do not create a new migration just for this cleanup phase unless Prisma validation proves the active schema cannot map the existing SQL migration.
