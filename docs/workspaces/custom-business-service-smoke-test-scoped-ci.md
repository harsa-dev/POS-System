# Service Business Smoke Test + Scoped CI Gate

Status: implemented.

This document records the Service Business Phase 8F scoped validation lane.

## Goal

Give Business Mode Service the same validation shape as Retail and Raw Material without letting unrelated global frontend/backend errors block this mode.

This phase adds:

```txt
scripts/service-check.mjs
scripts/service-api-smoke.mjs
artifacts/api-server/tsconfig.service.json
artifacts/pos-system/tsconfig.service.json
root package scripts: service:check, service:smoke
api-server script: typecheck:service
pos-system script: typecheck:service
```

## Commands

Light scoped validation:

```bash
pnpm service:check -- --no-smoke --no-build
```

Scoped validation with frontend build:

```bash
pnpm service:check -- --no-smoke
```

Full scoped validation:

```bash
pnpm service:check
```

DB + demo tenant + seed + scoped validation:

```bash
pnpm service:check -- --db --seed --no-smoke
```

The `--seed` flag automatically runs `service:ensure-business` before `service:seed`.

## service:check flow

Default steps:

```txt
1. Generate API Prisma client
2. Typecheck Service Business API server scope
3. Typecheck Service Business POS frontend scope
4. Build POS frontend bundle
5. Run Service Business read-only API smoke
```

Optional flags:

```txt
--db              run service:db:apply first
--ensure-business run service:ensure-business without seed
--seed            run service:ensure-business and service:seed
--no-build        skip POS frontend production build
--no-smoke        skip authenticated API smoke
```

Environment aliases:

```txt
SERVICE_CHECK_WITH_DB=true
SERVICE_CHECK_ENSURE_BUSINESS=true
SERVICE_CHECK_WITH_SEED=true
SERVICE_CHECK_SKIP_BUILD=true
SERVICE_CHECK_SKIP_SMOKE=true
```

## API scoped typecheck

File:

```txt
artifacts/api-server/tsconfig.service.json
```

Scope:

```txt
src/routes/service-business.ts
src/routes/service-business-workflow.ts
src/features/service-business/**/*.ts
src/lib/auth.ts
src/lib/business-context/**/*.ts
src/lib/constants.ts
src/lib/errors/**/*.ts
src/lib/responses/**/*.ts
src/lib/logger.ts
src/lib/prisma.ts
```

## Frontend scoped typecheck

File:

```txt
artifacts/pos-system/tsconfig.service.json
```

Scope:

```txt
src/app/workspace/custom-business/custom-business-service-workspace.tsx
src/app/workspace/custom-business/service/**/*.ts
src/app/workspace/custom-business/service/**/*.tsx
src/features/shared/service-business/**/*.ts
src/features/shared/service-business/**/*.tsx
src/components/ui/badge.tsx
src/components/ui/button.tsx
src/components/ui/card.tsx
src/components/ui/input.tsx
src/components/ui/label.tsx
src/components/ui/select.tsx
src/lib/api/api-client.ts
src/lib/utils.ts
```

The goal is to catch Service Business regressions without importing the whole app into this lane.

## service:smoke

File:

```txt
scripts/service-api-smoke.mjs
```

Default base URL:

```txt
http://localhost:3001/api
```

Override:

```bash
SERVICE_API_BASE_URL=http://localhost:3001/api pnpm service:smoke
```

Authenticated checks require:

```txt
SERVICE_API_COOKIE=<logged-in cookie>
```

If no cookie is present, the smoke script probes `/health` and skips authenticated Service checks.

## Read-only smoke coverage

Authenticated smoke checks:

```txt
GET /custom-business/service/summary
GET /custom-business/service/workspace
GET /custom-business/service/jobs
GET /custom-business/service/workflow/statuses
```

The smoke script asserts:

```txt
success=true envelope
data exists
summary required keys
workspace jobs array
jobs nested data array
workflow statuses array
```

## Seed-aware smoke

Enable seed assertions:

```bash
SERVICE_SMOKE_EXPECT_SEED=true pnpm service:smoke
```

Expected minimum rows:

```txt
summary.totals.jobs >= 3
workspace.jobs.length >= 3
jobs.data.length >= 3
```

## Non-goals

This phase does not:

```txt
mutate Service data
call billing writes
call status writes
add OpenAPI coverage
add generated client boundary
add audit/permission policy assertions
fix unrelated global errors
```

## Next phase

```txt
Service Phase 8G - Migration baseline/idempotency hardening
```

Note: the Service DB apply was already converted to scoped guard/apply/verify while fixing the non-idempotent enum issue. Phase 8G should formalize that status in the main plan if still needed.
