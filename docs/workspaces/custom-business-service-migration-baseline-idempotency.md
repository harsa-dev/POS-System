# Service Business Migration Baseline / Idempotency Hardening

Status: implemented.

This document records the Service Business Phase 8G database setup hardening.

## Goal

Make Service Business database setup safe to run repeatedly without using global `prisma migrate deploy`.

The original command executed the initial Service migration SQL directly. That failed when an enum already existed:

```txt
type "service_business_workflow_status" already exists
```

The fix is a scoped guard/apply/verify flow similar to Retail and Raw Material.

## Command

```bash
pnpm --filter @workspace/api-server run service:db:apply
```

## Implemented files

```txt
artifacts/api-server/scripts/apply-service-business-db.mjs
artifacts/api-server/prisma/sql/service-business-baseline-guard.sql
artifacts/api-server/prisma/migrations/202606140007_add_service_business_core_idempotent/migration.sql
artifacts/api-server/prisma/sql/service-business-schema-verify.sql
artifacts/api-server/package.json
```

## Flow

```txt
1. Check Service Business base schema prerequisites
2. Apply Service Business core tables, enums, and indexes
3. Verify Service Business scoped schema
```

## Baseline guard

The guard verifies core platform dependencies before applying Service tables:

```txt
Business
User
AuditLog
BusinessType
BusinessMode
```

If these prerequisites are missing, the script fails early.

## Idempotent migration

The Service idempotent migration uses:

```txt
DO $$ BEGIN CREATE TYPE ... EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TYPE ... ADD VALUE IF NOT EXISTS
CREATE TABLE IF NOT EXISTS
CREATE INDEX IF NOT EXISTS
```

This makes the apply step safe when the enum/table/index already exists.

## Verify step

The verify SQL checks:

```txt
required Service tables
required Service columns
required Service enum values
```

If the database is partial or drifted, verification fails after apply.

## Non-goals

This phase does not:

```txt
run global prisma migrate deploy
create a Service business tenant
seed Service demo data
change route behavior
change Prisma schema
fix non-Service global errors
```

## Related commands

Full local setup:

```bash
pnpm --filter @workspace/api-server run service:db:apply
pnpm --filter @workspace/api-server run generate
pnpm --filter @workspace/api-server run service:ensure-business
pnpm --filter @workspace/api-server run service:seed
```

Scoped gate with DB setup:

```bash
pnpm service:check -- --db --seed --no-smoke
```

## Next phase

```txt
Service Phase 6 - Service OpenAPI/client coverage
```
