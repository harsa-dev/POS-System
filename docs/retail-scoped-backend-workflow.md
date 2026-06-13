# Retail Mode Scoped Implementation Guide

This document is the working source of truth for Retail Mode only.

Retail Mode is being built while the rest of the backend still has legacy Restaurant/F&B, raw-material, inventory, audit-log, and migration-history issues. Those issues are real, but they are outside this track unless they directly block Retail Mode.

## Retail Phase Tracker

Use this section as the main progress tracker. Keep the wording short so the docs stay useful instead of turning into a government form with better Markdown.

```txt
Phase 1 - Persistence foundation: implemented
Phase 2 - Backend route, guard, and workflow preview: implemented
Phase 3 - Shared dashboard backend summary: implemented
Phase 4 - Seed retail product/supplier per business: implemented
Phase 5 - Frontend catalog and cashier API wiring: planned
Phase 6 - Retail OpenAPI client coverage: planned
Phase 7 - Prisma schema delegate cleanup: planned
```

### Phase 1 - Persistence foundation: implemented

Implemented scope:

```txt
- Retail SQL persistence migration exists
- RetailSupplier table exists in SQL migration
- RetailProduct table exists in SQL migration
- RetailReceiving and RetailReceivingItem tables exist in SQL migration
- RetailSale, RetailSaleItem, RetailPayment, and RetailStockMovement tables exist in SQL migration
- Retail repository provider seam exists
- Retail raw Prisma repository exists
```

Primary files:

```txt
artifacts/api-server/prisma/migrations/202606140001_add_retail_core/migration.sql
artifacts/api-server/src/services/retail/retail.repository.ts
artifacts/api-server/src/services/retail/retail.repository-provider.ts
artifacts/api-server/src/services/retail/retail.prisma-repository.ts
```

Current validation command:

```bash
pnpm --filter @workspace/api-server run retail:db:apply
```

Do not use full `prisma migrate dev` or `prisma migrate deploy` for this Retail track yet. Full migration replay can fail on older non-retail migration history before Retail tables are even tested.

### Phase 2 - Backend route, guard, and workflow preview: implemented

Implemented scope:

```txt
- Retail routes are mounted under /api/retail/*
- Retail route handlers are authenticated except health
- Retail route handlers resolve business context
- Retail route handlers verify Retail business mode
- Retail sale preview exists
- Retail mock checkout exists
- Retail real checkout endpoint exists
- Retail return preview exists
```

Primary files:

```txt
artifacts/api-server/src/routes/retail.ts
artifacts/api-server/src/services/retail/retail.service.ts
artifacts/api-server/src/services/retail/retail.types.ts
```

Implemented endpoints:

```txt
GET  /api/retail/health
GET  /api/retail/dashboard
GET  /api/retail/products
GET  /api/retail/products/:id
GET  /api/retail/barcode/:code
GET  /api/retail/inventory/risks
GET  /api/retail/receiving
GET  /api/retail/command-center
POST /api/retail/sales/preview
POST /api/retail/sales/mock-checkout
POST /api/retail/sales/checkout
POST /api/retail/returns/preview
```

Real checkout rule:

```txt
A successful Retail checkout must remain one transaction:
1. RetailSale
2. RetailSaleItem
3. RetailPayment
4. RetailProduct stock decrement
5. RetailStockMovement
6. CashflowEntry
7. AuditLog
```

Never update Retail stock directly from a route handler. Stock mutations belong in the Retail repository/service workflow.

### Phase 3 - Shared dashboard backend summary: implemented

Implemented scope:

```txt
- Retail shared dashboard endpoint exists
- Retail dashboard IDs are typed in backend DTOs
- Shared dashboard bridge can prefer backend API data
- Shared dashboard bridge can fallback to local mock data during dev
```

Primary endpoint:

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

### Phase 4 - Seed retail product/supplier per business: implemented

Implemented scope:

```txt
- Retail seed script exists
- Retail seed command exists
- Seed resolves active Business rows where mode = RETAIL
- Seed upserts RetailSupplier demo rows per Retail business
- Seed upserts RetailProduct demo rows per Retail business
- Seed keeps in-stock, low-stock, and out-of-stock examples available for testing
- Seed is idempotent and safe to run more than once
```

Primary files:

