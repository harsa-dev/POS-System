# Reports Phase 4 Permissions

Phase 4 follows the original Financial Reports implementation plan: dedicated backend permissions for shared financial reports.

Financial Reports are sensitive because they expose revenue, gross profit, net profit, expenses, receivables, cashflow, and reconciliation signals. Access must be enforced by the backend, not by hidden frontend buttons.

## Permission Keys

```txt
shared.financialReports.view
shared.financialReports.export
````

## Role Access

```txt
OWNER   -> view, export
MANAGER -> view, export
CASHIER -> denied
KITCHEN -> denied
SERVER  -> denied
```

## Backend Rules

* Financial report view endpoints must require `shared.financialReports.view`.
* Financial report export endpoints must require `shared.financialReports.export`.
* Reconciliation endpoints must follow the same view permission.
* Permission checks must run in backend service logic.
* Frontend permission checks are UX only and must not be treated as security.
* Tenant or restaurant scope must come from authenticated backend business context.
* Frontend must never pass trusted restaurantId, businessId, role, or permission values for financial reports.

## Database Rules

* No database schema change is required for Phase 4.
* No permission table is added in this MVP phase.
* Financial report permission is code-level and centralized through the backend permission registry.
* Existing financial records remain the source of truth:

  * Order
  * Payment
  * OrderItem
  * MenuItem
  * StockMovement
  * InventoryItem
  * CashflowEntry
  * Invoice
  * AuditLog

## Anti-Pattern Guardrails

* Do not hide a frontend button and call it security.
* Do not trust frontend role checks.
* Do not trust frontend tenant scope.
* Do not expose profit, receivables, or reconciliation to cashier, kitchen, or server roles.
* Do not create fake financial permissions that are not enforced by the backend.
* Do not bypass permission checks for export routes.
* Do not add schema just to support a UI permission label.

## Test Checklist

### View Access

```txt
OWNER    -> GET /api/financial-reports should pass
MANAGER  -> GET /api/financial-reports should pass
CASHIER  -> GET /api/financial-reports should return 403
KITCHEN  -> GET /api/financial-reports should return 403
SERVER   -> GET /api/financial-reports should return 403
```

### Export Access

```txt
OWNER    -> GET /api/financial-reports/export should pass
MANAGER  -> GET /api/financial-reports/export should pass
CASHIER  -> GET /api/financial-reports/export should return 403
KITCHEN  -> GET /api/financial-reports/export should return 403
SERVER   -> GET /api/financial-reports/export should return 403
```

### Reconciliation Access

```txt
OWNER    -> GET /api/financial-reports/reconciliation should pass
MANAGER  -> GET /api/financial-reports/reconciliation should pass
CASHIER  -> GET /api/financial-reports/reconciliation should return 403
KITCHEN  -> GET /api/financial-reports/reconciliation should return 403
SERVER   -> GET /api/financial-reports/reconciliation should return 403
```

## Build Checklist

```txt
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/pos-system run build
```

## Completion Criteria

Phase 4 is considered complete when:

* `shared.financialReports.view` exists in the central permission registry.
* `shared.financialReports.export` exists in the central permission registry.
* OWNER and MANAGER receive both permissions.
* CASHIER, KITCHEN, and SERVER do not receive these permissions.
* Financial report service checks use dedicated financial report permission keys.
* Financial report export checks use dedicated financial report permission keys.
* Reconciliation uses the financial report view permission.
* Backend build passes.
* Frontend build passes.
