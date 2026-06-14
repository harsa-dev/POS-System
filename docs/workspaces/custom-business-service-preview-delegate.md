# Custom Business Service Preview Delegate

## Phase

Service Phase 7D - Service quote/invoice preview delegate

## Status

Implemented.

## Goal

Add read-only preview delegates for Service Business billing workflows before write actions run.

This phase aligns Service Business with the preview-first pattern already used in Retail and Raw Material.

## Implemented backend files

```txt
artifacts/api-server/src/features/service-business/service-business-preview.service.ts
artifacts/api-server/src/routes/service-business-preview.ts
artifacts/api-server/src/routes/index.ts
artifacts/api-server/tsconfig.service.json
```

## Implemented frontend files

```txt
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-api-operations.ts
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-api-contract-types.ts
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-api.ts
```

## Implemented OpenAPI file

```txt
lib/api-spec/service-business.openapi.yaml
```

## Preview endpoints

```txt
POST /custom-business/service/previews/quotation
POST /custom-business/service/previews/invoice
POST /custom-business/service/previews/invoice-payment
```

## Permissions

The preview route uses the same permission family as the matching write action.

```txt
quotation preview       -> service-business.quote.create
invoice preview         -> service-business.invoice.create
invoice payment preview -> service-business.invoice.payment.record
```

Preview endpoints do not write audit logs because they do not mutate data.

## Response shape

All preview endpoints return:

```ts
type ServiceBusinessPreviewResult = {
  kind: "quotation" | "invoice" | "invoice-payment";
  canProceed: boolean;
  blockingIssues: string[];
  warnings: string[];
  estimates: Record<string, unknown>;
  previewedAt: string;
  source: "api-server-prisma-preview";
};
```

## Quotation preview

Input is compatible with quotation creation:

```txt
requestId
discountAmount
taxRate
targetMarginRate
validUntil
```

Estimates include:

```txt
costTotal
billableCostTotal
discountAmount
taxRate
targetMarginRate
marginBase
subtotalAfterDiscount
taxAmount
total
existing quotation metadata
```

Warnings include:

```txt
job has no cost lines
job has no billable cost lines
request already has a quotation
validUntil is empty or invalid
```

## Invoice preview

Input is compatible with invoice creation:

```txt
requestId
quotationId
dueDate
```

Estimates include:

```txt
quotation metadata
quote status
cost total
quote pricing settings
invoice total
existing invoice metadata
```

Warnings include:

```txt
job has no quotation
latest quotation is not approved
request already has an invoice
dueDate is empty or invalid
```

## Invoice payment preview

Input is compatible with invoice payment recording:

```txt
invoiceId
paidAmount
paymentMethod
paidAt
note
```

Estimates include:

```txt
invoiceTotal
currentPaidAmount
remainingBeforePayment
requestedPaidAmount
appliedAmount
overflowAmount
nextPaidAmount
remainingAfterPayment
nextInvoiceStatus
nextWorkflowStatus
projectedCollectionRate
```

Warnings include:

```txt
payment exceeds remaining invoice balance
invoice is already fully paid
```

## Frontend client methods

`serviceBusinessApi` now exposes:

```ts
previewQuotation(input)
previewInvoice(input)
previewInvoicePayment(input)
```

The methods route through Service operation IDs:

```txt
serviceBusinessPreviewQuotation
serviceBusinessPreviewInvoice
serviceBusinessPreviewInvoicePayment
```

## Non-goals

```txt
No quotation write behavior change
No invoice write behavior change
No payment write behavior change
No frontend modal/form redesign
No cancellation/reversal workflow
No Prisma schema change
No migration
```

## Validation

Run:

```bash
pnpm service:check -- --no-smoke
```

Full gate when auth is ready:

```bash
pnpm service:check
```

## Next recommended phase

```txt
Service Phase 8A - Service status API route family
```
