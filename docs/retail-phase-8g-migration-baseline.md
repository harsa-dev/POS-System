# Retail Phase 8G - Migration Baseline and Idempotency Hardening

Status: implemented

## Goal

Make Retail database setup safer on existing non-empty Postgres/Neon databases without relying on the legacy Prisma migration history.

## Why this exists

The wider repository still has legacy migration history problems, so Retail mode must not depend on `prisma migrate deploy` until that history is repaired. Retail uses scoped SQL files through `prisma db execute` instead.

## Implemented scope

```txt
- Added Retail baseline guard SQL before applying Retail tables
- Added Retail postflight schema verification SQL
- Added guarded Retail DB apply runner
- Changed api-server retail:db:apply to use the guarded runner
- Kept Retail DB setup independent from prisma migrate deploy
- Preserved idempotent CREATE TABLE IF NOT EXISTS / CREATE INDEX IF NOT EXISTS migration style
```

## Primary files

```txt
artifacts/api-server/prisma/sql/retail-baseline-guard.sql
artifacts/api-server/prisma/sql/retail-schema-verify.sql
artifacts/api-server/scripts/apply-retail-db.mjs
artifacts/api-server/package.json
```

## Guarded apply order

```txt
1. Check base schema prerequisites
2. Apply Retail core tables and indexes
3. Apply Retail return tables and indexes
4. Verify Retail scoped schema
```

## Base schema prerequisites

Retail scoped migrations expect these shared base tables to already exist:

```txt
Business
User
CashflowEntry
AuditLog
```

If one is missing, `retail:db:apply` fails before touching Retail tables.

## Postflight verification

The postflight check verifies that required Retail tables and important columns exist after scoped SQL is applied. It catches partial Retail table drift instead of silently allowing broken schemas.

Verified Retail tables:

```txt
RetailSupplier
RetailProduct
RetailReceiving
RetailReceivingItem
RetailSale
RetailSaleItem
RetailPayment
RetailStockMovement
RetailReturn
RetailReturnItem
```

## Commands

Normal Retail validation without DB mutation:

```bash
pnpm retail:check
```

Retail validation with guarded DB setup:

```bash
pnpm retail:check -- --db
```

API-server-only DB setup:

```bash
pnpm --filter @workspace/api-server run retail:db:apply
```

## Important boundary

Do not use this as a replacement for full repository migration repair. This only hardens the Retail business mode path.

Full Prisma migration cleanup remains out of Retail scope until the non-retail migration history is intentionally repaired.
