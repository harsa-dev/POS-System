# Custom Business Service Workspace

## Purpose

This workspace defines the frontend blueprint for the future Service / Custom Business mode.

The Service / Custom Business mode must not copy Restaurant / F&B order logic. Restaurant workflows are built around cart, table, kitchen, serving, and order status queues. Service businesses need request intake, job planning, costing, quotation, invoice, collection, and delivery evidence.

## Scope

Created files:

```txt
artifacts/pos-system/src/app/workspace/custom-business/custom-business-service-workspace.tsx
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-workspace-layout.tsx
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

Keep `requiredMode="custom-business"`. Do not put this route under `restaurant` mode just to make it visible faster. That would be shortcut-driven architecture, which is a polite term for future suffering.

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

Do not reuse restaurant order statuses like `PREPARING`, `READY`, or `SERVED` for service jobs.

## Validation checklist

Run from repo root:

```bash
pnpm install
pnpm run typecheck
pnpm --filter @workspace/pos-system run build
```

Expected result after manual App route patch:

- Existing Restaurant routes still work.
- Service workspace file compiles.
- Route constant resolves.
- Direct service route stays protected by `custom-business` required mode.
- Mode selector still keeps Service / Custom Business locked.
