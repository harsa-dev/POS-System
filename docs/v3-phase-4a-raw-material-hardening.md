# POS System V3 Phase 4A Raw Material Hardening

## Scope

Phase 4A focused on Raw Material mode and the shared dashboard infrastructure required for Raw Material to behave like an active V3 business mode.

No Restaurant, Retail, database schema, or Service/Custom Business feature expansion was intentionally added in this phase.

## Audit Summary

- Raw Material has active frontend routes under `/v3/raw-material/*`.
- The active Raw Material route component still used placeholder naming.
- Raw Material API routes are already mounted separately and guarded with `requireBusinessMode(["raw-material"])`.
- Raw Material write/read routes already use Raw Material permission checks before service calls.
- Shared dashboard mode context marked several HR/platform-style dashboards as Raw Material-supported even when no Raw Material bridge existed.
- The Raw Material shared dashboard bridge existed but was only wired manually around Cashflow.
- Raw Material runtime UI still exposed `dummy`, `mock`, and placeholder-style wording in several active surfaces.

## Changes Made

- Renamed the active Raw Material workspace entry file from `raw-material-placeholder-workspace.tsx` to `raw-material-workspace.tsx`.
- Renamed the active workspace component from `RawMaterialPlaceholderWorkspace` to `RawMaterialWorkspace`.
- Updated `App.tsx` Raw Material routes to import the canonical workspace file.
- Replaced Raw Material scale status `new-dummy` with `planning-preview`.
- Replaced Raw Material scale field `dummyMetric` with `previewMetric`.
- Replaced user-facing Raw Material bridge/workspace wording from mock/dummy language to sample/preview language.
- Removed an unprofessional transfer-preview message fragment from the active workspace.
- Centralized Raw Material shared-dashboard wrapping in `DashboardShell`.
- Removed the one-off Raw Material wrapper from Cashflow workspace now that the shell handles Raw Material bridges.
- Restricted Raw Material shared-dashboard support for unsupported HR/platform surfaces such as roster overview, audit log, contracts, attendance, payroll, and platform monitoring.
- Kept Custom Business / Service preview behavior intact by not blocking service preview bridges with generic mode unavailable handling.

## Shared Dashboard Behavior

Raw Material now receives bridge context for:

- Business overview
- Sales analytics as operational analytics
- Customers/partners as suppliers/partners
- Inventory as batch/storage/FEFO context
- Cashflow as procurement preview context
- Financial reports as cost/yield context
- Invoice generator as supplier receiving/invoice-hold context
- Cashier/operation shift reports as receiving/weighing/operator context
- Team management as responsibility context
- Employee performance as operational performance context
- Approvals as quality/factory/kandang review context
- HPP as projected material-cost context

Unsupported shared surfaces now show the mode-unavailable message instead of rendering an unrelated base dashboard for Raw Material.

## Backend Notes

No backend code change was required in this phase.

Raw Material route files already apply:

- `router.use("/raw-material", requireBusinessMode(["raw-material"]))`
- Raw Material permission checks through `requireRawMaterialPermission`
- Business context ownership boundaries through the existing backend context flow

## Files Moved

- `artifacts/pos-system/src/app/workspace/raw-material/raw-material-placeholder-workspace.tsx`
- `artifacts/pos-system/src/app/workspace/raw-material/raw-material-workspace.tsx`

## Verification

Passed:

- `.\node_modules\.bin\tsc.CMD -p artifacts\pos-system\tsconfig.raw-material.json --noEmit`
- `.\node_modules\.bin\tsc.CMD -p artifacts\pos-system\tsconfig.service.json --noEmit`
- `.\node_modules\.bin\tsc.CMD -p artifacts\pos-system\tsconfig.restaurant.json --noEmit`
- `.\node_modules\.bin\tsc.CMD -p artifacts\pos-system\tsconfig.retail.json --noEmit`
- `.\artifacts\api-server\node_modules\.bin\tsc.CMD -p artifacts\api-server\tsconfig.json --noEmit`
- `.\node_modules\.bin\vite.CMD build --config vite.config.ts` from `artifacts/pos-system`
- `git diff --check`

Timed out before diagnostics when run in parallel:

- Raw Material frontend TypeScript, Service frontend TypeScript, and backend TypeScript were first attempted together. They were rerun individually and passed.
- Full frontend TypeScript with `.\node_modules\.bin\tsc.CMD -p artifacts\pos-system\tsconfig.json --noEmit` timed out without diagnostics.

Blocked by local environment permission error:

- `pnpm --filter @workspace/pos-system run typecheck:raw-material`
- `pnpm --filter @workspace/pos-system run build`
- `pnpm raw-material:check`

The blocked `pnpm` commands failed with `EPERM: operation not permitted, lstat 'C:\Users\LENOVO'`.

Build warnings:

- Vite build completed successfully and emitted existing sourcemap location warnings for multiple source files.

## Manual QA Checklist

- Open `/select-mode` and select Raw Material.
- Open each `/v3/raw-material/*` module route.
- Refresh a Raw Material module route and confirm the selected mode remains Raw Material.
- Confirm active Raw Material pages no longer load from a placeholder-named file.
- Open shared overview, inventory, cashflow, financial reports, invoice, shift reports, team management, employee performance, approvals, and HPP while Raw Material is active.
- Confirm those supported shared dashboards show Raw Material bridge context.
- Open roster overview, audit log, contracts, attendance, payroll, and platform monitoring while Raw Material is active.
- Confirm unsupported dashboards show the mode-unavailable state instead of unrelated base content.
- Confirm Custom Business / Service planned preview still shows planned/guarded behavior.

## Remaining Risks

- Raw Material still uses sample/mock data services for some preview surfaces until full persistence is implemented.
- Browser QA was not completed in this pass.
- The in-app Browser runtime could not start because its Node helper failed with `CreateProcessAsUserW failed: 5`.
- A local preview server attempt exited before accepting connections, so HTTP smoke checks could not be completed.
- Full `pnpm` scoped commands may still hit the existing local permission issue observed in earlier phases.

## Next Recommended Task

Phase 4B should focus on Raw Material persistence completion for preview-only shared surfaces, especially procurement cashflow, supplier invoice hold, HPP costing, and workflow write delegates.
