# Financial Reports Final Audit

## Scope

This audit documents the current Financial Reports workspace after the guard, drilldown, reconciliation, period sync, repair workflow, repair feedback, and repair audit phases.

The Financial Reports workspace is intentionally management-only. It should be treated as a sensitive reporting surface because it exposes profit/loss, cashflow, receivables, source reconciliation, repair workflows, and exportable audit trails.

## Backend route order

Financial Reports depends on specific route ordering so guarded and specific routes execute before broad routers.

Current expected order in `artifacts/api-server/src/routes/index.ts`:

```ts
router.use(inventoryCostSnapshotRepairsRouter);
router.use(inventoryRouter);
router.use(cashflowRouter);
router.use(financialReportsGuardRouter);
router.use(financialReportsRepairAuditRouter);
router.use(reportsRouter);
```

Important behavior:

- `financialReportsGuardRouter` must stay before `reportsRouter`.
- `financialReportsRepairAuditRouter` must stay after the guard and before `reportsRouter`.
- `inventoryCostSnapshotRepairsRouter` must stay before `inventoryRouter`.
- Invoice-specific routers must stay before `invoicesRouter` because the invoice module owns nested and action routes.

## Frontend workspace order

Current expected render order in `FinancialReportsWorkspace`:

```tsx
<FinancialReportsPeriodSyncObserver />
<FinancialReportsDrilldownPanel />
<FinancialReportsRepairFeedbackPanel />
<FinancialReportsRepairAuditPanel />
<FinancialReportsReconciliationDrilldownPanel />
<FinancialReportsDashboard />
```

Reasoning:

1. Period sync observer publishes the active report period.
2. Generic drilldowns expose Invoice and Cashflow navigation.
3. Repair feedback shows the result after Inventory backfill.
4. Repair audit trail shows exported repair history.
5. Reconciliation drilldown shows issue-level tables and repair actions.
6. The original dashboard remains the canonical financial report view.

## Capability and guard policy

Financial Reports is management-only.

Expected capabilities route:

```txt
GET /api/financial-reports-capabilities
```

Expected permissions:

- `canView`: management only.
- `canExport`: management only.
- `canReconcile`: management only.
- `canInspectSources`: management only.
- Planned/custom-business mode should return a planned reason and block the workspace.

Do not make this role-readable for kitchen/server/cashier without first splitting the dashboard into read-only and mutation/export surfaces. The current dashboard still includes export, reconciliation, and repair-adjacent workflows.

## Period sync

Period sync is event/sessionStorage based.

Storage key:

```txt
financial-reports:period-context
```

Event:

```txt
financial-reports:period-sync
```

Payload:

```ts
type FinancialReportsPeriodContext = {
  label: string;
  from: string;
  to: string;
  basis: "accrual" | "cash";
};
```

Consumers:

- `FinancialReportsReconciliationDrilldownPanel`
- `FinancialReportsRepairAuditPanel`
- generic Financial Reports drilldown actions
- Invoice drilldown receiver via `from/to`
- Cashflow drilldown receiver via `from/to`

Known caution:

- The observer reads the Financial Reports dashboard selector from the DOM instead of directly owning the selector state. This was intentional to avoid rewriting the large dashboard file. If the dashboard selector labels change, update `financial-reports-period-sync-observer.tsx` and `financial-reports-period-sync.ts` together.

## Drilldown bridges

Financial Reports uses client-side sessionStorage bridges for cross-dashboard navigation.

### Financial Reports to Invoice Generator

Used for:

- open receivables
- overdue receivables
- reconciliation issue drilldown

Expected target:

```txt
/dashboard/invoice-generator#invoice-history-operations
```

Payload supports:

- `search`
- `status`
- `overdue`
- `from`
- `to`
- `invoiceId`
- `invoiceNumber`
- `message`

### Financial Reports to Cashflow

Used for:

- cash in ledger
- cash out ledger
- pending cashflow reconciliation issue
- voided cashflow reconciliation issue

Expected target:

```txt
/dashboard/cashflow#financial-report-cashflow-drilldown
```

Payload supports:

- `type`
- `status`
- `search`
- `from`
- `to`
- `message`

### Financial Reports to Inventory Repair

Used for:

