# Raw Material Smoke Test + Scoped CI Gate

Status: implemented.

This document records Raw Material Phase 8F in the Retail-style implementation plan.

## Goal

Create a scoped validation gate for Raw Material that does not depend on global non-Raw-Material typecheck cleanup.

This mirrors the Retail scoped gate pattern.

## Implemented files

```txt
scripts/raw-material-check.mjs
scripts/raw-material-api-smoke.mjs
package.json
artifacts/api-server/package.json
artifacts/api-server/tsconfig.raw-material.json
artifacts/pos-system/package.json
artifacts/pos-system/tsconfig.raw-material.json
```

## Root commands

```bash
pnpm raw-material:check
pnpm raw-material:smoke
```

## Scoped check behavior

Default command:

```bash
pnpm raw-material:check
```

Default steps:

```txt
1. Generate API Prisma client
2. Typecheck Raw Material API server scope
3. Typecheck Raw Material POS frontend scope
4. Build POS frontend bundle
5. Run Raw Material read-only API smoke
```

The gate intentionally excludes global non-Raw-Material errors.

## Optional flags

```bash
pnpm raw-material:check -- --seed
pnpm raw-material:check -- --no-build
pnpm raw-material:check -- --no-smoke
```

Environment equivalents:

```txt
RAW_MATERIAL_CHECK_WITH_SEED=true
RAW_MATERIAL_CHECK_SKIP_BUILD=true
RAW_MATERIAL_CHECK_SKIP_SMOKE=true
```

## API scoped typecheck

Command:

```bash
pnpm --filter @workspace/api-server run typecheck:raw-material
```

Config:

```txt
artifacts/api-server/tsconfig.raw-material.json
```

Included scope:

```txt
src/routes/raw-material.ts
src/routes/raw-material-processing.ts
src/routes/raw-material-pens.ts
src/routes/raw-material-stock-movements.ts
src/routes/raw-material-summary.ts
src/services/raw-material/**/*.ts
src/lib/auth.ts
src/lib/business-context/**/*.ts
src/lib/constants.ts
src/lib/errors/**/*.ts
src/lib/responses/**/*.ts
src/lib/logger.ts
src/lib/prisma.ts
```

## Frontend scoped typecheck

Command:

```bash
pnpm --filter @workspace/pos-system run typecheck:raw-material
```

Config:

```txt
artifacts/pos-system/tsconfig.raw-material.json
```

Included scope:

```txt
src/app/workspace/raw-material/**/*.ts
src/app/workspace/raw-material/**/*.tsx
src/features/raw-material/**/*.ts
src/features/raw-material/**/*.tsx
src/features/shared/raw-material-bridge/**/*.ts
src/features/shared/raw-material-bridge/**/*.tsx
src/components/ui/badge.tsx
src/components/ui/button.tsx
src/components/ui/card.tsx
src/components/ui/input.tsx
src/components/ui/label.tsx
src/components/ui/select.tsx
src/lib/**/*.ts
```

## API smoke behavior

Command:

```bash
pnpm raw-material:smoke
```

Environment:

```txt
RAW_MATERIAL_API_BASE_URL=http://localhost:3001/api
RAW_MATERIAL_API_COOKIE=<logged-in session cookie>
```

Without `RAW_MATERIAL_API_COOKIE`, the script performs only a soft `/health` reachability check and skips authenticated Raw Material endpoints.

With `RAW_MATERIAL_API_COOKIE`, the script checks read-only endpoints:

```txt
GET /raw-material/summary
GET /raw-material/suppliers
GET /raw-material/storage-locations
GET /raw-material/intakes
GET /raw-material/weighings
GET /raw-material/batches
GET /raw-material/processing-runs
GET /raw-material/pens
GET /raw-material/stock-movements
```

## Non-goals

```txt
Do not run full global typecheck.
Do not apply database migrations.
Do not create Raw Material DB baseline scripts.
Do not mutate stock in smoke tests.
Do not enable frontend write actions.
Do not remove mock fallback.
```

Database baseline/idempotency hardening is reserved for Raw Material Phase 8G.

## Next phase

Proceed to:

```txt
Raw Material Phase 7C - Workflow read delegate
```

Focus:

```txt
API-backed read delegates for list/workflow data:
- intakes
- weighings
- batches
- processing runs
- suppliers
- storage locations
- kandang pens
- stock movements
```
