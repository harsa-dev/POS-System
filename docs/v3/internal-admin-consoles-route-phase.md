# Internal Admin Consoles Route Phase

## Purpose

This phase turns the internal admin console ideas into separate dashboard routes while keeping every screen mock-only.

Added console routes:

- `/dashboard/internal/admin-role-console`
- `/dashboard/internal/billing-operations-console`
- `/dashboard/internal/operator-support-console`
- `/dashboard/internal/admin-action-audit-console`
- `/dashboard/internal/approval-control-console`

The UI labels remain:

- Admin Role Console
- Billing Operations Console
- Support / Ops Console
- Admin Action Audit
- Sensitive Action Approval

## Files added earlier in this phase

- `artifacts/pos-system/src/features/shared/platform-monitoring/internal-admin-consoles.mock.ts`
- `artifacts/pos-system/src/features/shared/platform-monitoring/internal-admin-console-page.tsx`
- `artifacts/pos-system/src/pages/dashboard/admin-role-console.tsx`
- `artifacts/pos-system/src/pages/dashboard/billing-operations-console.tsx`
- `artifacts/pos-system/src/pages/dashboard/operator-support-console.tsx`
- `artifacts/pos-system/src/pages/dashboard/admin-action-audit-console.tsx`
- `artifacts/pos-system/src/pages/dashboard/approval-control-console.tsx`

## Wiring added in this phase

- Route constants added in `src/constants/routes.ts`.
- Lazy page imports added in `src/App.tsx`.
- Protected route entries added in `src/App.tsx`.
- Sidebar entries added through `src/app/registry/core-modules.ts` under the existing `settings` module.

## Rules

- Do not update Prisma schema yet.
- Do not add backend handlers yet.
- Do not enable real admin mutations yet.
- Keep the consoles mock-only until RBAC, audit write, approval policy, and rollback notes are implemented.
- Read-only API contracts can be promoted first.
- POST/PATCH routes must stay blocked until audit and approval infrastructure exists.

## Future API groups

- `/api/internal/admin-console/roles`
- `/api/internal/billing/operations/overview`
- `/api/internal/support/ops/tickets`
- `/api/internal/audit/admin-actions`
- `/api/internal/approvals/sensitive-actions`

## Future schema candidates

- `AdminRolePolicy`
- `BillingAccountSnapshot`
- `SupportTicket`
- `AdminActionAudit`
- `SensitiveActionApproval`
