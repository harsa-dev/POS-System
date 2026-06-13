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

## Preview modal checks

### New request preview

1. Click `Request preview`.
2. Confirm modal opens.
3. Edit customer, segment, category, title, priority, and summary fields.
4. Confirm payload preview updates locally.
5. Confirm submit button is disabled.
6. Confirm modal activity preview is visible.
7. Close the modal.

Expected:

- no API call runs
- no job is added to the list
- no data persists after closing
- activity events are display-only

### Draft quotation preview

1. Select a job.
2. Click `Quote preview`.
3. Confirm modal opens with selected job context.
4. Edit discount, tax rate, and target margin fields.
5. Confirm payload preview updates locally.
6. Confirm submit button is disabled.
7. Confirm modal activity preview references selected job context.
8. Close the modal.

Expected:

- no API call runs
- selected job data is not mutated
- no quotation is created
- activity events are display-only

## Service insight checks

For a selected job detail panel:

- Service insight preview appears below costing and action rail.
- Readiness score is visible.
- Risk score is visible.
- Next action requirement score is visible.
- Collection score is visible.
- Signal list is visible.
- Positive, warning, or critical signals appear based on mock job state.
- Scores change when selecting jobs with different status, priority, quote, or invoice state.
- Insight preview does not persist data.
- Insight preview does not call API functions.

Expected preview behavior:

- urgent or high priority creates risk signals
- missing cost or missing quote creates warning signals
- negative or low gross profit creates risk signals
- incomplete collection creates warning signals in billing/closing phases
- completed next action requirements create readiness signal

## Activity preview checks

For a selected job detail panel:

- Activity preview appears below execution checklist.
- Event count is visible.
- Timeline events from the selected job appear.
- System preview events appear for status and priority.
- Next-action preview events appear when the status has a next transition.
- Activity preview does not persist data.
- Activity preview does not call API functions.

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
