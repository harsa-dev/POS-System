# Restaurant Scope Boundary

Status: V3 canonical Restaurant scope

Restaurant business mode is the canonical V3 scope for the old food-service POS functionality. `fnb` is not a product scope and must not be used for new runtime routes, folders, imports, or mode IDs.

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
- Custom Business mode changes
- platform-admin cleanup
- general shared dashboard cleanup
- global frontend typecheck cleanup
- reintroducing old FNB/F&B runtime naming

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

Use `restaurant` for code, routes, folders, imports, mode IDs, labels, and docs describing the current architecture. `fnb` is allowed only in historical migration notes or the single localStorage repair boundary.

Allowed new paths:

```text
artifacts/api-server/src/services/restaurant/**
artifacts/api-server/src/routes/restaurant.ts
artifacts/pos-system/src/features/restaurant/**
artifacts/pos-system/src/app/workspace/restaurant/**
lib/api-client-react/src/generated/api.ts
```

Avoid new paths:

```text
artifacts/pos-system/src/pages/dashboard/**
```

`features/restaurant/**` is the canonical feature folder for Restaurant operational modules.

## Deletion rule

Old FNB files should not remain as duplicate implementations. Useful logic must be moved into Restaurant-owned paths before old files are deleted.
