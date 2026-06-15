# Platform Admin Dev Database Reset Strategy

## Scope

This document is scoped to the development database workflow used while building:

```txt
/dashboard/internal-monitoring
```

It exists because the current Prisma migration chain is not yet reliable from an already-populated Neon development database. The current database has existing schema objects, while Prisma Migrate reports all repository migrations as unapplied. In that state, `prisma migrate deploy` can fail with `P3005`, and `prisma migrate reset` can expose older SQL drift one migration at a time.

This is a development workflow document only. It is not a production migration policy.

## Current reality

```txt
Database provider: PostgreSQL / Neon development branch
Migration folder: artifacts/api-server/prisma/migrations
Observed issue: non-empty schema with unapplied migration history
Primary error: P3005
Safe development fallback: prisma db push --accept-data-loss
Production-safe path: baseline migration history, then migrate deploy
```

## Why reset is allowed only for dev

Reset is acceptable only when all of these are true:

```txt
1. The database is a disposable dev database.
2. No customer, production, staging, or shared QA data is stored there.
3. Losing demo users, demo orders, demo settings, and seed data is acceptable.
4. The team is ready to seed again after reset or push.
5. The DATABASE_URL points to the intended dev branch.
```

If any of those are false, do not use reset or accept-data-loss commands.

## Recommended dev repair path

When migration reset starts failing on older SQL files, stop chasing each SQL error. For development only, repair the database shape from the current Prisma schema:

```bash
pnpm --filter @workspace/api-server run prisma:db:push:dev
pnpm --filter @workspace/api-server run generate
pnpm --filter @workspace/api-server run restaurant:seed
```

A shortcut command is provided:

```bash
pnpm --filter @workspace/api-server run dev:db:repair
```

This path intentionally does not claim that the migration chain is production-clean. It only restores a usable dev database shape from the current schema.

## Migration status command

Use this command to inspect the current migration state without relying on filtered `exec` behavior:

```bash
pnpm --filter @workspace/api-server run prisma:migrate:status
```

## When to use migrate deploy

Use `migrate deploy` only when the database migration history is already clean or has been explicitly baselined:

```bash
pnpm --filter @workspace/api-server run prisma:migrate:deploy
```

Do not use `migrate deploy` as the first repair step against a non-empty database whose migration history is empty.

## Baseline path for later

A proper baseline should happen in a separate database-maintenance phase:

```txt
1. Inspect all existing tables.
2. Confirm which migrations are already represented in the live schema.
3. Mark only those existing migrations as applied with prisma migrate resolve.
4. Do not mark new migrations as applied unless their objects already exist.
5. Run prisma migrate deploy after the baseline is consistent.
6. Document the exact baseline commands used.
```

This baseline work should not be mixed with feature delivery.

## InternalSystemProbe note

The Internal Monitoring dashboard can still run safely if `internal_system_probes` does not exist yet. The probe history endpoint returns a controlled status such as:

```txt
schema-missing
not-configured
database-unavailable
ready
```

That means the dashboard should not crash while dev database repair is in progress.

## Validation after dev repair

Run these checks after `dev:db:repair`:

```bash
pnpm platform-admin:check
pnpm platform-admin:contract-parity
pnpm platform-admin:policy-parity
pnpm platform-admin:final-qa
pnpm platform-admin:persistence-plan
pnpm business-mode:check
pnpm --filter @workspace/api-server run typecheck:restaurant
pnpm --filter @workspace/pos-system run typecheck:restaurant
```

## Guardrails

```txt
- This workflow is for dev only.
- Do not use accept-data-loss commands on production or shared staging.
- Do not claim migration history is clean after db push.
- Do not add scheduled probe writes until the database workflow is stable.
- Keep /api/internal/* write routes blocked.
```
