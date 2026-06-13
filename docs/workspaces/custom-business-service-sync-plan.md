# Custom Business Service Sync Plan

This plan is for syncing branch `workspace/business-mode-service` with the latest `main` after the frontend-only Service / Custom Business workspace exploration.

The goal is to reduce merge risk without accidentally activating Service mode, touching Prisma, or changing restaurant workflow behavior.

## Current scope

The branch contains frontend-only service workspace preparation:

- business mode service helper
- custom business service workspace route constant
- service workspace mock UI
- service job list and detail panel
- status transition preview
- transition requirement preview
- typed API placeholder
- docs and test plan

## Non-negotiable constraints

Do not change:

```txt
active Prisma schema
restaurant workspace logic
restaurant route behavior
mode selector activation rules
backend route files
production mutation paths
general naming work being handled elsewhere
```

Do not make `custom-business` selectable yet.

Do not wire Service mode to real data yet.

## Preferred sync strategy

Prefer merging latest `main` into this branch instead of rebasing.

Reason:

- The branch already has many small exploratory commits.
- A merge avoids force-push risk.
- It keeps conflict resolution easier to audit.

Use rebase only if the repository owner explicitly wants a linear history and is ready to force-push.

## Local command sequence

Run from repo root:

```bash
git fetch origin
git checkout workspace/business-mode-service
git status
git merge origin/main
```

If conflicts appear, resolve them with the conflict rules below.

After resolving conflicts:

```bash
git add .
git commit
pnpm install
pnpm run typecheck
pnpm --filter @workspace/pos-system run build
```

If build/typecheck fails, fix real issues. Do not use temporary bypasses such as:

```txt
any
// @ts-ignore
commenting out imports
removing validation
activating service mode just to make a route visible
```

## Conflict rules

### Restaurant files

If conflict touches restaurant files:

1. Prefer `main` unless the conflict is only caused by shared imports or route wiring.
2. Do not rewrite restaurant logic.
3. Do not change restaurant status flow.
4. Do not move restaurant modules.

### Prisma files

If conflict touches Prisma schema or migrations:

1. Prefer `main`.
2. Do not add service tables yet.
3. Do not add service enums yet.
4. Keep service data mocked until schema phase begins.

### Business mode registry / selector

Keep Service / Custom Business locked.

Allowed:

- preserving business mode service helper exports
- preserving route constants
- preserving docs

Not allowed:

- changing `custom-business` to selectable
- changing default mode away from restaurant
- bypassing mode guard

### App route patch

The service workspace route may still need manual patching.

Patch file:

```txt
docs/patches/app-custom-business-service-route.patch
```

Expected route:

```tsx
<Route path={ROUTES.WORKSPACE_CUSTOM_BUSINESS_SERVICE}>
  <ModeProtectedRoute requiredMode="custom-business">
    <CustomBusinessServiceWorkspace />
  </ModeProtectedRoute>
</Route>
```

Keep `requiredMode="custom-business"`.

## Validation after sync

Run:

```bash
pnpm run typecheck
pnpm --filter @workspace/pos-system run build
```

Then run the manual test plan:

```txt
docs/workspaces/custom-business-service-test-plan.md
```

Minimum expected result:

- existing restaurant/default flow still works
- mode selector still keeps Service / Custom Business locked
- service workspace route compiles after manual route patch
- search/filter UI still works
- selected job detail still works
- action rail still disabled
- transition requirements still display
- API placeholders still throw and are not called by UI

## PR readiness checklist

Before opening PR:

- branch synced with latest main
- manual route patch applied or explicitly documented as pending
- typecheck passes
- POS package build passes
- test plan completed
- changed files reviewed for scope safety
- no Prisma changes
- no restaurant behavior changes
- no service mode activation

## If sync becomes too messy

If merge conflicts spread into unrelated restaurant or shared architecture files:

1. Stop resolving broad conflicts manually.
2. Create a fresh branch from latest `main`.
3. Cherry-pick only service workspace commits or manually port the service folder and docs.
4. Keep the old branch as reference.

This is slower, but still cheaper than merging accidental architecture damage and pretending it is progress.
