# Retail Mode Scoped Implementation Guide

This document is the working source of truth for Retail Mode only.

Retail Mode is being built while the rest of the backend still has legacy Restaurant/F&B, raw-material, inventory, audit-log, and migration-history issues. Those issues are real, but they are outside this track unless they directly block Retail Mode.

## Scope Rule

Retail work must stay inside the Retail boundary first.

```txt
IN SCOPE
- artifacts/api-server/src/routes/retail.ts
- artifacts/api-server/src/services/retail/**
- artifacts/api-server/prisma/migrations/202606140001_add_retail_core/migration.sql
- artifacts/pos-system/src/features/retail/**
- artifacts/pos-system/src/features/shared/retail-bridge/**
- Retail-specific OpenAPI paths and schemas
- Retail-specific seed/demo workflow
```

```txt
OUT OF SCOPE FOR THIS TRACK
- raw-material backend cleanup
- legacy misc settings cleanup
- Restaurant/F&B order workflow cleanup
- Restaurant/F&B inventory workflow cleanup
- global audit-log migration cleanup
- full Prisma migration-history repair
- full workforce/payroll/contract modules
```

Do not fix non-retail typecheck failures inside this track unless they block `typecheck:retail` or the Retail build path directly. The goal is Retail progress, not heroic yak-shaving with a keyboard.

## Current Retail Backend Status

Retail backend is already mounted under:

```txt
/api/retail/*
```

The current active route file is:

```txt
artifacts/api-server/src/routes/retail.ts
```

The current active service folder is:

```txt
artifacts/api-server/src/services/retail/
```

Retail service is business-scoped. Route handlers must resolve:

```txt
1. authenticated user
2. business context
3. Retail business mode
4. request input
5. service call
6. response
```

Route files must stay thin. Business logic belongs in `services/retail/`, not in route handlers.

## Retail Backend Endpoints

Public/simple health endpoint:

```txt
GET /api/retail/health
```

Business-scoped endpoints:

```txt
GET  /api/retail/dashboard
GET  /api/retail/products
GET  /api/retail/products/:id
GET  /api/retail/barcode/:code
GET  /api/retail/inventory/risks
GET  /api/retail/receiving
GET  /api/retail/command-center
GET  /api/retail/shared-dashboard/:dashboardId
POST /api/retail/sales/preview
POST /api/retail/sales/mock-checkout
POST /api/retail/sales/checkout
POST /api/retail/returns/preview
```

These endpoints must not share data across businesses. Every repository call that reads or mutates Retail data must be scoped by `businessId`.

## Retail Database Layer

Retail table creation currently lives in:

```txt
artifacts/api-server/prisma/migrations/202606140001_add_retail_core/migration.sql
```

Current Retail core tables:

```txt
RetailSupplier
RetailProduct
RetailReceiving
RetailReceivingItem
RetailSale
RetailSaleItem
RetailPayment
RetailStockMovement
```

The current repository implementation uses Prisma raw queries and transactions through:

```txt
artifacts/api-server/src/services/retail/retail.prisma-repository.ts
```

The provider seam is:

```txt
artifacts/api-server/src/services/retail/retail.repository-provider.ts
```

Keep this seam. It allows the project to move from mock repository to raw Prisma repository, and later from raw Prisma repository to typed Prisma delegate calls.

## Why Not Full `prisma migrate dev` Yet

Do not use full migration commands for this Retail track yet:

```bash
pnpm --filter @workspace/api-server exec prisma migrate dev
pnpm --filter @workspace/api-server exec prisma migrate deploy
```

Reason: full Prisma migration replays older migration history. The current project has legacy migrations that may fail before Retail tables are even tested.

For Retail-only progress, apply the Retail SQL directly:

```bash
pnpm --filter @workspace/api-server run retail:db:apply
```

## Retail Validation Commands

From the repo root:

```bash
pnpm --filter @workspace/api-server run generate
pnpm --filter @workspace/api-server run typecheck:retail
pnpm --filter @workspace/api-server run build
```

For frontend after Retail bridge changes:

```bash
pnpm --filter @workspace/pos-system typecheck
pnpm --filter @workspace/pos-system build
```

If full backend typecheck fails in non-retail files, do not treat that as a Retail failure. Use `typecheck:retail` for this track.

## Retail Smoke Test

After auth, Retail business context, and Retail tables exist:

```txt
GET  /api/retail/health
GET  /api/retail/products
GET  /api/retail/dashboard
GET  /api/retail/shared-dashboard/inventory
POST /api/retail/sales/preview
POST /api/retail/sales/checkout
```

If `GET /api/retail/products` returns an empty array, the Retail tables exist but no RetailProduct rows have been seeded yet.

## Seed Plan

Retail seed should be small and idempotent.

Seed scope:

```txt
RetailSupplier
RetailProduct
```

Do not seed every possible Retail module yet. First target is enough data for:

