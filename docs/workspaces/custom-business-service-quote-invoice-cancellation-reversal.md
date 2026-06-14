# Custom Business Service Phase 8C - Quote/Invoice Cancellation Reversal Workflow

## Status

Implemented.

## Goal

Add guarded cancellation reversal workflows for Service Business quotation and invoice records.

This phase covers quotation cancellation and unpaid invoice cancellation only. Payment reversal is intentionally kept for Phase 8D.

## Implemented files

```txt
artifacts/api-server/src/features/service-business/service-business-reversal.service.ts
artifacts/api-server/src/routes/service-business-reversal.ts
artifacts/api-server/src/routes/index.ts
artifacts/api-server/tsconfig.service.json
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-api-operations.ts
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-api-contract-types.ts
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-api.ts
lib/api-spec/service-business.openapi.yaml
docs/workspaces/custom-business-service-quote-invoice-cancellation-reversal.md
```

## Backend routes

```txt
POST /custom-business/service/reversals/quotations/:id/cancel
POST /custom-business/service/reversals/invoices/:id/cancel
```

Both routes accept an optional JSON body:

```json
{
  "note": "Operator cancellation note"
}
```

## Permissions

```txt
quotation cancellation -> custom-business.service.quote.approve
invoice cancellation   -> custom-business.service.invoice.create
```

The quotation cancellation path uses an approval-level permission because it can reverse an approved quote workflow state.

The invoice cancellation path uses the billing invoice permission because it reverses invoice issuance state but does not reverse payment.

## Quotation cancellation behavior

The quotation cancellation workflow:

```txt
find quotation by id or quotationCode scoped to business
reject if quotation does not exist
reject if quotation is already rejected or expired
reject if linked non-cancelled invoices exist
set quotation.status = REJECTED
clear quotation.approvedAt
set request.status = JOB_PLANNING
set latest job.status = JOB_PLANNING
write ServiceTimelineItem
return updated job presenter payload
write audit log from route layer
```

The route returns conflict when a quotation has linked invoices. Operators must cancel invoices first.

## Invoice cancellation behavior

The invoice cancellation workflow:

```txt
find invoice by id or invoiceCode scoped to business
reject if invoice does not exist
reject if invoice is already cancelled
reject if invoice.paidAmount > 0
reject if invoice.status = PAID
set invoice.status = CANCELLED
clear invoice.paidAt
set request.status = DELIVERED
set latest job.status = DELIVERED
write ServiceTimelineItem
return updated job presenter payload
write audit log from route layer
```

Paid or partially paid invoices are blocked in this phase. Payment reversal belongs to Phase 8D.

## Frontend API client

New operation IDs:

```txt
serviceBusinessCancelQuotation
serviceBusinessCancelInvoice
```

New client methods:

```ts
serviceBusinessApi.cancelQuotation({ quotationId, note })
serviceBusinessApi.cancelInvoice({ invoiceId, note })
```

These methods route through the Service Business operation registry and call the new reversal endpoints.

## OpenAPI coverage

The mode-scoped Service OpenAPI supplement now includes:

```txt
POST /custom-business/service/reversals/quotations/{id}/cancel
POST /custom-business/service/reversals/invoices/{id}/cancel
```

The schemas remain generic object envelopes, matching current Service OpenAPI coverage style.

## Audit behavior

Successful cancellation routes write audit logs:

```txt
ServiceQuotation UPDATE -> reversalType = quotation-cancellation
ServiceInvoice   UPDATE -> reversalType = invoice-cancellation
```

The audit payload captures previous status, next status, workflow status rollback, entity code, and operator note.

## Non-goals

```txt
No payment reversal
No cashflow reversal
No invoice paid cancellation
No quotation cancellation when active invoices remain
No schema change
No migration
No frontend UI redesign
No legacy route removal
```

## Validation

```bash
pnpm service:check -- --no-smoke
```

With DB and seed:

```bash
pnpm service:check -- --db --seed --no-smoke
```

## Next phase

```txt
Service Phase 8D - Payment reversal workflow
```
