# Business Mode Service Workspace

## Goal

Create a single frontend service layer for business-mode selection, transition, storage repair, route resolution, workspace access checks, and shared-route isolation.

The project has separate files for business-mode types, registry, storage, selector UI, switcher UI, route guard, sidebar runtime filtering, and route registration. This workspace keeps that behavior centralized before deeper mode-specific workflows are added.

## Primary files

```txt
artifacts/pos-system/src/components/core/business-mode/business-mode.types.ts
artifacts/pos-system/src/components/core/business-mode/business-mode-registry.ts
artifacts/pos-system/src/components/core/business-mode/business-mode-storage.ts
artifacts/pos-system/src/components/core/business-mode/business-mode-service.ts
artifacts/pos-system/src/components/core/business-mode/business-mode-switcher.tsx
artifacts/pos-system/src/components/core/mode-selector/mode-selector.tsx
artifacts/pos-system/src/components/core/route-guard/business-mode.ts
artifacts/pos-system/src/components/core/route-guard/route-guard.tsx
artifacts/pos-system/src/App.tsx
artifacts/pos-system/src/app/registry/business-modules.ts
artifacts/pos-system/src/app/registry/module-types.ts
```

## Current selectable modes

```txt
restaurant
retail
raw-material
```

## Current planned / locked modes

```txt
custom-business
```

## Service responsibilities

`business-mode-service.ts` now owns:

- selectable mode list
- planned mode list
- locked mode list
- entry route resolver
- route support resolver
- route access helper
- transition prepare/commit/switch helpers
- workspace state helper
- storage repair helper
- legacy storage compatibility through the storage layer

UI should use `businessModeService.switchMode()` instead of calling `setCurrentBusinessMode()` directly.

## Route isolation rules

Restaurant routes require `restaurant`.
Retail routes require `retail`.
Raw Material routes require `raw-material`.

Shared business routes such as cashflow, financial reports, customers, invoice, and shift reports are allowed only when a valid active business mode exists. They must use the selected mode as their context.

`App.tsx` subscribes to `business-mode:changed` and clears React Query cache, so shared dashboard data is refetched with the new `X-Business-Mode` header after switching mode.

## Important constraints

- LocalStorage is not a backend security source of truth.
- Backend must still validate business context from authenticated user/session.
- `custom-business` remains visible but not selectable.
- Do not reintroduce legacy runtime roles such as `CASHIER`, `KITCHEN`, or `SERVER` in V3 module metadata.
- Do not rename `currentBusinessMode` without migration.

## Acceptance checklist

```txt
1. /select-mode loads.
2. restaurant enters /workspace/restaurant/pos.
3. retail enters /v3/retail/cashier.
4. raw-material enters /v3/raw-material/kandang.
5. custom-business is visible but disabled.
6. wrong mode route redirects to /select-mode.
7. switching mode clears shared route cache.
8. cashflow/report pages refetch under the selected mode context.
9. legacy values fnb/service/warehouse still repair into new ids.
```

## Next patches

```txt
BM-3 - Sidebar/module filtering hardening
BM-4 - Select-mode next-route flow
BM-5 - Business-mode smoke checklist/script
```
