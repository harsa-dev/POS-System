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

Status: implemented

Phase 3A implemented:

- Shared backend service business types.
- Workflow validators.
- Workflow read/write repository for guarded transitions.
- Workflow service for transition rules and requirements.
- Workflow presenter for response shape.
- `service-business-workflow.ts` route refactored so it only handles HTTP auth, input, and response orchestration.

Phase 3B implemented:

- CRUD and billing read/write logic moved out of `service-business.ts`.
- Job loading, request creation, cost line creation, quote creation, quotation approval, invoice creation, and invoice payment recording moved into a CRUD repository/service pair.
- `service-business.ts` now handles HTTP auth, body parsing, business context, and response sending only.
- Shared validators now cover body parsing, date parsing, numbers, workflow status, priority, and cost category parsing.
- Shared presenter now owns workspace, job list, mutation, and workflow response shapes.
- No new migration was added in this phase.

Main files:

- `artifacts/api-server/src/features/service-business/service-business.types.ts`
- `artifacts/api-server/src/features/service-business/service-business.validators.ts`
- `artifacts/api-server/src/features/service-business/service-business.repository.ts`
- `artifacts/api-server/src/features/service-business/service-business.workflow.ts`
- `artifacts/api-server/src/features/service-business/service-business.presenter.ts`
- `artifacts/api-server/src/features/service-business/service-business.crud.repository.ts`
- `artifacts/api-server/src/features/service-business/service-business.crud.service.ts`
- `artifacts/api-server/src/routes/service-business.ts`
- `artifacts/api-server/src/routes/service-business-workflow.ts`

Target state now reached:

- Routes parse HTTP input and return responses.
- Repositories own SQL access.
- Workflow service owns transition rules and requirements.
- CRUD service owns request, quote, invoice, and payment orchestration.
- Presenter owns frontend response shape.

## Phase 4 - Permission hardening

Status: implemented

Implemented:

- Service Business endpoints no longer use `ALL_ROLES` directly.
- Added `service-business.permissions.ts` as the permission matrix for Service Business actions.
- CRUD endpoints are guarded by action-specific permissions.
- Workflow endpoints are guarded by view or status-update permissions.
- No database migration was added in this phase.

Permission keys:

- `custom-business.service.view`
- `custom-business.service.request.create`
- `custom-business.service.job.status.update`
- `custom-business.service.cost.create`
- `custom-business.service.quote.create`
- `custom-business.service.quote.approve`
- `custom-business.service.invoice.create`
- `custom-business.service.invoice.payment.record`

Role matrix:

- View: `OWNER`, `MANAGER`, `ADMIN`, `OPERATOR`, `STAFF`, `VIEWER`
- Request create: `OWNER`, `MANAGER`, `ADMIN`, `OPERATOR`, `STAFF`
- Job status update: `OWNER`, `MANAGER`, `ADMIN`, `OPERATOR`, `STAFF`
- Cost line create: `OWNER`, `MANAGER`, `ADMIN`, `OPERATOR`, `STAFF`
- Quote create: `OWNER`, `MANAGER`, `ADMIN`, `OPERATOR`
- Quote approve: `OWNER`, `MANAGER`, `ADMIN`
- Invoice create: `OWNER`, `MANAGER`, `ADMIN`, `OPERATOR`
- Invoice payment record: `OWNER`, `MANAGER`, `ADMIN`, `OPERATOR`

Main files:

- `artifacts/api-server/src/features/service-business/service-business.permissions.ts`
- `artifacts/api-server/src/routes/service-business.ts`
- `artifacts/api-server/src/routes/service-business-workflow.ts`

## Phase 5 - Audit integration

Status: implemented

Implemented:

- Added `service-business.audit.ts` as the global AuditLog writer for Service Business.
- CRUD mutations now mirror successful actions into the global `AuditLog` table.
- Guarded workflow transitions now mirror previous status, next status, note, request code, and requirement summary into `AuditLog`.
- No new migration was added because the existing `AuditLog` model already supports `businessId`, `userId`, `action`, `entityType`, `entityId`, and JSON `changes`.

Audited mutation surfaces:

- `POST /api/custom-business/service/requests` -> `CREATE ServiceJob`.
- `PATCH /api/custom-business/service/jobs/:id/status` -> `UPDATE ServiceJob`.
- `POST /api/custom-business/service/jobs/:id/cost-lines` -> `UPDATE ServiceJob` with cost-line count.
- `POST /api/custom-business/service/quotations` -> `CREATE ServiceQuotation`.
- `PATCH /api/custom-business/service/quotations/:id/approve` -> `UPDATE ServiceQuotation`.
- `POST /api/custom-business/service/invoices` -> `CREATE ServiceInvoice`.
- `PATCH /api/custom-business/service/invoices/:id/payment` -> `UPDATE ServiceInvoice`.
- `PATCH /api/custom-business/service/jobs/:id/guarded-status` -> `UPDATE ServiceJob` with guarded transition details.

Main files:

- `artifacts/api-server/src/features/service-business/service-business.audit.ts`
- `artifacts/api-server/src/routes/service-business.ts`
- `artifacts/api-server/src/routes/service-business-workflow.ts`

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
