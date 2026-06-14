# Custom Business Service Phase 8D - Payment Reversal Workflow

Status: implemented.

This document records the Service Business payment reversal workflow added after the quote/invoice cancellation reversal lane.

## Goal

Provide an explicit, audited reversal workflow for invoice payments that have already been recorded.

This keeps invoice cancellation separate from payment reversal:

```txt
invoice cancellation = cancel unpaid invoice
payment reversal = reduce paidAmount and rollback invoice/workflow collection state
```

## Implemented files

```txt
artifacts/api-server/src/features/service-business/service-business-reversal.service.ts
artifacts/api-server/src/routes/service-business-reversal.ts
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-api-operations.ts
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-api-contract-types.ts
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-api.ts
lib/api-spec/service-business.openapi.yaml
docs/workspaces/custom-business-service-payment-reversal.md
```

## Endpoint

```http
POST /api/custom-business/service/reversals/invoices/:id/reverse-payment
```

The `:id` value can be an invoice id or invoice code.

## Permission

The route uses:

```txt
custom-business.service.invoice.payment.record
```

Payment reversal is treated as the guarded inverse of payment recording, not as a generic invoice update.

## Request body

```json
{
  "amount": 150000,
  "note": "Customer payment correction"
}
```

Aliases accepted by the backend:

```txt
amount
reversalAmount
paidAmount
```

If no amount is provided, the backend reverses the full current paid amount.

## Eligibility rules

The reversal is rejected when:

```txt
invoice does not exist
invoice belongs to a different Service Business
invoice is cancelled
invoice has no paid amount
reversal amount is not greater than zero
reversal amount exceeds the current paid amount
```

## Invoice status rollback

After reversal:

```txt
nextPaidAmount <= 0         -> invoice status ISSUED
0 < nextPaidAmount < total  -> invoice status PARTIAL
nextPaidAmount >= total     -> invoice status PAID
```

For normal reversal use, status usually rolls back from `PAID` to `PARTIAL` or `ISSUED`.

## Workflow rollback

After reversal:

```txt
invoice status PAID -> workflow PAID
otherwise           -> workflow INVOICED
```

The matching latest Service job is updated alongside the request when a job exists.

## Audit behavior

The route writes a Service Business audit log:

```txt
action: UPDATE
entityType: ServiceInvoice
entityId: invoiceId
changes.reversalType: invoice-payment-reversal
```

Audit payload includes:

```txt
invoiceCode
invoiceTotal
reversalAmount
previousPaidAmount
nextPaidAmount
previousInvoiceStatus
nextInvoiceStatus
previousWorkflowStatus
nextWorkflowStatus
quotationId
quotationCode
note
```

## Timeline behavior

The workflow writes a Service timeline item:

```txt
Payment reversed: <amount>
```

When a note is supplied, it is appended to the timeline label.

## Frontend client

The Service frontend API client now exposes:

```ts
serviceBusinessApi.reverseInvoicePayment({
  invoiceId,
  amount,
  note,
});
```

It uses operation id:

```txt
serviceBusinessReverseInvoicePayment
```

## OpenAPI coverage

The mode-scoped Service OpenAPI supplement now includes:

```txt
POST /custom-business/service/reversals/invoices/{id}/reverse-payment
operationId: serviceBusinessReverseInvoicePayment
```

## Non-goals

This phase does not:

```txt
integrate a payment gateway refund
create a cashflow refund entry
reverse Service cost lines
cancel the invoice itself
remove audit logs
delete timeline items
add a new Prisma model
add a migration
redesign the Service UI
```

Cashflow/gateway refund integration needs a dedicated accounting/payment lane.

## Validation

Run:

```bash
pnpm service:check -- --no-smoke
```

With DB and seed:

```bash
pnpm service:check -- --db --seed --no-smoke
```

## Next phase

```txt
Phase 8E - Generated API client consolidation
```
