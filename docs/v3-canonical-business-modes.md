# V3 Canonical Business Modes

Status: current architecture

POS System V3 uses canonical business-mode IDs in frontend routing, mode guards, API headers, and shared configuration.

## Active Modes

```txt
restaurant
retail
raw-material
```

## Planned Mode

```txt
custom-business
```

Custom Business is planned and guarded. It must not be presented as a complete production workspace until its workflow is explicitly completed.

## Restaurant Naming

```txt
Mode ID: restaurant
Feature folder: artifacts/pos-system/src/features/restaurant
Primary workspace: /workspace/restaurant/pos
Canonical dashboard fallback: /dashboard/restaurant/*
User label: Restaurant
```

`fnb` is no longer canonical V3 naming. It may appear only at the frontend localStorage migration boundary for old `currentBusinessMode` values. That boundary immediately rewrites the stored value to the canonical ID.

The backend API mode header accepts only canonical IDs:

```txt
restaurant
retail
raw-material
custom-business
```

Old IDs such as `fnb`, `warehouse`, and `service` are rejected in normal API flow.

## Feature Structure

```txt
artifacts/pos-system/src/features/
  restaurant/
  retail/
  raw-material/
  shared/
```

There must not be both `features/fnb` and `features/restaurant`.

## Cleanup Commands

Use the repo scripts where the environment permits:

```bash
pnpm --filter @workspace/pos-system run typecheck:restaurant
pnpm --filter @workspace/pos-system run typecheck:retail
pnpm --filter @workspace/pos-system run typecheck:raw-material
pnpm --filter @workspace/pos-system run typecheck:service
pnpm --filter @workspace/pos-system run build
pnpm business-mode:check
pnpm restaurant:check
pnpm retail:check
pnpm raw-material:check
pnpm typecheck
```

If package-manager commands fail because of local environment permissions, use repo-local TypeScript checks as supplemental verification and document the limitation.

## Manual QA Checklist

1. Open `/select-mode`.
2. Select Restaurant.
3. Refresh the Restaurant dashboard.
4. Open a Restaurant route directly.
5. Select Retail.
6. Refresh the Retail dashboard.
7. Open a Retail route directly.
8. Select Raw Material.
9. Refresh the Raw Material dashboard.
10. Open a Raw Material route directly.
11. Try an invalid `currentBusinessMode`.
12. Try an empty `currentBusinessMode`.
13. Try planned Custom Business.
14. Try old `/dashboard/fnb/*` routes and confirm they are not normal active routes.
15. Confirm no runtime UI label says FNB.
