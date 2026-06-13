# Custom Business Service API Contract Draft

Planning draft only. No backend route is implemented in this phase.

## Scope

This contract exists so the mock workspace can later be replaced with API calls without redesigning the UI again.

Typed frontend contract file:

```txt
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-api-contract-types.ts
```

Placeholder API file:

```txt
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-api.ts
```

The placeholder API functions are typed but intentionally throw `not implemented`.

## Permissions

Suggested permission keys:

```txt
custom-business.service.view
custom-business.service.manage
custom-business.service.request.create
custom-business.service.request.update
custom-business.service.job.assign
custom-business.service.job.status.update
custom-business.service.quote.create
custom-business.service.quote.approve
custom-business.service.invoice.create
custom-business.service.invoice.payment.record
custom-business.service.config.manage
```

Frontend draft file:

```txt
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-permissions.ts
```

## Status transition draft

Frontend transition draft file:

```txt
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-status-transitions.ts
```

Current mock transition map:

```txt
REQUEST_INTAKE      -> JOB_PLANNING
JOB_PLANNING        -> QUOTATION_DRAFT
QUOTATION_DRAFT     -> QUOTATION_APPROVED
QUOTATION_APPROVED  -> IN_PROGRESS
IN_PROGRESS         -> READY_FOR_REVIEW
READY_FOR_REVIEW    -> DELIVERED
DELIVERED           -> INVOICED
INVOICED            -> PAID
PAID                -> CLOSED
CLOSED              -> terminal
```

The frontend action rail uses this map to show disabled next actions. Backend must still validate all transitions later. The UI map is a preview, not a source of truth.

## Request and response type candidates

Current typed candidates:

```txt
ServiceBusinessWorkspaceResponse
ListServiceBusinessJobsQuery
CreateServiceRequestInput
UpdateServiceJobStatusInput
AddServiceCostLineInput
CreateServiceQuotationInput
ApproveServiceQuotationInput
CreateServiceInvoiceInput
RecordServiceInvoicePaymentInput
ServiceBusinessMutationPreviewResponse
```

These types are frontend draft contracts. Backend DTO naming can still change later.

## Endpoints later

### GET /api/custom-business/service/workspace

Purpose: hydrate the whole service workspace in one request.

Should return:

- metrics
- pipeline metadata
- service jobs
- config draft or active config
- readiness status

### GET /api/custom-business/service/jobs

Purpose: list service jobs.

Query candidates:

- status
- priority
- assignedTo
- customerName
- serviceCategory
- dueDateFrom
- dueDateTo

### POST /api/custom-business/service/requests

Purpose: create service request.

Body candidates:

- customerName
- customerSegment
- serviceCategory
- title
- summary
- priority
- dueDate

### PATCH /api/custom-business/service/jobs/:id/status

Purpose: update service job status.

Body candidates:

- status
- note

Must validate status transitions against the backend transition service.

### POST /api/custom-business/service/jobs/:id/cost-lines

Purpose: add cost line to a service job.

Body candidates:

- label
- category
- quantity
- unitLabel
- unitCost
- billable

### POST /api/custom-business/service/quotations

Purpose: create quotation from service request or service job costs.

Body candidates:

- requestId
- discountAmount
- taxRate
- targetMarginRate
- validUntil

### PATCH /api/custom-business/service/quotations/:id/approve

Purpose: approve quotation.

Body candidates:

- approvedBy
- approvedAt
- note

### POST /api/custom-business/service/invoices

Purpose: create invoice from approved quotation.

Body candidates:

- requestId
- quotationId
- dueDate
- paymentTermDays

### PATCH /api/custom-business/service/invoices/:id/payment

Purpose: record invoice collection progress.

Body candidates:

- paidAmount
- paymentMethod
- paidAt
- note

## Frontend migration later

Current mock hook:

```txt
artifacts/pos-system/src/app/workspace/custom-business/service/use-service-business-workspace.ts
```

Later replacement path:

1. Keep component tree unchanged.
2. Replace hard-coded imports inside the hook with API client calls.
3. Normalize backend response into current frontend types.
4. Only after the API is stable, adjust types to match generated backend types.

## Do not do yet

- Do not create backend route files in this phase.
- Do not modify Prisma schema in this phase.
- Do not unlock the service mode selector.
- Do not connect this route to shared finance until the data relation strategy is settled.
