# Sales Analytics Final Audit

This document captures the current Sales Analytics shared dashboard state after the guarded workspace, reconciliation drilldown, filter sync, payment integrity workbench, review workflow, and review-aware export phases.

The goal of this module is to provide management-only revenue, product performance, source health, reconciliation, payment integrity, and export workflows without exposing sensitive sales and margin data to operational roles.

## 1. Backend Route Order

Sales Analytics routes are mounted in `artifacts/api-server/src/routes/index.ts` in this order:

```ts
router.use(salesAnalyticsGuardRouter);
router.use(salesAnalyticsPaymentIntegrityReviewsRouter);
router.use(salesAnalyticsPaymentIntegrityRouter);
router.use(salesAnalyticsRouter);
```

This order is intentional:

1. `salesAnalyticsGuardRouter` must run before every Sales Analytics surface.
2. `salesAnalyticsPaymentIntegrityReviewsRouter` must be mounted before the payment integrity workbench route because it owns `/sales-analytics/payment-integrity/reviews`.
3. `salesAnalyticsPaymentIntegrityRouter` owns `/sales-analytics/payment-integrity` and `/sales-analytics/payment-integrity/export`.
4. `salesAnalyticsRouter` remains the legacy/general analytics, export, reconciliation, and filter-options router.

Changing this order can break guard enforcement or cause nested review/export paths to be swallowed by the wrong router.

## 2. Capability Policy

Sales Analytics is currently management-only.

Capability fields:

```txt
canView
canExport
canReconcile
canInspectSources
isPlannedMode
plannedReason
```

Current policy:

```txt
OWNER   -> allowed
MANAGER -> allowed
ADMIN   -> allowed
CASHIER -> blocked
KITCHEN -> blocked
SERVER  -> blocked
custom-business mode -> blocked as planned
```

This is intentionally strict because the dashboard exposes revenue, COGS, margin, reconciliation, payment anomalies, and exportable data.

Do not open read-only access until export/reconciliation/source inspection controls are separated from the main dashboard.

## 3. Guarded Backend Surfaces

The Sales Analytics guard covers:

```txt
GET /api/sales-analytics-capabilities
/api/sales-analytics
/api/sales-analytics/export
/api/sales-analytics/reconciliation
/api/sales-analytics/filter-options
/api/sales-analytics/payment-integrity
/api/sales-analytics/payment-integrity/export
/api/sales-analytics/payment-integrity/reviews
```

Guard behavior:

- planned/custom-business mode returns `403` with `plannedReason`.
- export routes require `canExport`.
- reconciliation routes require `canReconcile`.
- filter/source/payment-integrity routes require `canInspectSources`.
- default sales analytics access requires `canView`.

## 4. Frontend Workspace Order

The active page is:

```txt
artifacts/pos-system/src/pages/dashboard/analytics.tsx
```

It directly renders:

```tsx
<SalesAnalyticsPaymentWorkspace />
```

The workspace renders in this order after capability guard passes:

```tsx
<SalesAnalyticsFilterSyncObserver />
<SalesAnalyticsSyncedReconciliationDrilldownPanel />
<SalesPaymentIntegrityWorkbenchPanel />
<SalesAnalyticsDashboard />
```

This order is intentional:

1. `SalesAnalyticsFilterSyncObserver` publishes active filter context.
2. `SalesAnalyticsSyncedReconciliationDrilldownPanel` consumes filter context and shows actionable reconciliation issues.
3. `SalesPaymentIntegrityWorkbenchPanel` consumes the same filter context and handles payment/order anomaly review workflow.
4. `SalesAnalyticsDashboard` remains the main dashboard and source of filter controls.

The older `SalesAnalyticsWorkspace` still exists, but the active analytics page uses `SalesAnalyticsPaymentWorkspace` directly.

## 5. Filter Sync

Filter sync uses:

```txt
sessionStorage key: sales-analytics:filter-context
event: sales-analytics:filter-sync
```

The observer reads dashboard controls from the DOM and publishes context containing:

```txt
label
query
filters.dateRange
filters.productLabel
filters.categoryLabel
filters.paymentMethodLabel
filters.orderStatusLabel
filters.search
```

The query sent to backend-backed consumers includes:

```txt
from
to
basis=paid
productId
categoryId
paymentMethod
orderStatus
q
page=1
pageSize=10
```

A duplicate-event guard prevents repeated reload loops when DOM mutations are caused by panel renders.

## 6. Reconciliation Drilldown

The synced reconciliation drilldown panel calls:

```ts
salesAnalyticsApi.getReconciliation(filterContext.query)
```

Supported issue mappings:

```txt
orders_without_paid_payment -> Payment Integrity Workbench
payment_total_mismatch      -> Payment Integrity Workbench
missing_cost_snapshots      -> Inventory Cost Snapshot Repair
zero_revenue_rows           -> Focus detail rows
cancelled_orders_excluded   -> Focus detail rows
scoped_cogs_hidden          -> informational/no repair needed
```

