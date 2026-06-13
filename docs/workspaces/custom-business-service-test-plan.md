# Custom Business Service Workspace Test Plan

This is a manual test plan for the current frontend-only Service / Custom Business workspace.

No backend route, Prisma schema, or production mutation is expected in this phase.

## Preconditions

Branch:

```txt
workspace/business-mode-service
```

Manual route patch must be applied first:

```txt
docs/patches/app-custom-business-service-route.patch
```

Expected route:

```txt
/workspace/custom-business/service
```

Expected route guard:

```txt
requiredMode="custom-business"
```

## Build checks

Run from repo root:

```bash
pnpm install
pnpm run typecheck
pnpm --filter @workspace/pos-system run build
```

Expected:

- TypeScript passes.
- The POS system package builds.
- Service workspace files compile.
- The mode selector still keeps Custom Business / Service locked.

## Search and filter checks

### Search by request code

Input:

```txt
SRV-2026-0001
```

Expected:

- Only matching service job appears.
- Counter shows filtered result count.
- Selected detail panel updates to the visible job.

### Search by customer

Input:

```txt
Kopi
```

Expected:

- Jobs with matching customer name appear.
- Empty state does not show if a match exists.

### Search with no result

Input:

```txt
this-should-not-match-anything
```

Expected:

- Empty state appears.
- Reset filters button is visible.
- Reset filters restores mocked jobs.

### Status filter

Select one available status.

Expected:

- Only jobs with that status appear.
- Selected job detail follows the filtered list.

### Priority filter

Select one available priority.

Expected:

- Only jobs with that priority appear.
- Counter updates.

## Tab checks

### Overview tab

Expected visible sections:

- metric cards
- workspace control center
- service workflow blueprint
- job list and selected detail
- pricing/modules panel
- config/readiness panel

### Jobs tab

Expected visible sections:

- metric cards
- workspace control center
- job list and selected detail

Expected hidden sections:

- workflow blueprint
- pricing/modules panel
- config/readiness panel

### Quotations tab

Expected:

- quotation placeholder appears
- no mutation form submits

### Invoices tab

Expected:

- invoice placeholder appears
- no mutation form submits

### Config tab

Expected:

- config/readiness panel appears
- job list is hidden

## Selected job checks

1. Click `View detail` on a job card.
2. Confirm selected card has selected styling.
3. Confirm detail panel updates to that job.
4. Close detail panel.
5. Confirm list still remains visible.

## Action rail checks

For a selected job:

- Action rail appears in the detail panel.
- Next action is based on current service status.
- Action button is disabled.
- Required permission is shown.
- Disabled reason is shown.
- Requirement count appears as `X/Y met`.
- Missing requirements show missing reason.

## Transition requirement examples

Expected preview rules:

- Draft quotation requires cost lines and billable costs.
- Start service work requires customer-approved quotation.
- Issue invoice requires delivered service and approved quote.
- Record payment requires issued invoice and paid amount.
- Close service job requires full collection.

These are frontend preview rules only. Backend validation must still enforce the final rules later.

## API placeholder checks

File:

```txt
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-api.ts
```

Expected:

- All API functions have typed signatures.
- All API functions throw `not implemented`.
- UI does not call these functions yet.

## Scope safety checks

Confirm this phase does not change:

- active Prisma schema
- restaurant workspace files
- mode selector activation rules
- backend routes
- production mutation paths

## Known limitation

The branch is diverged from main. Before opening or merging a real PR, sync the branch with latest main and rerun this test plan.