```txt
artifacts/api-server/scripts/seed-retail-demo-data.ts
artifacts/api-server/package.json
```

Command:

```bash
pnpm --filter @workspace/api-server run retail:seed
```

Seed scope:

```txt
RetailSupplier
RetailProduct
```

Seed rules:

```txt
- resolve existing active Business rows where mode = RETAIL
- do not create random duplicate business records
- upsert suppliers by businessId + name
- upsert products by businessId + sku
- use deterministic scoped IDs so supplier/product references stay stable
- keep stock values realistic enough to test in-stock, low-stock, and out-of-stock flows
```

Expected result:

```txt
GET /api/retail/products returns seeded rows for the active Retail business.
GET /api/retail/barcode/8991001000011 can resolve the demo chips product.
GET /api/retail/shared-dashboard/inventory has inventory context instead of an empty Retail database.
```

### Phase 5 - Frontend catalog and cashier API wiring: planned

Catalog goal:

```txt
Retail catalog should call GET /api/retail/products first, then fallback to local mock data if the backend is unavailable during dev.
```

Cashier goal:

```txt
Retail cashier should call POST /api/retail/sales/checkout for persisted checkout, then fallback to mock checkout only when clearly labeled.
```

Frontend behavior:

```txt
1. Try API with credentials included.
2. If API succeeds, render API data.
3. If API fails because backend is offline, unauthorized, or empty during dev, fallback to local mock data.
4. Show a small source badge: Prisma API / Loading API / Mock fallback.
```

Checkout request shape:

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

### Phase 6 - Retail OpenAPI client coverage: planned

Goal:

```txt
Expose Retail endpoints through lib/api-spec/openapi.yaml and @workspace/api-client-react.
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

Primary files:

```txt
lib/api-spec/openapi.yaml
lib/api-client-react/src/generated/api.ts
lib/api-client-react/src/generated/api.schemas.ts
```

Do not manually wire every screen to raw fetch forever. Raw fetch is acceptable as a temporary bridge, not a personality trait.

### Phase 7 - Prisma schema delegate cleanup: planned

Current state:

```txt
Retail persistence is backed by SQL tables and Prisma raw queries.
```

Goal:

```txt
Sync Retail models into schema.prisma and replace raw repository methods with typed Prisma delegate calls gradually.
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

Target delegates:

```txt
prisma.retailProduct.findMany
prisma.retailSale.create
prisma.retailPayment.create
prisma.retailStockMovement.create
```

Do not convert everything at once if `typecheck:retail` becomes noisy. Convert repository methods one by one. Heroic rewrites are how bugs get family trees.

## Scope Rule

Retail work must stay inside the Retail boundary first.

```txt
IN SCOPE
- artifacts/api-server/src/routes/retail.ts
- artifacts/api-server/src/services/retail/**
- artifacts/api-server/prisma/migrations/202606140001_add_retail_core/migration.sql
- artifacts/api-server/scripts/seed-retail-demo-data.ts
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

## Retail Validation Commands

From the repo root:

```bash
pnpm --filter @workspace/api-server run retail:db:apply
pnpm --filter @workspace/api-server run retail:seed
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
GET  /api/retail/barcode/8991001000011
GET  /api/retail/dashboard
GET  /api/retail/shared-dashboard/inventory
POST /api/retail/sales/preview
POST /api/retail/sales/checkout
```

If `GET /api/retail/products` returns an empty array after `retail:seed`, check that at least one active Business row has `mode = RETAIL`.

## Done Definition For Current Retail Track

Retail track is considered stable when:

```txt
- retail:db:apply succeeds on local/dev database
- retail:seed creates visible Retail products
- GET /api/retail/products returns seeded rows
- POST /api/retail/sales/preview returns totals and blockedReasons
- POST /api/retail/sales/checkout persists sale/payment/stock movement
- GET /api/retail/shared-dashboard/inventory returns API dashboard context
- typecheck:retail passes
- api-server build passes
- retail catalog can render API products with fallback
- retail cashier can create persisted checkout with fallback
```

## Next Commit Order

Keep commits small and Retail-only:

```txt
1. Retail catalog API wiring with mock fallback
2. Retail cashier checkout API wiring with mock fallback
3. Retail OpenAPI path/schema coverage
4. Retail schema.prisma model sync
5. Raw repository to typed Prisma delegate migration
```
