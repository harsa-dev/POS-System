# Internal Monitoring: Admin Role Operations Phase

## Purpose

This phase adds a mock-only admin governance layer inside the internal monitoring dashboard.

The goal is to separate three platform admin personas:

1. Super Admin
2. Billing Admin
3. Support / Ops Admin

This is not tenant-level restaurant staff access. It is platform/internal admin access for a SaaS-like POS system.

## Research basis

Common admin systems split powerful access into focused roles:

- Super admin/global admin: owns full platform/account control.
- Billing admin: handles billing-related tasks and payment/subscription visibility.
- Help desk/support admin: handles user support tasks such as password reset and safe user/org visibility.
- Services/admin ops role: manages service settings, devices, alerts, and operational support surfaces.

For this POS project, the closest role set is:

- Super Admin: platform owner/dev admin.
- Billing Admin: subscription, invoice, plan, payment failure, and dispute admin.
- Support / Ops Admin: tenant support, ticket triage, safe diagnostics, and escalation admin.

## Files added

```txt
artifacts/pos-system/src/features/shared/platform-monitoring/admin-role-operations.mock.ts
artifacts/pos-system/src/features/shared/platform-monitoring/admin-role-operations-board.tsx
```

## File updated

```txt
artifacts/pos-system/src/features/shared/platform-monitoring/platform-monitoring-content.tsx
```

## Dashboard sections added

### Admin Role Operations Center

Summary cards:

- Admin Roles
- High Risk Roles
- Feature Gaps
- Blocked Items

### Role cards

One card per admin persona:

- Super Admin
- Billing Admin
- Support / Ops Admin

Each role has:

- mission
- allowed scope
- blocked scope
- daily focus
- readiness status
- risk level

### Admin Permission Matrix

Compares role capability for:

- Tenant lifecycle
- Billing and subscription
- Support tickets
- Admin role assignment
- Internal monitoring
- Feature flags

### Missing Admin Features

Tracks missing dashboard/backend areas:

- Admin Role Console
- Billing Operations Console
- Support / Ops Console
- Admin Action Audit
- Sensitive Action Approval

### Admin API Contract Preparation

Planned endpoints:

```txt
GET  /api/internal/admin/roles
GET  /api/internal/billing/overview
GET  /api/internal/support/tickets
POST /api/internal/admin/approval-requests
```

The POST endpoint is blocked until RBAC, audit write, approval policy, rate limit, and dry-run mode exist.

### Admin Schema Candidates

Future candidate models only, not Prisma schema yet:

- AdminRoleAssignment
- BillingAccountSnapshot
- SupportTicket
- AdminAuditEvent

### Admin Escalation Flow

Defines first owner and escalation owner for:

- repeated failed payment
- tenant owner login issue
- admin permission change
- billing dispute

## Hard rules

1. Do not update `prisma/schema.prisma` in this phase.
2. Do not create real backend handlers yet.
3. Do not give Billing Admin access to role assignment or security controls.
4. Do not give Support / Ops Admin access to billing mutation or destructive tenant actions.
5. Any future admin POST/PATCH endpoint must have server-side RBAC, audit write, approval policy, rate limit, dry-run mode, and rollback notes.
6. Read-only API comes first. Mutation comes later.

## Future promotion order

```txt
Phase 1: mock UI only
Phase 2: GET /api/internal/admin/roles
Phase 3: GET /api/internal/billing/overview
Phase 4: GET /api/internal/support/tickets
Phase 5: AdminAuditEvent schema
Phase 6: approval request workflow
Phase 7: controlled mutation endpoints
```
