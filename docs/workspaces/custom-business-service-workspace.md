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
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-api.ts
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

## Current frontend preview

The workspace now contains hard-coded examples for:

- metric cards
- service workflow pipeline
- service job cards
- cost line breakdown
- quotation subtotal, discount, tax, total, and gross profit preview
- invoice collection progress
- checklist
- timeline
- configuration draft
- permission map draft
- API contract draft
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
├── ServiceBusinessPlaceholderPanel
├── ServiceBusinessPricingModulesPanel
└── ServiceBusinessConfigReadinessPanel
```

This keeps future API migration focused in `use-service-business-workspace.ts` instead of forcing a rewrite of the whole layout.

## Mock interactions

Current mock interactions:

- search by request code, title, customer, customer segment, category, or assignee
- filter by service status
- filter by priority
- reset filters
- tab switch between overview, jobs, quotations, invoices, and config
- disabled action buttons for future request and quotation creation

## API placeholder

The file below exists only as a future API seam:

```txt
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-api.ts
```

Every function intentionally throws `not implemented` because backend routes are not ready yet.

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
9. test data / seed data
10. typecheck and build validation

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
