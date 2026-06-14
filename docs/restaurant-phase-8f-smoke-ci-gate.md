# Phase 8F - Restaurant Smoke Test + Scoped CI Gate

Status: Implemented

## Purpose

Phase 8F adds a scoped validation gate for Restaurant mode so Restaurant work can be checked without dragging unrelated Retail, Raw Material, Service, or legacy F&B cleanup failures into the same run.

The gate is intentionally split into two layers:

1. `restaurant:check` for local and CI-safe static validation.
2. `restaurant:smoke` for runtime API smoke checks when an API server and authenticated session cookie are available.

## Root scripts

```bash
pnpm restaurant:check
pnpm restaurant:smoke
```

### `restaurant:check`

Runs:

```bash
pnpm --filter @workspace/api-server run typecheck:restaurant
pnpm --filter @workspace/pos-system run typecheck:restaurant
```

Optional flags/env:

```bash
pnpm restaurant:check --seed
pnpm restaurant:check --smoke
pnpm restaurant:check --build
```

Environment equivalents:

```bash
RESTAURANT_CHECK_WITH_SEED=true
RESTAURANT_CHECK_WITH_SMOKE=true
RESTAURANT_CHECK_WITH_BUILD=true
```

The default CI-safe mode does not run seed, smoke, or frontend build. It focuses only on the scoped Restaurant backend and frontend typecheck gates.

### `restaurant:smoke`

Runtime API smoke defaults:

```bash
RESTAURANT_API_BASE_URL=http://localhost:3001/api
```

Health smoke runs without auth:

```text
GET /restaurant/health
```

Authenticated smoke checks require:

```bash
RESTAURANT_API_COOKIE=<logged-in-cookie>
```

Authenticated read smoke covers:

```text
GET /restaurant/dashboard
GET /restaurant/menu-items
GET /restaurant/tables
GET /restaurant/orders/active
GET /restaurant/kitchen
GET /restaurant/serving
GET /restaurant/workflow
GET /restaurant/shared-dashboard/overview
```

Optional seed assertions:

```bash
RESTAURANT_SMOKE_EXPECT_SEED=true
```

Optional preview/mutation smoke env:

```bash
RESTAURANT_SMOKE_MENU_ITEM_ID=<menu-item-id>
RESTAURANT_SMOKE_TABLE_ID=<table-id>
RESTAURANT_SMOKE_ORDER_ID=<order-id>
RESTAURANT_SMOKE_STATUS_ORDER_ID=<order-id>
RESTAURANT_SMOKE_STATUS_TARGET=PREPARING
RESTAURANT_SMOKE_PAYMENT_REVERSAL_ORDER_ID=<order-id>
RESTAURANT_SMOKE_CANCELLATION_ORDER_ID=<order-id>
```

Mutation smoke checks are skipped unless the corresponding IDs are provided.

## CI workflow

New workflow:

```text
.github/workflows/restaurant-scoped-check.yml
```

It runs on push and pull request changes that touch Restaurant backend, frontend, scripts, docs, package scripts, or the workflow itself.

The workflow runs:

```bash
pnpm install --frozen-lockfile
pnpm restaurant:check
```

The CI gate does not require a database session cookie and does not seed data by default.

## Non-goals

This phase does not:

- Replace full repository typecheck.
- Run destructive mutation smoke by default.
- Require a live API server in CI.
- Generate OpenAPI clients.
- Delete legacy Restaurant routes.

## Validation

Local CI-safe validation:

```bash
pnpm restaurant:check
```

Local seeded validation:

```bash
pnpm --filter @workspace/api-server run restaurant:seed
pnpm restaurant:check
```

Runtime smoke after starting the API server:

```bash
RESTAURANT_API_COOKIE=<cookie> RESTAURANT_SMOKE_EXPECT_SEED=true pnpm restaurant:smoke
```
