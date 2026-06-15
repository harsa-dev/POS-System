# V3 Phase 5A Restaurant Hardening

## Status

Phase 5A keeps the project in the canonical V3 architecture:

- `restaurant` is the only canonical Restaurant mode ID.
- `Restaurant` is the user-facing label.
- Active Restaurant workspaces live under `artifacts/pos-system/src/app/workspace/restaurant`.
- Active Restaurant feature code lives under `artifacts/pos-system/src/features/restaurant`.
- `custom-business` remains planned and guarded.

## Implemented In This Pass

- Restaurant shared dashboards now use a dedicated Restaurant bridge in `artifacts/pos-system/src/features/shared/restaurant-bridge`.
- Shared dashboard shell wiring maps Restaurant dashboard surfaces to the existing backend `/api/restaurant/shared-dashboard/:dashboardId` contract.
- Generic shared dashboard content is hidden for bridged Restaurant surfaces so active Restaurant mode does not display generic data as Restaurant truth.
- Restaurant POS fallback data was renamed from `pos-placeholder-data.ts` to `pos-sample-data.ts`.
- Active Restaurant workspace copy no longer describes current wired UI states as placeholders.

## Shared Dashboard Contract

The frontend bridge consumes the existing Restaurant API DTOs from `artifacts/pos-system/src/lib/api/restaurant-api.ts`.

Supported Restaurant shared dashboard IDs:

- `overview`
- `sales`
- `customers`
- `inventory`
- `cashflow`
- `financial-reports`
- `invoice-generator`
- `shift-reports`
- `team-management`
- `employee-performance`
- `approvals`
- `audit-controls`
- `roster-overview`
- `employee-attendance`
- `employee-contracts`
- `payroll`

The backend remains the source of truth for which rows are active operational signals and which rows are intentionally planned or skipped.

## Planned Surfaces

Restaurant HR-heavy surfaces such as attendance, contracts, payroll, roster, and employee performance remain planned/skipped unless backed by Restaurant requirements. The bridge renders backend planned/skipped context instead of generic HR dashboard assumptions.

## Verification Notes

Run after Phase 5A changes:

```bash
pnpm --filter @workspace/pos-system run typecheck:restaurant
pnpm restaurant:check
pnpm business-mode:check
pnpm --filter @workspace/pos-system run build
```

If pnpm is blocked by the local Windows environment, use the repository-local TypeScript checks as supplemental verification and report the original pnpm failure.
