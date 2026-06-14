# Restaurant Scope Boundary

Status: active scope after Retail completion

Restaurant business mode is the only active scope for the current track. Legacy F&B is not a separate product scope anymore; it is compatibility code that must be mapped into Restaurant mode before removal.

## In scope

- Restaurant POS / cashier
- menu item catalog
- recipes and stock recipe impact
- dining tables
- order lifecycle
- kitchen display workflow
- serving workflow
- payment status and manual provider behavior
- order cancellation and refund/void flows
- Restaurant dashboard summaries
- Restaurant scoped OpenAPI/client helpers
- Restaurant scoped seed data
- Restaurant scoped typecheck/build/smoke gate
- Restaurant audit and permission policy

## Out of scope

- Retail mode changes
- Raw Material mode changes
- Service business mode changes
- platform-admin cleanup
- general shared dashboard cleanup
- global frontend typecheck cleanup
- deleting old F&B files before compatibility mapping is complete

## Validation rule

Restaurant must get its own scoped gate, following the Retail pattern:

```bash
pnpm restaurant:check
```

Planned internal steps:

```text
api-server restaurant:schema:sync
api-server generate
api-server typecheck:restaurant
pos-system typecheck:restaurant
pos-system build
```

Full project typecheck is intentionally not the Restaurant gate until non-restaurant modules are cleaned.

## Naming rule

Use `restaurant` for new code. Use `fnb` only for legacy compatibility references.

Allowed new paths:

```text
artifacts/api-server/src/services/restaurant/**
artifacts/api-server/src/routes/restaurant.ts
artifacts/pos-system/src/app/workspace/restaurant/**
lib/api-client-react/src/generated/api.ts
```

Avoid new paths:

```text
artifacts/pos-system/src/features/fnb/**
artifacts/pos-system/src/pages/dashboard/**
```

Those paths may remain temporarily as compatibility shims or old route targets, but should not receive new feature work unless it is required to keep the Restaurant transition safe.

## Deletion rule

Do not delete F&B legacy code until all are true:

1. Restaurant workspace has equivalent user-facing feature coverage.
2. Restaurant API/client surface exists.
3. Restaurant smoke gate passes.
4. No active routes import the legacy file.
5. Compatibility bridge has been documented.

Deleting first and asking TypeScript to sort it out is not a strategy. It is just chaos with a commit hash.
