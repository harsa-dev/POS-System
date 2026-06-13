# Retail Backend Handoff

Retail backend persistence is now prepared with a Prisma-backed repository.

## Current Status

- Backend package already exists in `artifacts/api-server`.
- Retail routes are mounted under `/api/retail/*`.
- Retail routes are authenticated and scoped to businesses with `businessMode === "retail"`.
- Retail service uses a repository contract.
- Runtime repository is now Prisma-backed through `retail.repository-provider.ts`.
- Retail database tables are created by a manual SQL migration.
- The implementation uses Prisma raw queries, not generated Prisma model delegates, because the active schema file is large and should be synchronized carefully in a later schema cleanup pass.

## Added / Updated Files

```txt
artifacts/api-server/prisma/migrations/202606140001_add_retail_core/migration.sql
artifacts/api-server/src/routes/retail.ts
artifacts/api-server/src/services/retail/retail.types.ts
artifacts/api-server/src/services/retail/retail.repository.ts
artifacts/api-server/src/services/retail/retail.repository-provider.ts
artifacts/api-server/src/services/retail/retail.mock-repository.ts
artifacts/api-server/src/services/retail/retail.prisma-repository.ts
artifacts/api-server/src/services/retail/retail.service.ts
```

## Active Endpoints

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

## Auth / Business Scope

All retail endpoints except `/api/retail/health` require a logged-in user.

The route resolves the current business context and rejects non-retail business modes.

```txt
expectedMode: retail
```

Reads allow all roles. Checkout/preview operations use operations roles.

## Checkout Contract

`POST /api/retail/sales/preview`

```json
{
  "paymentMethod": "cash",
  "lines": [
    {
      "productId": "prod-001",
      "quantity": 2,
      "discountPercent": 0
    }
  ]
}
```

The response returns totals, included tax, gross profit, blocked reasons, and line-level stock checks.

`POST /api/retail/sales/checkout` uses the same body and persists the transaction.

## Real Checkout Transaction

Real checkout now writes inside one Prisma transaction:

```txt
1. RetailSale
2. RetailSaleItem
3. RetailPayment
4. RetailProduct stock update
5. RetailStockMovement
6. CashflowEntry
7. AuditLog
```

Stock deduction is not performed in the route handler. It is handled by the Prisma repository transaction.

## Migration

Manual SQL migration file:

```txt
artifacts/api-server/prisma/migrations/202606140001_add_retail_core/migration.sql
```

Tables created:

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

Run migration locally before testing Prisma-backed retail endpoints.

## Known Follow-ups

```txt
Sync these retail tables into schema.prisma as generated Prisma model delegates.
Add seed/demo endpoint or seed script for retail business data.
Add product CRUD endpoints.
Add receiving mutation workflow.
Add real return/refund mutation workflow.
Add frontend API client generation.
```
