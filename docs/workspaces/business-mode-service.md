# Business Mode Service Workspace

## Goal

Create a single frontend service layer for business-mode selection, storage repair, route resolution, and workspace access checks.

The current project already has separate files for business-mode types, registry, storage, selector UI, switcher UI, route guard, and sidebar runtime filtering. This workspace exists to make that behavior easier to maintain before adding deeper mode-specific modules.

## Current baseline

Repository branch:

```txt
workspace/business-mode-service
```

Primary files inspected:

```txt
artifacts/pos-system/src/components/core/business-mode/business-mode.types.ts
artifacts/pos-system/src/components/core/business-mode/business-mode-registry.ts
artifacts/pos-system/src/components/core/business-mode/business-mode-storage.ts
artifacts/pos-system/src/components/core/business-mode/business-mode-switcher.tsx
artifacts/pos-system/src/components/core/mode-selector/mode-selector.tsx
artifacts/pos-system/src/components/core/route-guard/business-mode.ts
artifacts/pos-system/src/components/core/route-guard/route-guard.tsx
artifacts/pos-system/src/components/core/sidebar/sidebar.tsx
artifacts/pos-system/src/app/registry/module-types.ts
artifacts/pos-system/src/app/registry/sidebar-registry.ts
artifacts/pos-system/src/app/registry/module-registry.ts
artifacts/pos-system/src/app/registry/restaurant-modules.ts
artifacts/pos-system/src/constants/routes.ts
artifacts/pos-system/src/App.tsx
```

## New service file

Created:

```txt
artifacts/pos-system/src/components/core/business-mode/business-mode-service.ts
```

The service provides:

- selectable mode list
- planned mode list
- locked mode list
- entry route resolver
- access check helper
- workspace state helper
- storage repair helper
- workspace selection helper
- service object export for easier future imports

## Important constraints

Do not activate planned modes yet.

Currently selectable:

```txt
restaurant
```

Currently planned / locked:

```txt
retail
raw-material
custom-business
```

The planned modes must stay visible for roadmap clarity, but they must not become operational until their own workflow, routes, permissions, and data model are implemented.

## Recommended next patch

Update this barrel file:

```txt
artifacts/pos-system/src/components/core/business-mode/index.ts
```

Suggested export block:

```ts
export {
  businessModeService,
  canEnterBusinessModeWorkspace,
  ensureBusinessModeWorkspace,
  getBusinessModeEntryRoute,
  getBusinessModeWorkspaceState,
  getLockedBusinessModes,
  getPlannedBusinessModes,
  getSelectableBusinessModes,
  selectBusinessModeWorkspace,
} from "./business-mode-service";

export type {
  BusinessModeAccessCheck,
  BusinessModeSelectResult,
  BusinessModeWorkspaceState,
} from "./business-mode-service";
```

I attempted to patch the barrel automatically, but the GitHub update tool was blocked. Apply this manually or through Codex.

## Acceptance checklist

Run from repo root:

```bash
pnpm install
pnpm run typecheck
pnpm --filter @workspace/pos-system run build
```

Expected behavior:

- `/select-mode` still loads.
- Restaurant / F&B can still enter `/workspace/restaurant/pos`.
- Retail, Raw Material, and Custom Business remain locked.
- Sidebar still filters by current runtime mode.
- Legacy values like `fnb`, `service`, and `warehouse` still repair into the new IDs.
- No planned mode should become clickable just because a service helper exists.

## Refactor order after this workspace

1. Export the service from `business-mode/index.ts`.
2. Replace duplicate mode helpers in `mode-selector`, `business-mode-switcher`, `route-guard`, and `App.tsx` with service calls.
3. Keep storage behavior backward-compatible.
4. Keep route constants as the single route source of truth.
5. Only after typecheck passes, consider moving business mode logic out of `components/core` into a more neutral folder such as `app/services/business-mode`.

## Do not do yet

- Do not enable retail mode.
- Do not enable raw-material mode.
- Do not enable custom-business mode.
- Do not create placeholder pages that pretend planned modules are ready.
- Do not change backend permission rules based only on localStorage.
- Do not rename `currentBusinessMode` without a migration path.
