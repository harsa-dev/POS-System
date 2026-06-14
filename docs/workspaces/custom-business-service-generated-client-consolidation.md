# Custom Business Service Generated API Client Consolidation

Status: implemented.

## Goal

Consolidate the Service Business frontend API client behind a generated-client-style operation boundary.

The repository does not currently have a full OpenAPI code generation pipeline for Service Business. This phase therefore implements the same pragmatic boundary used for the other business modes:

```txt
operationId -> method/path registry -> generated API facade -> domain-specific serviceBusinessApi
```

This gives the Service client one request/unwrap path without pretending a full generator exists yet. Apparently honesty is still allowed in architecture, shocking development.

## Implemented files

```txt
artifacts/pos-system/src/app/workspace/custom-business/service/service-business.generated-api-client.ts
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-api.ts
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-api-operations.ts
docs/workspaces/custom-business-service-generated-client-consolidation.md
```

## Generated API facade

New facade:

```txt
service-business.generated-api-client.ts
```

Exports:

```txt
SERVICE_BUSINESS_OPENAPI_OPERATIONS
ServiceBusinessOpenApiOperationId
ServiceBusinessGeneratedEnvelope
ServiceBusinessGeneratedApiRequestOptions
getServiceBusinessGeneratedApiOperation()
resolveServiceBusinessGeneratedApiPath()
serviceBusinessGeneratedApiRequest()
serviceBusinessGeneratedApiData()
```

The facade handles:

```txt
operation lookup
path parameter interpolation
query string routing
GET / POST / PATCH dispatch
JSON request body
AbortSignal passthrough
ApiEnvelope data unwrap
empty data envelope guard
```

## Consolidated frontend client

`service-business-api.ts` no longer calls `apiClient.get/post/patch` directly per method.

It now calls:

```txt
serviceBusinessGeneratedApiData(operationId, options)
```

Examples:

```txt
getWorkspace()               -> serviceBusinessGetWorkspace
listJobs()                   -> serviceBusinessListJobs
previewQuotation()           -> serviceBusinessPreviewQuotation
updateJobStatus()            -> serviceBusinessSetJobStatus
cancelQuotation()            -> serviceBusinessCancelQuotation
reverseInvoicePayment()      -> serviceBusinessReverseInvoicePayment
cancelInvoice()              -> serviceBusinessCancelInvoice
```

## Operation registry remains source of route truth

The existing operation registry remains the route source:

```txt
service-business-api-operations.ts
```

This keeps Phase 6 OpenAPI/client coverage useful and makes future full codegen migration smaller.

## Non-goals

This phase does not:

```txt
generate TypeScript from OpenAPI automatically
replace the handwritten domain client shape
change backend route behavior
change Prisma schema
add migrations
redesign Service UI
remove compatibility routes
```

## Validation

Run:

```bash
pnpm service:check -- --no-smoke
```

With seeded DB validation:

```bash
pnpm service:check -- --db --seed --no-smoke
```

Full smoke still requires a running API server and authenticated cookie.

## Next recommended phase

```txt
Service Phase 8H - Service audit + permission policy hardening
```
