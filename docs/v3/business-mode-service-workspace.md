# Business Mode Service Workspace

## Goal

Prepare a small service layer that becomes the single orchestration point for business mode behavior.

This keeps UI components from directly combining registry lookup, localStorage repair, route resolution, and mode activation rules in multiple places.

## Current Context

The project already has a business mode foundation:

- `business-mode.types.ts` owns mode IDs, storage key, event name, config types, and change event payloads.
- `business-mode-registry.ts` owns the available/planned mode registry and default mode.
- `business-mode-storage.ts` owns localStorage read/write/repair and change subscriptions.
- `business-mode-switcher.tsx`, `mode-selector.tsx`, and `route-guard.tsx` currently compose those utilities directly.

The API server also has a backend business context layer under:

```txt
artifacts/api-server/src/lib/business-context
```

That backend layer validates requested business mode headers and guards restaurant-only routes. Keep frontend workspace selection and backend authorization separate.

## New Workspace File

```txt
artifacts/pos-system/src/components/core/business-mode/business-mode-service.ts
```

The service exports `businessModeService`, which groups:

- registry access
- selectable/planned mode queries
- mode ID normalization
- route lookup
- localStorage state read/repair
- mode activation
- subscription handling

## Intended Usage

Prefer this import for new business-mode-aware frontend code:

```ts
import { businessModeService } from "@/components/core/business-mode";
```

Example:

```ts
const workspace = businessModeService.getWorkspaceState();

if (workspace.shouldSelectMode) {
  // redirect user to select-mode
}
```

Example activation:

```ts
const result = businessModeService.activateMode("restaurant", "select-mode");

if (result.success) {
  // navigate to result.route
}
```

## Migration Rule

Do not delete the existing registry/storage utilities yet.

Migration should be gradual:

1. New code uses `businessModeService`.
2. Refactor `BusinessModeSwitcher` to use the service.
3. Refactor `ModeSelector` to use the service.
4. Refactor `RouteGuard` to use the service.
5. Keep type exports stable from `index.ts`.
6. Only remove direct utility exports after all imports are migrated and typecheck passes.

## Guardrails

- `restaurant` remains the only selectable frontend mode for now.
- Planned modes must stay visible but locked.
- Frontend business mode is a workspace preference, not backend authorization.
- Backend role permission, tenant ownership, and business context middleware remain the source of truth for protected operations.
- Do not reuse Restaurant/F&B workflows for retail/raw-material/service modes until each has its own real workflow.

## Next Refactor Target

Start with `business-mode-switcher.tsx` because it already handles mode activation and route navigation.

Then migrate `mode-selector.tsx`, then `route-guard.tsx`.