```txt
GET /api/retail/products
GET /api/retail/dashboard
GET /api/retail/inventory/risks
POST /api/retail/sales/preview
POST /api/retail/sales/checkout
```

Seed rules:

```txt
- resolve an existing Business where mode = RETAIL
- do not create random duplicate business records
- upsert suppliers by businessId + name or slug
- upsert products by businessId + sku/barcode
- keep stock values realistic enough to test low-stock and out-of-stock flows
```

Preferred command name:

```bash
pnpm --filter @workspace/api-server run retail:seed
```

## Frontend Wiring Plan

Retail frontend should not switch from mock to API in one destructive rewrite. Use fallback mode.

### Catalog

Primary API:

```txt
GET /api/retail/products
```

Frontend behavior:

```txt
1. Try API with credentials included.
2. If API succeeds, render API data.
3. If API fails because backend is offline, unauthorized, or empty during dev, fallback to local mock data.
4. Show a small source badge: Prisma API / Loading API / Mock fallback.
```

### Cashier Checkout

Primary API:

```txt
POST /api/retail/sales/checkout
```

Request shape:

```json
{
  "paymentMethod": "cash",
  "lines": [
    {
      "productId": "prod-id",
      "quantity": 1,
      "discountPercent": 0
    }
  ]
}
```

Frontend behavior:

```txt
1. Preview sale locally or through POST /api/retail/sales/preview.
2. On checkout, call POST /api/retail/sales/checkout.
3. If persisted checkout succeeds, show receipt number and updated totals.
4. If checkout is blocked, show blockedReasons.
5. If API is unavailable during dev, fallback to mock checkout, but label it clearly.
```

## Shared Dashboard Wiring Plan

Shared Retail dashboard bridge should prefer backend data.

Primary API:

```txt
GET /api/retail/shared-dashboard/:dashboardId
```

Relevant Retail dashboard IDs:

```txt
overview
sales
customers
inventory
cashflow
financial-reports
invoice-generator
shift-reports
team-management
employee-performance
approvals
audit-controls
roster-overview
employee-attendance
employee-contracts
payroll
```

Retail behavior:

```txt
- render relevant Retail dashboard context
- replace generic dashboards that do not fit Retail
- skip payroll/contracts/attendance-heavy pages unless Retail-specific workforce logic exists
- fallback to local Retail mock context if API is unavailable
```

## OpenAPI Plan

Retail endpoints should be added to:

```txt
lib/api-spec/openapi.yaml
```

Minimum generated client coverage:

```txt
getRetailProducts
getRetailDashboard
getRetailSharedDashboard
previewRetailSale
checkoutRetailSale
lookupRetailBarcode
getRetailInventoryRisks
getRetailReceivingQueue
```

After OpenAPI update, generated files should expose hooks/functions from:

```txt
@workspace/api-client-react
```

Do not manually wire every screen to raw fetch forever. Raw fetch is acceptable as a temporary bridge, not a personality trait.

## Prisma Schema Sync Plan

Current Retail persistence is backed by SQL tables and Prisma raw queries.

Next schema sync target:

```txt
artifacts/api-server/prisma/schema.prisma
```

Models to add or sync:

```txt
RetailSupplier
RetailProduct
RetailReceiving
RetailReceivingItem
RetailSale
RetailSaleItem
RetailPayment
RetailStockMovement
```

Also add relations from `Business` to Retail models after confirming the migration table names and relation names are stable.

After schema sync, replace raw repository calls with typed Prisma delegates gradually:

```txt
prisma.retailProduct.findMany
prisma.retailSale.create
prisma.retailPayment.create
prisma.retailStockMovement.create
```

Do not convert everything at once if `typecheck:retail` becomes noisy. Convert repository methods one by one.

## Real Checkout Rules

Real checkout must remain one transaction.

A successful Retail checkout should create/update:

```txt
1. RetailSale
2. RetailSaleItem
3. RetailPayment
4. RetailProduct stock decrement
5. RetailStockMovement
6. CashflowEntry
7. AuditLog
```

Never update product stock directly from a route handler. Stock mutations belong in the Retail repository/service workflow.

## Done Definition For Retail Backend Phase

Retail backend phase is considered stable when:

```txt
- retail:db:apply succeeds on local/dev database
- retail:seed creates visible Retail products
- GET /api/retail/products returns seeded rows
- POST /api/retail/sales/preview returns totals and blockedReasons
- POST /api/retail/sales/checkout persists sale/payment/stock movement
- GET /api/retail/shared-dashboard/inventory returns API dashboard context
- typecheck:retail passes
- api-server build passes
```

## Next Commit Order

Keep commits small and Retail-only:

```txt
1. Retail seed workflow
2. Retail catalog API wiring with mock fallback
3. Retail cashier checkout API wiring with mock fallback
4. Retail OpenAPI path/schema coverage
5. Retail schema.prisma model sync
6. Raw repository to typed Prisma delegate migration
```
