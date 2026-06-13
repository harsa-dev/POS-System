# Codex Prompt: Sync Custom Business Service Workspace

Use this prompt in Codex when syncing `workspace/business-mode-service` with latest `main`.

```md
You are working in repository `harsa-dev/POS-System`.

Branch:
`workspace/business-mode-service`

Goal:
Sync this branch with latest `main`, preserve the frontend-only Service / Custom Business workspace work, apply the service route patch if still needed, then run validation.

Hard constraints:
- Do not modify active Prisma schema.
- Do not add service Prisma models yet.
- Do not add migrations.
- Do not touch restaurant workflow logic unless a merge conflict requires preserving latest `main` behavior.
- Do not change restaurant status flow.
- Do not make `custom-business` selectable.
- Do not bypass mode guards.
- Do not create backend route implementations.
- Do not turn mocked service data into fake production data.
- Do not use `any`, `// @ts-ignore`, commented-out imports, or temporary hacks to pass typecheck.
- Do not rename general business-mode concepts. Another agent is handling naming.

Important files to preserve:
- `artifacts/pos-system/src/app/workspace/custom-business/custom-business-service-workspace.tsx`
- `artifacts/pos-system/src/app/workspace/custom-business/service/**`
- `artifacts/pos-system/src/components/core/business-mode/business-mode-service.ts`
- `artifacts/pos-system/src/components/core/business-mode/index.ts`
- `artifacts/pos-system/src/constants/routes.ts`
- `docs/patches/app-custom-business-service-route.patch`
- `docs/workspaces/business-mode-service.md`
- `docs/workspaces/custom-business-service-workspace.md`
- `docs/workspaces/custom-business-service-data-plan.md`
- `docs/workspaces/custom-business-service-api-contract.md`
- `docs/workspaces/custom-business-service-test-plan.md`
- `docs/workspaces/custom-business-service-sync-plan.md`

Step 1: inspect branch state
Run:

```bash
git fetch origin
git checkout workspace/business-mode-service
git status
git log --oneline --decorate -n 10
git diff --name-only origin/main...HEAD
```

Step 2: sync with main
Prefer merge, not rebase:

```bash
git merge origin/main
```

If conflicts occur:
- For restaurant files: prefer `main` unless the conflict is only shared import/route wiring.
- For Prisma files: prefer `main`; do not add service schema yet.
- For mode selector/registry: keep `custom-business` locked.
- For route constants: preserve `WORKSPACE_CUSTOM_BUSINESS_SERVICE`.
- For service workspace files under `custom-business/service`: preserve this branch unless main has a direct compatible improvement.
- For docs: preserve service docs and update if needed.

Step 3: apply App route patch if needed
Check whether the App route already imports and renders the service workspace.

Expected lazy import:

```ts
const CustomBusinessServiceWorkspace = lazy(
  () => import("@/app/workspace/custom-business/custom-business-service-workspace"),
);
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

If route is missing, apply the patch from:

```txt
docs/patches/app-custom-business-service-route.patch
```

Step 4: run validation
Run:

```bash
pnpm install
pnpm run typecheck
pnpm --filter @workspace/pos-system run build
```

Step 5: fix real errors only
If typecheck/build fails:
- Fix the real TypeScript issue.
- Keep Service mode mocked.
- Keep action rail disabled.
- Keep API placeholders throwing `not implemented`.
- Keep Service / Custom Business locked.

Do not silence errors with temporary type bypasses.

Step 6: run manual review
Use:

```txt
docs/workspaces/custom-business-service-test-plan.md
```

Verify:
- search/filter behavior
- tab behavior
- selected job detail panel
- disabled action rail
- transition requirement preview
- API placeholders are typed and not called by UI
- route remains protected by `custom-business`
- mode selector still locks Service / Custom Business

Expected final output:
- synced branch
- no Prisma changes
- no restaurant behavior changes
- typecheck result
- build result
- list of conflicts resolved, if any
- list of files changed during sync
```

## Notes for reviewer

If conflicts become broad and risky, stop and create a fresh branch from latest `main`, then port only the scoped service files and docs. A clean port is better than a heroic merge that quietly damages the app.
