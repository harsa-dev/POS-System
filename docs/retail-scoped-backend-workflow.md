# Retail Scoped Backend Workflow

This workflow exists because the current backend still has legacy/non-retail typecheck and migration issues. Retail mode should be validated without forcing unrelated modules to be fixed first.

## What This Scope Includes

```txt
artifacts/api-server/src/routes/retail.ts
artifacts/api-server/src/services/retail/**
artifacts/api-server/prisma/migrations/202606140001_add_retail_core/migration.sql
```

## What This Scope Does Not Include

```txt
raw-material
legacy misc settings
restaurant inventory service cleanup
restaurant order stock movement cleanup
legacy audit-log businessId cleanup
old Prisma migration history repair
```

Those issues are real, but they are outside the Retail Mode implementation scope.

## Why Not `prisma migrate dev` Yet

`prisma migrate dev` replays the full migration history against a shadow database. The current project history has older migrations that assume legacy tables already exist. That can fail before the Retail migration is even tested.

For Retail-only backend progress, apply the Retail SQL directly.

## Commands

From the repo root:

```bash
pnpm --filter @workspace/api-server run generate
pnpm --filter @workspace/api-server run typecheck:retail
pnpm --filter @workspace/api-server run build
```

Apply only the Retail core tables:

```bash
pnpm --filter @workspace/api-server run retail:db:apply
```

Do not use this for full project migration health:

```bash
pnpm --filter @workspace/api-server exec prisma migrate dev
pnpm --filter @workspace/api-server exec prisma migrate deploy
```

until legacy migration history is repaired or baselined.

## Expected Result

- `typecheck:retail` checks Retail route/service/backend support files only.
- `build` can still compile the server bundle.
- `retail:db:apply` creates Retail tables through the existing Prisma datasource without replaying the whole migration chain.

## Retail Smoke Test

After auth and a retail business context exist:

```txt
GET  /api/retail/health
GET  /api/retail/products
GET  /api/retail/dashboard
POST /api/retail/sales/preview
POST /api/retail/sales/checkout
```

If `products` returns an empty array, the Retail tables exist but no RetailProduct rows have been seeded yet.

## Pending Retail-Only Follow Up

Keep the next commits scoped to Retail only:

```txt
1. add a small demo seed workflow for RetailSupplier and RetailProduct
2. wire Retail catalog UI to GET /api/retail/products with mock fallback
3. wire Retail cashier checkout to POST /api/retail/sales/checkout with mock fallback
4. add Retail endpoint coverage to the OpenAPI spec/client
5. sync schema.prisma models after the raw repository is proven stable
```

Do not fix non-retail typecheck failures inside this track unless they block `typecheck:retail` or the Retail build path directly.
