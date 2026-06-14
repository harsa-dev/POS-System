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
  -> redirect to mode entry route or safe intended route
```

## Select-mode next-route flow

When a user opens a route that is not allowed for the active mode, the route guard redirects to:

```txt
/select-mode?next=<encoded-intended-route>
```

The selector only continues to `next` when the selected mode supports that route. If the selected mode is incompatible with `next`, it falls back to the selected mode entry route.

Safety rules:

```txt
1. next must be a same-origin relative path
2. next cannot be /select-mode, /login, or /register
3. selected mode must be selectable
4. selected mode must support the next route
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

## Static smoke check

Business-mode switch flow has a static smoke command:

```bash
pnpm business-mode:check
```

The command verifies source contracts for:

```txt
storage key and event
selectable mode registry
legacy mode repair map
centralized transition service
route isolation support
safe next-route flow
route guard redirect behavior
mode selector continuation behavior
switcher transition usage
query cache reset
sidebar route-support filtering
generalized runtime role mapping
optional browser smoke script presence
optional Playwright E2E harness presence
```

It is not a browser automation test. It is a fast source-level guard that catches accidental drift in the switch-flow contract.

## Optional browser smoke

Business-mode switch flow also has an optional browser smoke command:

```bash
pnpm business-mode:browser-smoke
```

Environment:

```txt
BUSINESS_MODE_APP_URL=http://localhost:5173
BUSINESS_MODE_SMOKE_COOKIE=<browser cookie for authenticated checks>
BUSINESS_MODE_SMOKE_HEADLESS=false
BUSINESS_MODE_SMOKE_SKIP_AUTH=true
```

This browser smoke checks protected route redirection, safe `next` continuation, mode storage after selection, and shared dashboard active-mode context. It requires Playwright to be installed locally when browser smoke is needed.

## Optional Playwright E2E harness

Business-mode switch flow also has a Playwright Test harness:

```bash
pnpm business-mode:e2e
```

Files:

```txt
playwright.business-mode.config.mjs
tests/business-mode/business-mode-switch.spec.ts
scripts/business-mode-e2e.mjs
```

The runner intentionally fails with an install hint when `@playwright/test` is not installed. The dependency is optional so normal source checks and Restaurant checks stay lightweight.

Install only when browser E2E is needed:

```bash
pnpm add -D @playwright/test playwright
pnpm exec playwright install chromium
```

## Implemented in this phase

```txt
BM-1 - Docs and role model reconciliation                          Done
BM-2 - Centralized transition service                              Done
BM-2B - Route separation and shared cache reset guard               Done
BM-3 - Sidebar/module filtering hardening                          Done
BM-4 - Select-mode next-route flow                                  Done
BM-5 - Business-mode smoke checklist/script                         Done
BM-6 - Optional browser switch-flow smoke                           Done
BM-7 - Browser E2E dependency/config hardening                      Done
BM-8 - Shared dashboard mode-context data contract                  Next
```

## Manual smoke

```txt
1. Clear currentBusinessMode and open /dashboard -> /select-mode?next=/dashboard.
2. Select restaurant -> continues to /dashboard if route is compatible, otherwise restaurant entry route.
3. With retail active, open /workspace/restaurant/pos -> /select-mode?next=/workspace/restaurant/pos.
4. Select restaurant -> continues to /workspace/restaurant/pos.
5. With restaurant active, open /v3/retail/cashier -> /select-mode?next=/v3/retail/cashier.
6. Select retail -> continues to /v3/retail/cashier.
7. Switch modes from the sidebar/topbar switcher and confirm shared dashboard data refetches under the new mode context.
```
