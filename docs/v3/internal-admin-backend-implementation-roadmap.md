# Internal Admin Backend Implementation Roadmap

This document aligns the internal admin consoles with the backend implementation phase format.

Scope:
- Admin Role Console
- Billing Operations Console
- Support / Ops Console
- Admin Action Audit
- Sensitive Action Approval

This is internal platform administration, not a business mode. It must not depend on `currentBusinessMode`.

## Phase status

```txt
Phase 1 - Persistence foundation: implemented
Phase 2 - Workflow guard and transition preview: implemented
Phase 3 - Service layer split: planned
Phase 4 - Permission hardening: planned
Phase 5 - Audit integration: planned
Phase 6 - Shared dashboard backend summary: planned
Phase 7 - Prisma schema delegate cleanup: planned
```

## Phase 1 - Persistence foundation: implemented

What is implemented:
- Admin console mock data exists.
- API contract candidates exist.
- Schema candidate rows exist.
- Backend readiness map exists.
- Query key, controller target, request DTO, response DTO, access rule, audit rule, readiness, and next step are visible in the dashboard.

Important limitation:
- Prisma schema is not updated yet.
- Persistence is only prepared, not promoted.

Rule:
- Read-only GET handlers can be built first.
- Write routes must stay blocked.

## Phase 2 - Workflow guard and transition preview: implemented

What is implemented:
- Workflow preview rows exist per admin console.
- Sensitive action rows exist.
- Approval rule and rollback plan are visible before real mutation exists.
- POST/PATCH contracts are marked blocked.

Rule:
- Do not execute role elevation, tenant suspension, refund approval, or sensitive approval decisions before RBAC, audit, approval, rate limit, and rollback validation exist.

## Phase 3 - Service layer split: planned

Target service split:
- `InternalAdminRoleService`
- `InternalBillingService`
- `InternalSupportService`
- `InternalAdminAuditService`
- `InternalApprovalService`

Rule:
- Controllers should stay thin.
- Services should own business rules.
- Repositories should own persistence access later.

## Phase 4 - Permission hardening: planned

Target:
- Super Admin controls role/security/platform actions.
- Billing Admin controls billing read/review only.
- Support/Ops Admin controls safe diagnostic and support queue only.
- Audit view and approval view are explicit scopes.

Rule:
- Never trust frontend-only route protection.
- Every internal backend route must enforce role and scope server-side.

## Phase 5 - Audit integration: planned

Target:
- Admin Action Audit must become append-only storage.
- Every future internal mutation must create an audit event.
- Sensitive read actions can also create audit events when diagnostics or exports are opened.

Rule:
- No admin mutation is allowed before audit append exists.

## Phase 6 - Shared dashboard backend summary: planned

Target:
- Dashboard cards should move from mock arrays to read-only summary APIs.
- Summary APIs should expose metrics, workflow counts, approval queue counts, billing risk, support SLA risk, and audit risk.

Rule:
- Summary endpoints stay read-only.
- No summary endpoint should trigger mutation.

## Phase 7 - Prisma schema delegate cleanup: planned

Target:
- Promote schema candidates only after service boundaries and permissions are stable.
- Add repository modules per domain.
- Keep Prisma delegates isolated by service/repository boundary.

Candidate models:
- `AdminRolePolicy`
- `BillingAccountSnapshot`
- `SupportTicket`
- `AdminActionAudit`
- `SensitiveActionApproval`

Rule:
- Do not update Prisma schema just because a dashboard exists.
- Schema changes must follow real backend service needs.

## Admin console mapping

### Admin Role Console

Implemented:
- Mock role metrics.
- Role workflow preview.
- Role API contracts.
- Role schema candidate.
- Backend readiness map.

Planned:
- Role service split.
- Server-side Super Admin guard.
- Role request audit.
- Two-person approval for role elevation.

### Billing Operations Console

Implemented:
- Mock billing metrics.
- Billing workflow preview.
- Billing overview API contract.
- Billing schema candidate.

Planned:
- Billing provider adapter.
- Billing account snapshot persistence.
- Refund request approval path.

### Support / Ops Console

Implemented:
- Mock support ticket metrics.
- Support workflow preview.
- Support queue API contract.
- Support ticket schema candidate.

Planned:
- Support service split.
- Diagnostic read audit.
- Safe recovery request workflow.

### Admin Action Audit

Implemented:
- Mock audit event metrics.
- Audit feed API contract.
- AdminActionAudit schema candidate.

Planned:
- Append-only audit persistence.
- Signed export bundle.
- Retention policy.

### Sensitive Action Approval

Implemented:
- Mock approval queue.
- Approval rules.
- Blocked PATCH contract.
- SensitiveActionApproval schema candidate.

Planned:
- Approval policy service.
- Second approver validation.
- Expiry rule.
- Rollback note enforcement.

## Backend promotion order

1. Keep dashboards using mock data.
2. Add read-only GET API handlers.
3. Add service layer split.
4. Add server-side permission guards.
5. Add append-only audit storage.
6. Add dashboard summary APIs.
7. Promote Prisma schema candidates.
8. Only then unlock carefully scoped internal write APIs.

## Hard rules

- Admin console is not a business mode.
- Do not depend on `currentBusinessMode`.
- Do not let Billing Admin mutate roles or security.
- Do not let Support/Ops mutate billing, roles, or destructive tenant actions.
- Do not open write APIs before RBAC, audit, approval, rate limit, and rollback notes exist.
- Do not update Prisma schema before service boundaries are stable.
