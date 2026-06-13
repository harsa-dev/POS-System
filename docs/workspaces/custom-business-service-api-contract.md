# Custom Business Service API Contract Draft

Planning draft only. No backend route is implemented in this phase.

## Scope

This contract exists so the mock workspace can later be replaced with API calls without redesigning the UI again.

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
custom-business.service.config.manage
```

Frontend draft file:

```txt
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-permissions.ts
```

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

Must validate status transitions.

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
