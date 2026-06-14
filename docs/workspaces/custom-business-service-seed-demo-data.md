# Custom Business Service Phase 4 - Seed Demo Data

Status: implemented.

## Goal

Add idempotent demo data for Business Mode Service / Custom Business Service so the mode has a stable local/demo baseline like Retail and Raw Material.

This phase is intentionally small. It seeds service workflow data only. It does not add a service check gate, scoped smoke test, DB baseline hardening, or frontend changes.

## Commands

Seed an existing active Service business:

```bash
pnpm --filter @workspace/api-server run service:seed
```

Create a safe demo Service business when no active Service business exists:

```bash
pnpm --filter @workspace/api-server run service:ensure-business
```

Full local/demo setup:

```bash
pnpm --filter @workspace/api-server run service:db:apply
pnpm --filter @workspace/api-server run generate
pnpm --filter @workspace/api-server run service:ensure-business
pnpm --filter @workspace/api-server run service:seed
```

## Business scope

The seed script targets the first active Service business:

```txt
Business.mode = SERVICE
Business.isActive = true
```

If no active Service business exists, the script exits safely and prints a clear message.

`service:ensure-business` is intentionally separate from `service:seed`. It creates or updates one active demo Service business only when called explicitly.

## Demo business ensure behavior

`service:ensure-business`:

```txt
finds an active OWNER, ADMIN, or MANAGER user
creates/updates Service Demo Business
sets Business.type = SERVICE
sets Business.mode = SERVICE
sets Business.isActive = true
uses the selected user as Business.ownerId
```

If there is no active OWNER/ADMIN/MANAGER user, the script stops and prints a clear message. It does not create users or passwords.

## Implemented files

```txt
artifacts/api-server/scripts/ensure-service-business-demo.ts
artifacts/api-server/scripts/seed-service-business-demo-data.ts
artifacts/api-server/package.json
```

## Seeded data

Per active Service business, the script inserts or updates:

```txt
3 service requests
3 service jobs
6 service cost lines
3 service quotations
2 service invoices
6 service checklist items
5 service timeline items
```

## Demo request coverage

The seeded requests cover several useful workflow states:

```txt
SRV-DEMO-HVAC-001   IN_PROGRESS          HIGH priority, partial invoice payment
SRV-DEMO-WEB-001    QUOTATION_APPROVED   approved quote and paid invoice
SRV-DEMO-CAL-001    REQUEST_INTAKE       urgent intake-stage calibration request
```

## Billing coverage

The billing demo data includes:

```txt
approved quotation
quotation draft
partial invoice
paid invoice
labor/material/operational/vendor cost lines
```

This gives the Service workspace useful demo states for workflow, billing, and timeline views.

## Idempotency strategy

IDs are deterministic and scoped by business:

```txt
service-${businessId}-${seedId}
```

The script uses Prisma `upsert`, so it can be run repeatedly without duplicating rows.

The seed updates existing demo rows back to the canonical demo state. That is intentional for local/demo reset behavior.

## Non-goals

This phase does not:

```txt
create users or passwords
auto-create a Service business during service:seed
run global Prisma migrations
create root service:check
create service smoke tests
create OpenAPI coverage
change frontend behavior
enable new write actions
change Prisma schema
```

## Recommended validation

After pulling this phase:

```bash
pnpm --filter @workspace/api-server run service:db:apply
pnpm --filter @workspace/api-server run generate
pnpm --filter @workspace/api-server run service:ensure-business
pnpm --filter @workspace/api-server run service:seed
```

If the database already has Service tables, the DB apply step can be skipped.

## Next phase

```txt
Service Phase 8F - Service smoke test + scoped CI gate
```

The seed gives Phase 8F stable data to validate against.
