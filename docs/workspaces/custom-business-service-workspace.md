# Custom Business Service Workspace

## Purpose

This workspace defines the frontend blueprint for the future Service / Custom Business mode.

The Service / Custom Business mode must not copy other operational workflows. Service businesses need request intake, job planning, costing, quotation, invoice, collection, checklist, timeline, and delivery evidence.

## Scope

Created files:

```txt
artifacts/pos-system/src/app/workspace/custom-business/custom-business-service-workspace.tsx
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-workspace-layout.tsx
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-workspace-ui.tsx
artifacts/pos-system/src/app/workspace/custom-business/service/use-service-business-workspace.ts
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-workspace-header.tsx
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-workspace-view-types.ts
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-empty-state.tsx
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-placeholder-panel.tsx
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-preview-modal.tsx
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-activity-preview.ts
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-activity-feed.tsx
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-api.ts
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-api-contract-types.ts
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-view-model.ts
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-status-transitions.ts
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-transition-requirements.ts
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-action-rail.tsx
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-job-detail-panel.tsx
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-metric-cards.tsx
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-workflow-pipeline.tsx
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-job-list.tsx
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-job-card.tsx
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-pricing-modules-panel.tsx
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-config-readiness-panel.tsx
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-workspace-types.ts
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-workspace-data.ts
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-workspace-domain.ts
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-permissions.ts
docs/workspaces/custom-business-service-data-plan.md
docs/workspaces/custom-business-service-api-contract.md
docs/workspaces/custom-business-service-test-plan.md
docs/workspaces/custom-business-service-sync-plan.md
docs/workspaces/custom-business-service-codex-sync-prompt.md
```

Updated route constants:

```txt
artifacts/pos-system/src/constants/routes.ts
```

Added route:

```ts
WORKSPACE_CUSTOM_BUSINESS_SERVICE: "/workspace/custom-business/service"
```

## Current behavior

The workspace is a static planning / review UI. It intentionally does not call API endpoints and does not mutate data.

This is correct for now because the backend does not yet have service-specific entities such as:

- service request
- service job
- quotation
- job costing
- service delivery proof
- service invoice linkage
- service-specific status transition
- audit log / activity stream persistence

## Current frontend preview

The workspace now contains hard-coded examples for:

- metric cards
- service workflow pipeline
- service job cards
- selected service job detail panel
- disabled status action rail
- local-only request preview modal
- local-only quotation preview modal
- service activity / audit preview feed
- status transition map draft
- transition requirement preview
- cost line breakdown
- quotation subtotal, discount, tax, total, and gross profit preview
- invoice collection progress
- checklist
- timeline
- configuration draft
- permission map draft
- typed API contract draft
- test plan draft
- sync plan draft
- Codex sync prompt
- search and filter controls
- tabbed read-only sections
- empty state
- API placeholder that throws until backend exists

This is not production data. It is intentionally a shape preview so the UI, workflow, and future schema direction are easier to reason about.

## Component split

The main layout is now only a composition layer:

```txt
ServiceBusinessWorkspaceLayout
├── useServiceBusinessWorkspace
├── ServiceBusinessMetricCards
├── ServiceBusinessWorkspaceHeader
├── ServiceBusinessWorkflowPipeline
├── ServiceBusinessJobList
│   └── ServiceBusinessJobCard
├── ServiceBusinessJobDetailPanel
│   ├── ServiceBusinessActionRail
│   └── ServiceBusinessActivityFeed
├── ServiceBusinessPlaceholderPanel
├── ServiceBusinessPricingModulesPanel
├── ServiceBusinessConfigReadinessPanel
└── ServiceBusinessPreviewModal
    └── ServiceBusinessActivityFeed
```

This keeps future API migration focused in `use-service-business-workspace.ts` instead of forcing a rewrite of the whole layout.

## Mock interactions

Current mock interactions:

- search by request code, title, customer, customer segment, category, or assignee
- filter by service status
- filter by priority
- reset filters
- tab switch between overview, jobs, quotations, invoices, and config
- select a service job
- show selected job detail panel
- close selected job detail panel
- preview next status actions based on the selected job status
- preview transition requirements for each next action
- preview service job activity events
- open request preview modal
- open quotation preview modal
- edit local-only preview fields
- preview modal activity events
- disabled action rail buttons for future status changes
- disabled modal submit buttons for future mutations

## Local preview modal

The file below contains local-only preview forms:

```txt
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-preview-modal.tsx
```

Current previews:

