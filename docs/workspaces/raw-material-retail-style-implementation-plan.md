# Raw Material Retail-Style Implementation Plan

This document maps Raw Material work into the same implementation format used by Retail.

It does not replace the original Raw Material phase plan. It is the forward execution plan after Raw Material phase 0-9 was completed.

## Current validation baseline

Raw Material phase 0-9 is implemented.

Known completed capabilities:

```txt
persistence foundation
backend routes
permission hardening
workflow guards
domain invariants
service layer cleanup
audit integration
shared dashboard summary
raw-material typecheck cleanup
stock mutation hardening
frontend summary API sync with mock fallback
```

## Retail-style Raw Material phases

```txt
Phase 1  - Raw Material persistence foundation                Done
Phase 2  - Backend route, guard, workflow preview             Done
Phase 3  - Shared dashboard backend summary                   Done
Phase 4  - Seed supplier/storage/intake/batch/kandang         Done
Phase 5  - Frontend list/workflow API wiring                  Planned
Phase 6  - Raw Material OpenAPI/client coverage               Planned
Phase 7A - Prisma schema model mapping                        Done
Phase 7B - Summary read delegate                              Done
Phase 7C - Workflow read delegate                             Planned
Phase 7D - Intake/batch/processing preview delegate           Planned
Phase 7E - Stock/write delegate                               Backend Done, Frontend Planned
Phase 7F - Guarded workflow status delegate                   Backend Partial, Frontend Planned
Phase 8A - Intake/processing/batch status API route           Planned
Phase 8B - Status frontend action                             Planned
Phase 8C - Stock adjustment reversal workflow                 Planned
Phase 8D - Processing cancellation reversal workflow          Planned
Phase 8E - Generated API client consolidation                 Planned
Phase 8F - Raw Material smoke test + scoped CI gate           Planned
Phase 8G - Migration baseline/idempotency hardening           Planned
Phase 8H - Audit + permission policy hardening                Mostly Done, needs smoke/policy assertion
```

## Phase 4 - Seed supplier/storage/intake/batch/kandang

Status: implemented.

Implemented files:

```txt
artifacts/api-server/scripts/seed-raw-material-demo-data.ts
artifacts/api-server/package.json
docs/workspaces/raw-material-seed-demo-data.md
```

Command:

```bash
pnpm --filter @workspace/api-server run raw-material:seed
```

Seeded demo data per active Raw Material business:

```txt
3 suppliers
3 storage locations
3 intakes
3 weighings
3 batches
1 planned processing run
2 kandang pens
3 initial receiving stock movements
```

The seed script is idempotent and scoped to:

```txt
Business.mode = RAW_MATERIAL
Business.isActive = true
```

## Recommended next execution order

Preferred path:

```txt
Phase 8F - Raw Material smoke test + scoped CI gate
Phase 7C - Workflow read delegate
Phase 5  - Frontend list/workflow API wiring
Phase 6  - Raw Material OpenAPI/client coverage
Phase 7D - Intake/batch/processing preview delegate
Phase 7E - Stock/write delegate frontend wiring
Phase 7F - Guarded workflow status delegate
Phase 8A - Status API route
Phase 8B - Status frontend action
Phase 8C - Stock adjustment reversal workflow
Phase 8D - Processing cancellation reversal workflow
Phase 8G - Migration baseline/idempotency hardening
Phase 8H - Audit + permission smoke/policy assertion
```

## Why Phase 8F should come next

Now that seed data exists, a scoped Raw Material validation gate can verify the lane without depending on global non-Raw-Material typecheck cleanup.

The Retail lane already has a scoped gate pattern.

Raw Material should get the same pattern:

```txt
raw-material:check
raw-material:smoke
optional raw-material DB baseline check later
```

## Non-goals

```txt
Do not fix global non-Raw-Material typecheck errors here.
Do not redesign Raw Material schema.
Do not remove mock fallback.
Do not enable unsafe write buttons without preview/confirmation.
Do not merge Raw Material stock with restaurant inventory stock.
```
