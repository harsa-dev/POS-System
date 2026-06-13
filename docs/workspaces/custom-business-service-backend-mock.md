# Custom Business Service Backend

## Purpose

This document describes the backend layer for Service / Custom Business mode.

The first backend phase created a temporary dry-run route. The current phase adds database persistence through Prisma SQL execution and a dedicated service-business migration.

## Scope

Implemented on `main`:

```txt
artifacts/api-server/src/routes/service-business.ts
artifacts/api-server/src/routes/index.ts
artifacts/api-server/prisma/migrations/202606140002_add_service_business_core/migration.sql
artifacts/api-server/package.json
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-api.ts
```

## Constraints

This phase still does not touch:

```txt
restaurant workflow logic
retail workflow logic
raw-material workflow logic
custom-business mode activation rules
shared restaurant order/payment tables
```

## Database setup

Apply the service-business storage migration from the API server package:

```bash
pnpm --filter @workspace/api-server run service:db:apply
```

The script runs:

```bash
prisma db execute --file prisma/migrations/202606140002_add_service_business_core/migration.sql
```

## Database tables

The service migration creates:

```txt
service_requests
service_jobs
service_cost_lines
service_quotations
service_invoices
service_checklist_items
service_timeline_items
```

It also creates service-specific PostgreSQL enum types for:

```txt
workflow status
priority
cost category
quotation status
invoice status
```

## Route registration

The service router is registered under the existing Express `/api` router.

Base path:

```txt
/api/custom-business/service
```

## Endpoints

```txt
GET    /api/custom-business/service/workspace
GET    /api/custom-business/service/jobs
POST   /api/custom-business/service/requests
PATCH  /api/custom-business/service/jobs/:id/status
POST   /api/custom-business/service/jobs/:id/cost-lines
POST   /api/custom-business/service/quotations
PATCH  /api/custom-business/service/quotations/:id/approve
POST   /api/custom-business/service/invoices
PATCH  /api/custom-business/service/invoices/:id/payment
```

## Behavior

Read endpoints now load service jobs from the database through Prisma raw SQL.

Mutation endpoints now persist service workflow records and return the updated job envelope.

The response still keeps the frontend-friendly shape:

```txt
success: true
message
job
preview
```

The `dryRun` field is now `false` when the route writes to database-backed service tables.

## Tenant scope

Every read and write is scoped through the authenticated user's business context.

The service tables use `business_id` on the parent service request and cascade through request-linked child records.

## Frontend client

The frontend client calls these Express endpoints through the shared API client:

```txt
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-api.ts
```

The UI may still choose to stay read-only until the mode activation phase.

## Prisma note

This phase uses Prisma's SQL execution APIs and a checked-in SQL migration instead of generated Prisma model delegates.

Reason: the current repo already uses explicit SQL migration apply scripts for scoped backend modules, and this avoids a risky full `schema.prisma` rewrite while the service tables stabilize.

A later cleanup can fold these tables into `schema.prisma` once the API shape is verified.

## Next backend phase

1. Run the service DB migration locally.
2. Run API server typecheck/build.
3. Seed service sample data if needed.
4. Add stricter backend status transition validation.
5. Add audit log writes for service mutations.
6. Add optional cashflow sync from paid service invoices.
7. Decide whether service invoices should stay separate or link into the shared `Invoice` table.
8. Fold stable service tables into `schema.prisma` if generated model delegates are desired.

Do not unlock the service mode selector until the database-backed workflow is tested.
