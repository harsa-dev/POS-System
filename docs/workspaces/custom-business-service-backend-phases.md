# Custom Business Service Backend Phases

Status: active backend implementation plan  
Scope: Business Mode Service / Custom Business Service  
Branch: main

## Why this exists

The Service Business backend should not stop at one persistence pass. The first backend implementation created the database tables and basic CRUD-style endpoints. That is only Phase 1.

A real service workflow needs guarded transitions, validation, permission boundaries, audit events, reporting integration, and eventually generated Prisma model delegates.

## Phase 1 - Persistence foundation

Status: implemented

Implemented:

- SQL migration for service business tables.
- Prisma raw SQL access through the API server Prisma client.
- Service request creation.
- Job listing and workspace loading.
- Cost line creation.
- Quotation creation and approval.
- Invoice creation.
- Payment recording.
- Timeline event creation for core mutations.

Main files:

- `artifacts/api-server/prisma/migrations/202606140002_add_service_business_core/migration.sql`
- `artifacts/api-server/src/routes/service-business.ts`
- `artifacts/pos-system/src/app/workspace/custom-business/service/service-business-api.ts`

## Phase 2 - Workflow guard and transition preview

Status: implemented

Implemented:

- Backend workflow transition map.
- Transition preview endpoint.
- Guarded status update endpoint.
- Requirement checks before moving jobs through the workflow.
- Frontend API client now calls the guarded status endpoint.

New endpoints:

- `GET /api/custom-business/service/workflow/statuses`
- `GET /api/custom-business/service/jobs/:id/transition-preview?nextStatus=...`
- `PATCH /api/custom-business/service/jobs/:id/guarded-status`

Guarded workflow:

- `REQUEST_INTAKE -> JOB_PLANNING`
- `JOB_PLANNING -> QUOTATION_DRAFT`
- `QUOTATION_DRAFT -> QUOTATION_APPROVED`
- `QUOTATION_APPROVED -> IN_PROGRESS`
- `IN_PROGRESS -> READY_FOR_REVIEW`
- `READY_FOR_REVIEW -> DELIVERED`
- `DELIVERED -> INVOICED`
- `INVOICED -> PAID`
- `PAID -> CLOSED`

Allowed side exits:

- `REQUEST_INTAKE -> REJECTED | CANCELLED`
- `JOB_PLANNING -> CANCELLED`
- `QUOTATION_DRAFT -> REJECTED | CANCELLED`
- `QUOTATION_APPROVED -> CANCELLED`
- `IN_PROGRESS -> CANCELLED`
- `READY_FOR_REVIEW -> CANCELLED`

Transition requirements:

- `JOB_PLANNING` requires request summary.
- `QUOTATION_DRAFT` requires cost lines and billable cost basis.
- `QUOTATION_APPROVED` requires quotation draft.
- `IN_PROGRESS` requires approved quotation.
- `READY_FOR_REVIEW` requires execution checklist.
- `INVOICED` requires approved quotation.
- `PAID` requires invoice.
- `CLOSED` requires paid invoice.

Main files:

- `artifacts/api-server/src/routes/service-business-workflow.ts`
- `artifacts/api-server/src/routes/index.ts`
- `artifacts/pos-system/src/app/workspace/custom-business/service/service-business-api-contract-types.ts`
- `artifacts/pos-system/src/app/workspace/custom-business/service/service-business-api.ts`

## Phase 3 - Service layer split

Status: planned

Move business logic out of route files into dedicated modules:

- `service-business.repository.ts`
- `service-business.workflow.ts`
- `service-business.validators.ts`
- `service-business.presenter.ts`

Target:

- Routes should only parse HTTP input and return responses.
- Repository should own SQL access.
- Workflow service should own transition rules and requirements.
- Presenter should own frontend response shape.

## Phase 4 - Permission hardening

Status: planned

Current endpoints use `ALL_ROLES` while the service workflow is still being shaped.

Next permission split:

- `custom-business.service.view`
- `custom-business.service.request.create`
- `custom-business.service.job.status.update`
- `custom-business.service.cost.create`
- `custom-business.service.quote.create`
- `custom-business.service.quote.approve`
- `custom-business.service.invoice.create`
- `custom-business.service.invoice.payment.record`

## Phase 5 - Audit integration

Status: planned

Current timeline rows are service-local audit events.

Next:

- Mirror important workflow mutations into the global audit log.
- Include actor id, actor name, business id, entity type, entity id, previous status, next status, and payload summary.

## Phase 6 - Shared dashboard integration from backend

Status: planned

Current shared dashboard bridge still reads frontend mock service jobs.

Next:

- Add backend summary endpoint.
- Return service job count, quote total, invoice total, pending collection, and workflow distribution.
- Wire shared dashboard bridge to API data instead of mock data.

Candidate endpoint:

- `GET /api/custom-business/service/summary`

## Phase 7 - Prisma schema delegate cleanup

Status: planned

Current implementation uses SQL migration plus Prisma raw SQL because schema rewrite was intentionally avoided during the first database phase.

Next:

- Add generated Prisma models after schema is stable.
- Replace raw SQL repository methods gradually with Prisma delegates where useful.
- Keep raw SQL only for complex reporting queries.

## Safety constraints

Do not change these unless explicitly planned:

- Restaurant workflow.
- Retail workflow.
- Raw material workflow.
- Business mode selector activation.
- Existing shared invoice table behavior.
- Existing shared cashflow behavior.
