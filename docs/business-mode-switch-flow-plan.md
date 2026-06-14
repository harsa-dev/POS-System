# Business Mode Switch Flow Plan

## Scope

This plan covers the frontend flow for switching business modes. It does not add new business modes.

The switch flow must keep these pieces aligned:

- selected mode
- route access
- sidebar/module visibility
- shared dashboard context
- API `X-Business-Mode` header
- React Query cache

## Current mode status

Selectable:

```txt
restaurant
retail
raw-material
```

Locked / planned:

```txt
custom-business
```

## Source of truth

Frontend mode configuration lives in:

```txt
artifacts/pos-system/src/components/core/business-mode/business-mode-registry.ts
```

Runtime storage key:

```txt
currentBusinessMode
```

Local storage is only a frontend session preference. Backend access must still come from authenticated user and business context.

## Switch flow

```txt
select mode or switcher
  -> validate target mode is selectable
  -> commit currentBusinessMode
  -> dispatch business-mode:changed
  -> clear mode-scoped frontend query cache
  -> redirect to mode entry route
```

## Route separation

Restaurant routes require `restaurant`:

```txt
/workspace/restaurant/*
/dashboard/fnb/*
```

Retail routes require `retail`:

```txt
/v3/retail/*
```

Raw Material routes require `raw-material`:

```txt
/v3/raw-material/*
```

Shared routes such as cashflow/reports/customers/invoice are allowed only inside a valid active mode context. When the mode changes, query cache is cleared so shared pages refetch under the new mode header instead of reusing stale data.

## Sidebar/module visibility

Sidebar visibility is also mode-scoped. A sidebar item must pass all checks:

```txt
1. active mode is valid
2. item supports active mode
3. item route support includes active mode
4. user runtime role is allowed by the item's permissions
```

This prevents Restaurant links from staying visible in Retail, Retail links from staying visible in Restaurant, and shared links from bypassing active mode context.

## Implemented in this phase

```txt
BM-1 - Docs and role model reconciliation                          Done
BM-2 - Centralized transition service                              Done
BM-2B - Route separation and shared cache reset guard               Done
BM-3 - Sidebar/module filtering hardening                          Done
BM-4 - Select-mode next-route flow                                  Next
BM-5 - Business-mode smoke checklist/script                         Planned
```

## Manual smoke

```txt
1. Clear currentBusinessMode and open /dashboard -> /select-mode.
2. Select restaurant -> restaurant entry route.
3. Switch to retail -> retail entry route.
4. Switch to raw-material -> raw-material entry route.
5. Open a restaurant route while retail is active -> /select-mode.
6. Open a retail route while restaurant is active -> /select-mode.
7. Open cashflow, switch mode, then return to cashflow -> page refetches with selected mode context.
8. Sidebar title follows active mode label.
9. Sidebar links only show modules supported by the active mode and user role.
10. custom-business remains visible but not selectable.
```
