# Custom Business Service Prisma Delegate Cleanup

Status: Phase 7A implemented  
Scope: Business Mode Service / Custom Business Service  
Branch: main

## Goal

Move the Service Business backend from raw SQL-only access toward generated Prisma model delegates without creating another database migration.

The database tables already exist from:

```txt
artifacts/api-server/prisma/migrations/202606140002_add_service_business_core/migration.sql
```

Phase 7 should map those existing tables into Prisma schema models so later backend cleanup can use generated delegates instead of `$queryRaw` / `$executeRaw` everywhere.

## What was added in Phase 7A

A schema fragment was added at:

```txt
artifacts/api-server/prisma/schema-service-business.fragment.prisma
```

This fragment contains Prisma model mappings for existing Service Business tables:

```txt
ServiceRequest        -> service_requests
ServiceJob            -> service_jobs
ServiceCostLine       -> service_cost_lines
ServiceQuotation      -> service_quotations
ServiceInvoice        -> service_invoices
ServiceChecklistItem  -> service_checklist_items
ServiceTimelineItem   -> service_timeline_items
```

It also maps existing Postgres enums:

```txt
ServiceBusinessWorkflowStatus -> service_business_workflow_status
ServiceBusinessPriority       -> service_business_priority
ServiceBusinessCostCategory   -> service_business_cost_category
ServiceBusinessQuoteStatus    -> service_business_quote_status
ServiceBusinessInvoiceStatus  -> service_business_invoice_status
```

## Why the active schema was not directly rewritten

The active schema file is large:

```txt
artifacts/api-server/prisma/schema.prisma
```

The GitHub connector can edit files, but cannot run:

```bash
prisma validate
prisma generate
pnpm --filter @workspace/api-server run typecheck
```

Because this phase changes generated Prisma delegate surfaces, the active schema should only be appended when the developer or Codex can immediately validate and generate locally.

The fragment is intentionally placed beside the active schema as a safe handoff artifact, not as a loaded schema file.

## Required manual/Codex application steps

1. Open:

```txt
artifacts/api-server/prisma/schema.prisma
```

2. Inside `model Business`, add these relation fields:

```prisma
serviceRequests      ServiceRequest[]
serviceTimelineItems ServiceTimelineItem[]
```

3. Append the models and enums from:

```txt
artifacts/api-server/prisma/schema-service-business.fragment.prisma
```

4. Run validation:

```bash
pnpm --filter @workspace/api-server run generate
```

5. Run typecheck/build:

```bash
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/api-server run build
```

6. Only after those commands pass, begin Phase 7B: replace selected raw SQL reads/writes with generated Prisma delegates.

## Phase 7B target

After schema delegates generate successfully, refactor these files incrementally:

```txt
artifacts/api-server/src/features/service-business/service-business.crud.repository.ts
artifacts/api-server/src/features/service-business/service-business.repository.ts
artifacts/api-server/src/features/service-business/service-business.summary.ts
```

Recommended order:

```txt
1. Read queries: loadServiceJobs, findServiceJob, findServiceWorkflowTarget.
2. Simple writes: createServiceCostLineRecord, createServiceQuotationRecord.
3. Multi-step writes: createServiceRequestRecord, createServiceInvoiceRecord, recordServiceInvoicePaymentRecord.
4. Workflow writes: updateServiceWorkflowStatus.
```

Keep transaction boundaries explicit when replacing raw SQL multi-step writes.

## No migration rule

Do not create a new migration just for this phase unless `prisma validate` proves the active schema cannot map the existing SQL migration.

The target is delegate mapping for existing database objects, not schema creation.

## Safety constraints

Do not touch:

```txt
Restaurant workflow
Retail workflow
Raw-material workflow
Business mode selector activation
Existing shared Invoice model
Existing Cashflow model
Existing AuditLog model
```

Do not rename the SQL tables created by the Service Business migration.

## Completion definition

Phase 7 is complete only when:

```txt
schema.prisma includes Service Business models and enums
prisma generate passes
api-server typecheck passes
repository raw SQL usage is reduced or isolated behind delegates
existing endpoint contracts still pass
```
