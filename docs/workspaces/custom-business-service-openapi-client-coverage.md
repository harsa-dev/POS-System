# Custom Business Service Phase 6 - OpenAPI/client coverage

Status: implemented.

This phase gives Business Mode Service explicit OpenAPI/client coverage without pretending the project already has a full generated-client pipeline for this mode.

## Goal

Bring Service Business closer to Retail and Raw Material parity by documenting the active API surface and binding the frontend client to stable operation IDs.

## Implemented files

```txt
lib/api-spec/service-business.openapi.yaml
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-api-operations.ts
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-api.ts
docs/workspaces/custom-business-service-openapi-client-coverage.md
docs/workspaces/custom-business-service-retail-style-implementation-plan.md
```

## OpenAPI coverage

Mode-scoped OpenAPI file:

```txt
lib/api-spec/service-business.openapi.yaml
```

The spec covers the currently active Service Business read/write surface:

```txt
GET   /custom-business/service/workspace
GET   /custom-business/service/summary
GET   /custom-business/service/jobs
GET   /custom-business/service/workflow/statuses
GET   /custom-business/service/jobs/{id}/transition-preview
POST  /custom-business/service/requests
PATCH /custom-business/service/jobs/{id}/guarded-status
POST  /custom-business/service/jobs/{id}/cost-lines
POST  /custom-business/service/quotations
PATCH /custom-business/service/quotations/{id}/approve
POST  /custom-business/service/invoices
PATCH /custom-business/service/invoices/{id}/payment
```

## Operation IDs

The OpenAPI operation IDs are mirrored by the frontend operation registry:

```txt
serviceBusinessGetWorkspace
serviceBusinessGetSummary
serviceBusinessListJobs
serviceBusinessGetWorkflowStatuses
serviceBusinessGetTransitionPreview
serviceBusinessCreateRequest
serviceBusinessUpdateJobStatus
serviceBusinessAddCostLine
serviceBusinessCreateQuotation
serviceBusinessApproveQuotation
serviceBusinessCreateInvoice
serviceBusinessRecordInvoicePayment
```

## Frontend operation registry

File:

```txt
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-api-operations.ts
```

The registry stores method/path metadata and exports:

```txt
SERVICE_BUSINESS_OPENAPI_OPERATIONS
ServiceBusinessOpenApiOperationId
getServiceBusinessOpenApiOperation()
buildServiceBusinessApiPath()
```

`buildServiceBusinessApiPath()` prefixes `/api`, interpolates path params, and builds query strings.

## Client consolidation boundary

File:

```txt
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-api.ts
```

The handwritten frontend client now routes every call through `buildServiceBusinessApiPath()` instead of scattering hard-coded paths across method bodies.

This keeps the current client behavior intact while giving Phase 8E a clean boundary for a future generated-client replacement.

## Schema strategy

The mode-scoped OpenAPI file uses lightweight generic schemas:

```txt
ServiceBusinessObject
ServiceBusinessArray
ServiceBusinessObjectResponse
ServiceBusinessArrayResponse
```

This follows the current Retail/Raw Material style. Exact DTO expansion is intentionally deferred.

## Non-goals

```txt
No full OpenAPI generator was added.
No generated client files were produced.
No backend behavior changed.
No route paths changed.
No Prisma schema or migration changed.
No Service status route family was added.
No preview/reversal workflow was added.
```

## Validation

Run:

```bash
pnpm service:check -- --no-smoke
```

Use full smoke when the API server and authenticated cookie are available:

```bash
pnpm service:check
```

## Next recommended phase

```txt
Service Phase 7D - Service quote/invoice preview delegate
```
