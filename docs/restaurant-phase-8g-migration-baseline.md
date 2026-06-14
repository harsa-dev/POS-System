# Phase 8G - Restaurant Migration Baseline / Idempotency Hardening

Status: Implemented
Scope: Restaurant business mode database baseline checks and scoped validation hardening.

## Why this phase exists

Restaurant seed and write flows now depend on the canonical multi-business schema. Older local databases can still contain legacy columns or enum values such as:

- `User.role = CASHIER | KITCHEN | SERVER`
- `Restaurant.name`
- `Restaurant.ownerId`
- `*.restaurantId`
- missing `businessId` bridge columns

Those legacy shapes can pass TypeScript but fail runtime seed/write flows. Phase 8G adds an explicit database baseline checker so drift is detected before Restaurant seed or smoke tests become a table-by-table guessing game.

## New commands

From the repository root:

```bash
pnpm restaurant:baseline
pnpm restaurant:check --baseline
```

From the API server workspace:

```bash
pnpm --filter @workspace/api-server run restaurant:baseline:check
```

## Baseline checker

Implemented file:

```text
artifacts/api-server/scripts/check-restaurant-db-baseline.ts
```

The checker validates:

- canonical `Role` enum values exist:
  - `OWNER`
  - `MANAGER`
  - `ADMIN`
  - `OPERATOR`
  - `STAFF`
  - `VIEWER`
- no user rows still use legacy roles:
  - `CASHIER`
  - `KITCHEN`
  - `SERVER`
- required `businessId` bridge columns exist on Restaurant core tables
- legacy columns that may still exist are not `NOT NULL`
- required seed/idempotency indexes exist:
  - `Category_businessId_name_key`
  - `InventoryItem_businessId_name_key`
  - `Order_businessId_orderNumber_key`

## Recommended recovery order for drifted local DB

If a local database is old or mixed between V2/V3 schemas, run:

```bash
pnpm --filter @workspace/api-server run restaurant:roles:normalize
pnpm --filter @workspace/api-server exec prisma db push --accept-data-loss
pnpm --filter @workspace/api-server run restaurant:seed
pnpm restaurant:baseline
```

Use `--accept-data-loss` only on local/dev databases. It can drop legacy columns that no longer exist in `schema.prisma`.

## Scoped check integration

`pnpm restaurant:check` remains typecheck-only by default.

Use this for DB-backed validation:

```bash
pnpm restaurant:check --baseline
```

Use this for seeded validation:

```bash
pnpm restaurant:check --baseline --seed
```

## Non-goals

- This does not replace Prisma migrations.
- This does not run destructive DB push automatically.
- This does not seed by default in CI.
- This does not validate unrelated Retail, Raw Material, Service, or global application schema drift.

## Validation

```bash
pnpm restaurant:check
pnpm restaurant:baseline
pnpm restaurant:check --baseline
```
