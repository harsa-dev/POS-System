# Custom Business Service Main Advance Plan

This document records the next frontend-only advance after the custom business service workspace was merged into `main`.

## Goal

Add a read-only service handoff bundle preview to the selected service job detail panel.

The preview should show which service handoff items are already represented by mock job data and which items are still planned for later backend support.

## Scope

Target file:

```txt
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-job-detail-panel.tsx
```

Optional future split file:

```txt
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-handoff-panel.tsx
```

## Handoff bundle rows

Suggested rows:

- Request brief
- Work order
- Customer quote
- Completion note
- Billing note
- Collection note

## Readiness rules

Suggested preview count:

- Request brief is ready when `summary` exists.
- Work order is ready when checklist items exist.
- Customer quote is ready when quote code exists.
- Completion note is ready when status is `DELIVERED`, `INVOICED`, `PAID`, or `CLOSED`.
- Billing note is ready when invoice code exists.
- Collection note is ready when paid amount is greater than zero.

## Constraints

Do not change:

- Prisma schema
- backend routes
- restaurant workflow
- business mode selector activation
- service API placeholders

Do not make `custom-business` selectable yet.

## Validation

After implementation, run:

```bash
pnpm run typecheck
pnpm --filter @workspace/pos-system run build
```

Codex can implement this as either an inline section inside the selected job detail panel or as a small extracted component.
