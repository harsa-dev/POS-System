# Platform Admin Persistence Foundation

Status: implemented as manual SQL migration.

Migration file:

```txt
artifacts/api-server/prisma/migrations/202606140010_add_platform_admin_foundation/migration.sql
```

Purpose:
- Add platform-level tables for internal admin consoles.
- Keep platform admin separate from business mode.
- Prepare tenant and user monitoring data.
- Keep write workflows blocked until guardrails exist.

Tables added:
- `PlatformAdminProfile`
- `PlatformAdminTenantAccess`
- `PlatformAdminAuditEvent`
- `SensitiveActionApproval`
- `SupportTicket`
- `BillingAccountSnapshot`

Main idea:
- `User` remains the identity source.
- `Business` remains the tenant source.
- `PlatformAdminProfile` defines internal platform admin role.
- `PlatformAdminTenantAccess` controls tenant visibility.
- `PlatformAdminAuditEvent` stores platform admin event history.
- `SensitiveActionApproval` stores review queue data.
- `SupportTicket` stores support cases.
- `BillingAccountSnapshot` stores billing overview per tenant.

Apply locally:

```bash
cd artifacts/api-server
pnpm prisma db execute --file prisma/migrations/202606140010_add_platform_admin_foundation/migration.sql
```

Next backend phase:
1. Build read-only internal admin service layer.
2. Add tenant and user summary queries.
3. Add server-side role checks.
4. Add audit writes for sensitive reads.
5. Keep POST/PATCH routes blocked until approval and audit rules are ready.

Hard rules:
- Do not bind platform admin to `currentBusinessMode`.
- Do not mix platform roles into tenant `Role` enum.
- Do not unlock write routes before permission, audit, approval, and rollback rules exist.