- `missing_cost_snapshots` reconciliation issue

Expected target:

```txt
/dashboard/inventory#inventory-cost-snapshot-repair
```

Payload supports:

- `from`
- `to`
- `sourceIssue`
- `message`

### Inventory Repair to Financial Reports Feedback

Used after cost snapshot backfill.

Expected target:

```txt
/dashboard/financial-reports#financial-reports-repair-feedback
```

Payload supports:

- `sourceIssue`
- `from`
- `to`
- `repairedCount`
- `repairedValue`
- `repairedMovementIds`
- `message`
- `completedAt`

## Repair workflow

Repair flow for missing cost snapshots:

1. Financial Reports reconciliation identifies `missing_cost_snapshots`.
2. User clicks `Open Repair`.
3. Inventory repair panel consumes the repair payload.
4. Preview endpoint lists repairable and non-repairable stock movements.
5. User clicks `Backfill Repairable`.
6. Backend updates `StockMovement.unitCostSnapshot` from `InventoryItem.costPerUnit`.
7. Backend writes an `AuditLog` event per repaired movement.
8. Inventory panel creates feedback payload.
9. User clicks `Review Reconciliation`.
10. Financial Reports feedback panel shows repair summary and republishes the period context.
11. Reconciliation drilldown and repair audit trail reload for the same range.

Repair assumption:

- Backfill uses current `InventoryItem.costPerUnit`, not historical cost. This is acceptable as a pragmatic repair action, but it must remain visible in docs and audit assumptions.

## Export surfaces

Financial Reports currently has these export paths:

- Financial Reports export from the original report dashboard.
- Repair audit export CSV/JSON.
- Follow-up export belongs to Invoice Generator, not Financial Reports.
- Invoice history export belongs to Invoice Generator.
- Cashflow ledger export belongs to Cashflow.

Repair audit export endpoints:

```txt
GET /api/financial-reports/repair-audit/export?format=csv
GET /api/financial-reports/repair-audit/export?format=json
```

Expected guard:

- The Financial Reports guard must apply before these endpoints.
- Export should remain management-only.

## Smoke test checklist

Run builds:

```bash
pnpm --filter api-server build
pnpm --filter pos-system build
```

Manual checks:

1. Login as OWNER or MANAGER.
2. Open Financial Reports.
3. Confirm guarded workspace renders all panels.
4. Change period selector in the main dashboard.
5. Confirm reconciliation drilldown period changes.
6. Confirm repair audit range changes.
7. Click `Open Receivables` and confirm Invoice history receives `from/to`.
8. Click `Show Overdue` and confirm Invoice history applies overdue filter.
9. Click `Open Cash In` and confirm Cashflow drilldown receives `type=INCOME` plus `from/to`.
10. Click `Open Cash Out` and confirm Cashflow drilldown receives `type=EXPENSE` plus `from/to`.
11. Trigger `missing_cost_snapshots` repair flow from reconciliation drilldown.
12. Run Inventory backfill preview and repair on safe local data.
13. Click `Review Reconciliation` and confirm Financial Reports feedback appears.
14. Confirm repair audit trail lists the new repair event.
15. Export repair audit CSV and JSON.
16. Login as CASHIER/KITCHEN/SERVER and confirm Financial Reports is blocked.
17. Test planned/custom-business mode and confirm Financial Reports is blocked.

## Known caution list

- The period observer depends on DOM selectors from the original Financial Reports dashboard.
- Raw SQL routes rely on exact database column names and JSON field structure.
- Repair audit reads `AuditLog.changes` as JSON. If `changes` changes schema, repair audit must be updated.
- Repair backfill uses current item cost, not historical item cost.
- Cross-dashboard drilldown bridges use `sessionStorage`, so they are browser-tab scoped.
- Financial Reports route guard must remain before Financial Reports report/export routes.
- Inventory repair route must remain before the general Inventory route.

## Next recommended phase

After this audit, run local builds and smoke tests. If the Financial Reports build passes, move to the next shared dashboard instead of adding more Financial Reports features immediately.

Recommended next dashboard candidates:

1. Shift Cashier Reports
2. Sales Analytics
3. Inventory Management hardening

Do not start Financial Reports read-only role support until export and mutation controls are split from the main dashboard UI.