- new request payload preview
- draft quotation payload preview based on selected job context
- local modal activity events that describe future audit entries

These previews do not call API functions, do not mutate mock jobs, and do not persist data after closing.

## Activity preview

The files below contain the frontend-only activity / audit trail preview:

```txt
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-activity-preview.ts
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-activity-feed.tsx
```

The activity feed combines:

- timeline events from the selected mock job
- system preview events for current status and priority
- next-action preview events from the action rail
- modal preview events for request and quotation draft forms

These are display-only events. They are not audit logs and should not be treated as persisted records until backend support exists.

## View model adapter

The file below maps raw mock job data into display-ready values:

```txt
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-view-model.ts
```

Later backend responses should be normalized through this kind of boundary before reaching UI components.

## Status transition map

The file below contains the frontend-only transition preview:

```txt
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-status-transitions.ts
```

Current mock transition path:

```txt
REQUEST_INTAKE -> JOB_PLANNING -> QUOTATION_DRAFT -> QUOTATION_APPROVED -> IN_PROGRESS -> READY_FOR_REVIEW -> DELIVERED -> INVOICED -> PAID -> CLOSED
```

The frontend transition map is not the backend source of truth. The backend must validate transitions later.

## Transition requirements preview

The file below contains frontend-only requirement checks for each transition:

```txt
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-transition-requirements.ts
```

Examples:

- drafting quotation requires cost lines and billable costs
- starting work requires approved quotation
- issuing invoice requires delivered service and approved quote
- recording payment requires issued invoice and paid amount
- closing job requires full collection

These checks are UI preview only. Backend validation must still enforce the real rules later.

## API placeholder and contract types

The files below exist only as future API seams:

```txt
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-api.ts
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-api-contract-types.ts
```

Every API function intentionally throws `not implemented` because backend routes are not ready yet. The signatures are typed so the future backend contract has a target shape.

## Test plan

Manual test plan:

```txt
docs/workspaces/custom-business-service-test-plan.md
```

The test plan covers:

- build checks
- search and filter behavior
- tab behavior
- selected job detail behavior
- preview modal behavior
- activity preview behavior
- action rail behavior
- transition requirement preview
- API placeholder behavior
- scope safety checks

## Sync plan and Codex prompt

Sync plan:

```txt
docs/workspaces/custom-business-service-sync-plan.md
```

Codex prompt:

```txt
docs/workspaces/custom-business-service-codex-sync-prompt.md
```

Use these before opening or merging a PR because this branch is diverged from `main`.

## Manual App route patch

The GitHub update tool blocked the automatic `App.tsx` patch, so apply this manually or through Codex.

Add lazy import near the other workspace imports:

```ts
const CustomBusinessServiceWorkspace = lazy(
  () => import("@/app/workspace/custom-business/custom-business-service-workspace"),
);
```

Add the protected route near the other workspace routes:

```tsx
<Route path={ROUTES.WORKSPACE_CUSTOM_BUSINESS_SERVICE}>
  <ModeProtectedRoute requiredMode="custom-business">
    <CustomBusinessServiceWorkspace />
  </ModeProtectedRoute>
</Route>
```

Keep `requiredMode="custom-business"`. Do not put this route under another mode just to make it visible faster. That would be shortcut-driven architecture, which is a polite term for future suffering.

## Activation rules

Do not make `custom-business` selectable yet.

Before activation, implement:

1. service request schema
2. service job schema
3. quotation schema
4. service costing rules
5. service status transitions
6. invoice and payment linkage
7. permission enforcement for `custom-business.*`
8. API contracts and frontend API client methods
9. audit log / activity stream persistence
10. test data / seed data
11. typecheck and build validation

## Expected service workflow

```txt
REQUEST_INTAKE
→ JOB_PLANNING
→ QUOTATION_DRAFT
→ QUOTATION_APPROVED
→ IN_PROGRESS
→ READY_FOR_REVIEW
→ DELIVERED
→ INVOICED
→ PAID
→ CLOSED
```

Cancellation / rejection paths should be designed separately.

Do not reuse non-service workflow statuses for service jobs.

## Validation checklist

Run from repo root:

```bash
pnpm install
pnpm run typecheck
pnpm --filter @workspace/pos-system run build
```

Expected result after manual App route patch:

- Existing active routes still work.
- Service workspace file compiles.
- Route constant resolves.
- Direct service route stays protected by `custom-business` required mode.
- Mode selector still keeps Service / Custom Business locked.
