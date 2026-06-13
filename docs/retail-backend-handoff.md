# Retail Backend Handoff

Retail backend foundation is prepared without Prisma persistence.

## Current Status

- Backend package already exists in `artifacts/api-server`.
- Retail routes are mounted under `/api/retail/*`.
- Retail service uses a repository contract.
- Active repository is mock-only through `retail.repository-provider.ts`.
- No Prisma schema, migration, model, or database write was added in this phase.

## Added Files

```txt
artifacts/api-server/src/routes/retail.ts
artifacts/api-server/src/services/retail/retail.types.ts
artifacts/api-server/src/services/retail/retail.repository.ts
artifacts/api-server/src/services/retail/retail.repository-provider.ts
artifacts/api-server/src/services/retail/retail.mock-repository.ts
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
POST /api/retail/returns/preview
```

## Mock Checkout Contract

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

`POST /api/retail/sales/mock-checkout` uses the same body but returns a mock receipt number and mock transaction id. It does not write to the database.

## Prisma Agent Handoff

When Prisma retail models are ready, create a real adapter that implements:

```ts
RetailRepository
```

Then update:

```txt
artifacts/api-server/src/services/retail/retail.repository-provider.ts
```

Replace:

```ts
export const retailRepository: RetailRepository = retailMockRepository;
```

with a Prisma-backed repository.

## Real Checkout Integration Rules

When persistence is added, real checkout must write in one transaction:

```txt
1. retail sale
2. retail sale items
3. payment record
4. stock movement records
5. product stock update
6. audit log event
```

Do not update stock directly from route handlers. Route files must remain thin.

## Still Not Done

```txt
Prisma models
Prisma migration
real retail repository
auth/permission guard per role
OpenAPI/client generation
frontend API swap from mock data to backend hooks
```
