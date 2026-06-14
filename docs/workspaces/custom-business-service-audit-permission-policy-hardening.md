# Custom Business Service Audit + Permission Policy Hardening

## Status

Implemented.

## Goal

Service Business now has an explicit, typechecked policy matrix that maps API surfaces to permissions and audit expectations.

This phase does not change route behavior. It hardens the contract around existing behavior so Service Business can stay aligned with Retail and Raw Material instead of relying on scattered route guards and audit calls.

## Implemented files

```txt
artifacts/api-server/src/features/service-business/service-business.audit.ts
artifacts/api-server/src/features/service-business/service-business.policy.ts
artifacts/api-server/scripts/check-service-business-policy.ts
artifacts/api-server/package.json
scripts/service-check.mjs
docs/workspaces/custom-business-service-audit-permission-policy-hardening.md
```

## Audit constants

`service-business.audit.ts` now exposes stable constants for audit actions, entities, and domain operations.

Audit actions:

```txt
CREATE
UPDATE
DELETE
```

Audit entities:

```txt
ServiceRequest
ServiceJob
ServiceCostLine
ServiceQuotation
ServiceInvoice
ServiceWorkflowStatus
```

Domain audit operations:

```txt
create-request
update-status
add-cost-line
create-quotation
approve-quotation
create-invoice
record-invoice-payment
cancel-quotation
cancel-invoice
reverse-invoice-payment
```

The runtime `writeServiceBusinessAuditLog()` behavior remains unchanged.

## Policy matrix

`service-business.policy.ts` defines `SERVICE_BUSINESS_POLICY_MATRIX`.

Each entry includes:

```txt
id
method
path
permission
audit requirement
note
```

Covered read surfaces:

```txt
GET /custom-business/service/workspace
GET /custom-business/service/jobs
GET /custom-business/service/summary
GET /custom-business/service/workflow/statuses
GET /custom-business/service/jobs/:id/transition-preview
```

Covered preview surfaces:

```txt
POST /custom-business/service/previews/quotation
POST /custom-business/service/previews/invoice
POST /custom-business/service/previews/invoice-payment
```

Preview routes are intentionally non-audited because they are read-only calculations, even though they use POST to carry request payloads.

Covered mutation/status/reversal surfaces:

```txt
POST  /custom-business/service/requests
PATCH /custom-business/service/jobs/:id/status
PATCH /custom-business/service/jobs/:id/guarded-status
POST  /custom-business/service/status/jobs/:id
POST  /custom-business/service/status/requests/:id
POST  /custom-business/service/jobs/:id/cost-lines
POST  /custom-business/service/quotations
PATCH /custom-business/service/quotations/:id/approve
POST  /custom-business/service/invoices
PATCH /custom-business/service/invoices/:id/payment
POST  /custom-business/service/reversals/quotations/:id/cancel
POST  /custom-business/service/reversals/invoices/:id/cancel
POST  /custom-business/service/reversals/invoices/:id/reverse-payment
```

These sensitive surfaces require audit coverage in the policy matrix.

## Policy assertion

The policy module exports:

```txt
assertServiceBusinessPolicyCoverage
getServiceBusinessPolicySnapshot
getServiceBusinessPolicyEntriesByPermission
SERVICE_BUSINESS_POLICY_MATRIX
SERVICE_BUSINESS_SENSITIVE_POLICY_ENTRY_IDS
```

The assertion checks:

```txt
every Service Business permission has at least one policy entry
every Service Business permission resolves to at least one role
all non-GET non-preview surfaces require audit
```

## Scoped check integration

New command:

```bash
pnpm --filter @workspace/api-server run service:policy:check
```

`pnpm service:check` now runs the policy check after the Service API scoped typecheck and before the frontend scoped typecheck.

This means permission/audit drift now fails the Service gate instead of hiding in review notes that nobody reads because apparently humans enjoy suspense.

## Non-goals

```txt
No Prisma schema changes.
No migration changes.
No route behavior changes.
No audit UI.
No compatibility route removal.
No global non-Service typecheck cleanup.
```

## Validation

```bash
pnpm service:check -- --no-smoke
```

With DB and seed:

```bash
pnpm service:check -- --db --seed --no-smoke
```
