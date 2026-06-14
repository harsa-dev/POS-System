# Raw Material Migration Baseline / Idempotency Hardening

Status: implemented.

## Goal

Phase 8G adds a scoped Raw Material database baseline flow that can be run independently from global Prisma migration deployment.

The purpose is to support local/demo environments where Raw Material tables may be missing or partially applied while avoiding unrelated global migration errors.

## Implemented files

```txt
artifacts/api-server/prisma/sql/raw-material-baseline-guard.sql
artifacts/api-server/prisma/migrations/202606140006_add_raw_material_core_idempotent/migration.sql
artifacts/api-server/prisma/sql/raw-material-schema-verify.sql
artifacts/api-server/scripts/apply-raw-material-db.mjs
artifacts/api-server/package.json
scripts/raw-material-check.mjs
docs/workspaces/raw-material-migration-baseline-idempotency.md
```

## Commands

Apply the scoped Raw Material database baseline only:

```bash
pnpm --filter @workspace/api-server run raw-material:db:apply
```

Run the scoped validation gate with database setup enabled:

```bash
pnpm raw-material:check -- --db
```

Run database setup, seed demo data, and skip API smoke:

```bash
pnpm raw-material:check -- --db --seed --no-smoke
```

## Database flow

`raw-material:db:apply` runs three steps:

```txt
1. Check Raw Material base schema prerequisites
2. Apply Raw Material core tables, enums, and indexes
3. Verify Raw Material scoped schema
```

The apply script intentionally uses `prisma db execute` and avoids `prisma migrate deploy`.

## Baseline guard

The guard requires these base tables:

```txt
Business
User
AuditLog
```

It also requires these base enum types:

```txt
BusinessType
BusinessMode
```

If any base dependency is missing, setup fails loudly before applying Raw Material tables.

## Idempotent migration behavior

The migration is designed to be safe to rerun.

It uses:

```txt
ALTER TYPE ... ADD VALUE IF NOT EXISTS
CREATE TABLE IF NOT EXISTS
CREATE INDEX IF NOT EXISTS
```

The migration covers:

```txt
RawMaterialSupplier
RawMaterialStorageLocation
RawMaterialIntake
RawMaterialWeighing
RawMaterialBatch
RawMaterialProcessingRun
RawMaterialKandangPen
RawMaterialStockMovement
```

It also ensures Raw Material enum types and enum values exist.

## Verification behavior

The verify script fails if any required table is missing.

It also checks important columns across:

```txt
supplier master data
storage locations
intakes
weighings
batches
processing runs
kandang pens
stock movements
```

The verify script also checks required enum values, including:

```txt
BusinessMode.RAW_MATERIAL
BusinessType.RAW_MATERIAL
Raw Material workflow statuses
Raw Material stock movement types/reasons/sources
```

## Non-goals

This phase does not:

```txt
run global prisma migrate deploy
create demo seed data
change Prisma schema models
change backend route behavior
change frontend behavior
remove legacy Raw Material supplier migration
fix non-Raw-Material global typecheck errors
```

## Validation

After pulling this phase, run:

```bash
pnpm raw-material:check -- --db --no-smoke
```

For a fresh demo workspace, run:

```bash
pnpm raw-material:check -- --db --seed --no-smoke
```

## Next phase

```txt
Phase 8H - Audit + permission policy hardening
```
