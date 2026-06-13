# Retail Phase 8C - Return Persistence and Refund Reversal

Status: implemented

## Implemented scope

- Retail return persistence tables are defined in `202606140004_add_retail_returns`.
- Return Prisma schema sync is available through `sync-retail-return-prisma-schema.ts`.
- `POST /api/retail/returns/preview` remains available for dry-run return review.
- `POST /api/retail/returns` persists approved return workflows.
- Return persistence validates the original receipt number against `RetailSale`.
- Return persistence validates returned quantity against the original sale item quantity.
- Return persistence blocks over-return by checking previous `RetailReturnItem` rows.
- Restockable returns increment `RetailProduct.currentStock`.
- Restockable returns create `RetailStockMovement` rows with `type=in` and `reason=return`.
- Refund reversal creates an `EXPENSE` `CashflowEntry`.
- Return workflow writes an `AuditLog` entry.
- Damaged, expired, or missing receipt cases remain review-only and do not mutate stock.
- OpenAPI documents return preview and return persistence endpoints.
- React API client schemas and fetch helpers exist for return preview and persistence.

## Primary files

```txt
artifacts/api-server/prisma/migrations/202606140004_add_retail_returns/migration.sql
artifacts/api-server/scripts/sync-retail-return-prisma-schema.ts
artifacts/api-server/src/services/retail/retail.return-repository.ts
artifacts/api-server/src/services/retail/retail.service.ts
artifacts/api-server/src/routes/retail.ts
lib/api-spec/openapi.yaml
lib/api-client-react/src/generated/api.schemas.ts
lib/api-client-react/src/generated/retail-returns.ts
```

## Endpoint contracts

```txt
POST /api/retail/returns/preview
POST /api/retail/returns
```

Example body:

```json
{
  "originalReceiptNumber": "RTL-20260614-1234567",
  "reason": "wrong-item",
  "lines": [
    {
      "productId": "retail-product-id",
      "quantity": 1
    }
  ]
}
```

## Manual setup note

The connector blocked updating the root API package scripts. Until that is patched locally, run these after pulling the phase:

```bash
pnpm --filter @workspace/api-server exec prisma db execute --file prisma/migrations/202606140004_add_retail_returns/migration.sql
pnpm --filter @workspace/api-server exec tsx ./scripts/sync-retail-return-prisma-schema.ts
pnpm --filter @workspace/api-server run generate
```

## Validation checklist

```txt
1. Create a checkout with POST /api/retail/sales/checkout.
2. Copy the returned receiptNumber.
3. Call POST /api/retail/returns/preview with the receiptNumber, productId, quantity, and reason.
4. Call POST /api/retail/returns with the same payload.
5. Confirm persisted=true for restockable reasons.
6. Confirm RetailReturn and RetailReturnItem rows exist.
7. Confirm stock increases for restockable returns.
8. Confirm RetailStockMovement records the return as type=in and reason=return.
9. Confirm CashflowEntry contains an EXPENSE refund row.
10. Confirm damaged or expired return reasons remain review-only.
```
