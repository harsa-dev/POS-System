# Custom Business Service - DB Apply Idempotency Patch

## Status

Implemented.

## Why this patch exists

The old `service:db:apply` script directly executed:

```bash
prisma db execute --file prisma/migrations/202606140002_add_service_business_core/migration.sql
```

That migration was not idempotent. If the database already had the Service Business enum types from a previous partial or complete run, PostgreSQL failed with:

```txt
ERROR: type "service_business_workflow_status" already exists
```

That is a setup/idempotency problem, not a Prisma Client generation problem.

## New command behavior

`service:db:apply` now runs:

```bash
node ./scripts/apply-service-business-db.mjs
```

The scoped setup performs three steps:

1. `prisma/sql/service-business-baseline-guard.sql`
2. `prisma/migrations/202606140007_add_service_business_core_idempotent/migration.sql`
3. `prisma/sql/service-business-schema-verify.sql`

## Files

```txt
artifacts/api-server/scripts/apply-service-business-db.mjs
artifacts/api-server/prisma/sql/service-business-baseline-guard.sql
artifacts/api-server/prisma/migrations/202606140007_add_service_business_core_idempotent/migration.sql
artifacts/api-server/prisma/sql/service-business-schema-verify.sql
artifacts/api-server/package.json
```

## Baseline guard

The guard verifies that shared base app objects exist before Service Business tables are applied:

```txt
Business
User
AuditLog
BusinessType
BusinessMode
```

## Idempotent behavior

The idempotent SQL uses:

```txt
ALTER TYPE ... ADD VALUE IF NOT EXISTS
DO $$ ... IF NOT EXISTS ... CREATE TYPE ... END IF
CREATE TABLE IF NOT EXISTS
CREATE INDEX IF NOT EXISTS
```

It covers:

```txt
service_requests
service_jobs
service_cost_lines
service_quotations
service_invoices
service_checklist_items
service_timeline_items
```

## Verification behavior

The verify SQL checks:

```txt
required Service Business tables
required columns
required enum values
```

If the schema is partial or drifted, verification fails clearly instead of silently pretending the DB is ready.

## Seed note

`service:seed` still requires an active `Business` row with:

```txt
mode = SERVICE
isActive = true
```

If no active Service business exists, the seed script exits safely and does not create one automatically.

## Validation

```bash
pnpm --filter @workspace/api-server run service:db:apply
pnpm --filter @workspace/api-server run generate
pnpm --filter @workspace/api-server run service:seed
```

If `service:seed` reports no active Service business, create/select a Service-mode business first, then rerun the seed.

## Non-goals

```txt
No global prisma migrate deploy
No Prisma schema change
No automatic Service business creation
No seed behavior change
No frontend behavior change
```