The panel can focus source rows or open a target workflow through bridge events.

## 7. Inventory Repair Bridge

For `missing_cost_snapshots`, Sales Analytics uses the existing inventory cost snapshot repair bridge:

```ts
openInventoryCostSnapshotRepair({
  sourceIssue: "missing_cost_snapshots",
  from,
  to,
  message,
});
```

Target route:

```txt
/dashboard/inventory#inventory-cost-snapshot-repair
```

This bridge shares the same period context as the active Sales Analytics filter.

## 8. Payment Integrity Workbench

The workbench endpoints are:

```txt
GET /api/sales-analytics/payment-integrity
GET /api/sales-analytics/payment-integrity/export?format=csv
GET /api/sales-analytics/payment-integrity/export?format=json
```

Supported issue filters:

```txt
all
orders_without_paid_payment
payment_total_mismatch
```

Supported review filters:

```txt
all
unreviewed
REVIEWED
IGNORED
RESOLVED
```

Rows include:

```txt
issueType
orderId
orderNumber
orderDate
orderStatus
paymentMethod
orderTotal
amountPaid
difference
paymentId
paymentStatus
paymentProvider
paidAt
recommendedAction
reviewStatus
reviewNote
reviewedById
reviewedAt
```

Important schema note:

- The current `Payment` model does not expose a payment amount field.
- `payment_total_mismatch` therefore compares `Order.amountPaid` against `Order.total`.
- Do not implement auto-repair for payment anomalies until the payment amount/source-of-truth model is clarified.

## 9. Payment Integrity Review Workflow

Runtime table:

```txt
SalesPaymentIntegrityReview
```

Unique key:

```txt
businessId + issueType + orderId
```

Supported review statuses:

```txt
REVIEWED
IGNORED
RESOLVED
```

Endpoints:

```txt
GET  /api/sales-analytics/payment-integrity/reviews
POST /api/sales-analytics/payment-integrity/reviews
```

Review note is required before save. This is intentional because payment anomaly review without a reason is not audit-friendly.

The frontend merges backend workbench rows with review rows by:

```txt
issueType + orderId
```

## 10. Review-Aware Export

Payment integrity export now includes review state.

CSV includes:

```txt
Review Status
Review Note
Reviewed By
Reviewed At
```

JSON export includes the same review fields in row payloads and includes `reviewStatus` in export metadata.

Export honors:

```txt
active Sales Analytics filters
issue filter
review filter
```

This prevents the classic broken workflow where the table is filtered but export silently dumps everything. Delightfully terrible. Avoid bringing that back.

## 11. Local Validation Checklist

Run builds:

```bash
pnpm --filter api-server build
pnpm --filter pos-system build
```

Smoke test:

1. Open Sales Analytics as OWNER/MANAGER/ADMIN.
2. Confirm non-management roles are blocked.
3. Confirm custom-business mode is blocked with planned reason.
4. Change date/product/category/payment/status/search filters.
5. Confirm reconciliation drilldown reloads with the active filter scope.
6. Click `missing_cost_snapshots` and confirm Inventory Repair opens with the same period.
7. Click `orders_without_paid_payment` and confirm Payment Integrity Workbench opens with that issue filter.
8. Click `payment_total_mismatch` and confirm Payment Integrity Workbench opens with that issue filter.
9. Filter workbench by `Unreviewed`, `Reviewed`, `Ignored`, and `Resolved`.
10. Save a review with a required note.
11. Confirm review status appears in the row.
12. Export CSV and confirm review columns are present.
13. Export JSON and confirm `meta.reviewStatus` and row review fields are present.
14. Refresh the browser and confirm review state persists.

## 12. Known Cautions

1. The filter sync observer is DOM-label based. If dashboard filter labels change, update `sales-analytics-filter-sync.ts`.
2. `SalesPaymentIntegrityReview` is a runtime raw SQL table, not a Prisma schema model.
3. Payment integrity still uses legacy business scoping patterns from the existing Sales Analytics service. Watch for `restaurantId` cleanup later.
4. Payment mismatch is based on `Order.amountPaid` vs `Order.total` because `Payment` does not currently expose an amount field.
5. The old `SalesAnalyticsWorkspace` still exists, but the active analytics page uses `SalesAnalyticsPaymentWorkspace`.
6. Auto-repair for payment/order anomalies is intentionally not implemented. Payment data should not be mutated automatically without a stronger source-of-truth model.

## 13. Current Module Status

```txt
Management-only guard ✅
Guarded workspace ✅
Filter sync ✅
Reconciliation drilldown ✅
Issue -> Inventory repair ✅
Issue -> Payment Integrity Workbench ✅
Payment integrity backend ✅
Payment integrity CSV/JSON export ✅
Payment issue review table ✅
Review status workflow ✅
Review note required ✅
Review filter backend ✅
Review filter UI ✅
CSV/JSON export includes review state ✅
Final audit doc ✅
```
