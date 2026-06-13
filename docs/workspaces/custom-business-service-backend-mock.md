# Custom Business Service Mock Backend

## Purpose

This document describes the temporary backend layer for Service / Custom Business mode.

It exists to give the frontend a real API surface before Prisma schema work is ready.

## Scope

Implemented on `main`:

```txt
artifacts/api-server/src/routes/service-business.ts
artifacts/api-server/src/routes/index.ts
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-api.ts
```

## Constraints

This phase intentionally does not touch:

```txt
prisma/schema.prisma
migration files
Prisma client model usage
restaurant workflow logic
retail workflow logic
raw-material workflow logic
custom-business mode activation rules
```

## Route registration

The service router is registered under the existing Express `/api` router.

Base path:

```txt
/api/custom-business/service
```

## Endpoints

```txt
GET    /api/custom-business/service/workspace
GET    /api/custom-business/service/jobs
POST   /api/custom-business/service/requests
PATCH  /api/custom-business/service/jobs/:id/status
POST   /api/custom-business/service/jobs/:id/cost-lines
POST   /api/custom-business/service/quotations
PATCH  /api/custom-business/service/quotations/:id/approve
POST   /api/custom-business/service/invoices
PATCH  /api/custom-business/service/invoices/:id/payment
```

## Behavior

All mutation-like endpoints return dry-run previews.

They do not persist data.

The response includes:

```txt
success: true
dryRun: true
message
job
preview
```

The goal is to validate frontend request shapes, API envelopes, routing, and service business workflow semantics before database schema integration.

## Data source

The route file currently owns a local mock dataset matching the frontend service job shape.

This duplication is temporary.

After Prisma schema is ready, replace it with a repository/service layer backed by real database reads and writes.

## Frontend client

The frontend client file no longer throws `not implemented`.

It now calls the Express endpoints through the existing shared API client:

```txt
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-api.ts
```

The UI may still choose to stay read-only until the mode activation phase.

## Next backend phase after Prisma is ready

1. Create service business Prisma models.
2. Replace in-route mock data with repository functions.
3. Add authenticated business scope enforcement.
4. Add real status transition validation.
5. Add quotation and invoice persistence.
6. Add payment collection persistence.
7. Add audit log writes.
8. Add integration tests for every endpoint.

Do not let this mock backend become production code by accident. That is how software becomes folklore.
