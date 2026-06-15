# POS System V3 Phase 4B Raw Material Persistence

## Summary

Phase 4B keeps Raw Material scoped to real operational persistence that already exists, and removes over-claimed finance/procurement/invoice/costing surfaces from normal Raw Material shared-dashboard flow.

No Prisma schema change was made.

## Surface Classification

| Surface | Classification | Reason |
| --- | --- | --- |
| Material list | Real read-only through batches/intakes | The current schema stores material identity on intakes and batches, not a standalone material master. |
| Supplier list | Real persisted | `RawMaterialSupplier` and backend supplier routes exist. |
| Stock level | Real persisted | Batch remaining quantity and storage usage are persisted. |
| Stock movement | Real persisted | Stock movements have guarded backend routes, audit logging, and ledger rules. |
| Low-stock alerts | Planned | No standalone material master or minimum-stock model exists yet. |
| Procurement cashflow | Planned / unsupported | No Raw Material purchase/payable model exists. |
| Supplier invoice hold | Planned / unsupported | Shared invoice model is customer-facing; no supplier invoice hold model exists. |
| HPP / COGS costing | Planned / unsupported | No average-cost, purchase item, or COGS ledger exists. |
| Inventory shared dashboard | Real read-only | Backed by Raw Material summary metrics. |
| Cashflow shared dashboard | Unsupported for Raw Material | Hidden from Raw Material navigation until procurement/payable persistence exists. |
| Financial Reports shared dashboard | Unsupported for Raw Material | Hidden until costing/accounting data exists. |
| Invoice Generator shared dashboard | Unsupported for Raw Material | Hidden until supplier invoice records exist. |
| Customers & Partners shared dashboard | Real read-only | Reframed as supplier partner context from persisted supplier summary. |
| Sales Analytics shared dashboard | Real read-only | Reframed as operational throughput analytics, not sales revenue. |
| Shift Cashier Reports shared dashboard | Read-only / not normal navigation | Raw Material uses operational activity context where bridged, not cashier revenue. |

## Prisma / Database Decisions

No schema change was made.

Existing Raw Material models already cover:

```txt
RawMaterialSupplier
RawMaterialStorageLocation
RawMaterialIntake
RawMaterialWeighing
RawMaterialBatch
RawMaterialProcessingRun
RawMaterialKandangPen
RawMaterialStockMovement
```

Missing models intentionally not added in this phase:

```txt
RawMaterialPurchase
RawMaterialPurchaseItem
RawMaterialSupplierInvoice
RawMaterialCostLedger
RawMaterial master item with minimum stock / average cost
```

Reason: enabling procurement cashflow, invoice hold, or HPP/COGS without these would make preview data look real.

## Backend / API Decisions

No backend route or service change was required.

The frontend now treats the existing `GET /raw-material/summary` endpoint as the canonical read source for supported shared-dashboard Raw Material context.

Existing backend protections remain:

```txt
requireBusinessMode(["raw-material"])
requireRawMaterialPermission(...)
businessId scoping
stock movement guards
audit logging
```

## Frontend Workflow Changes

- Raw Material shared-dashboard bridge now loads the backend summary API when Raw Material mode is active.
- Supported operational shared dashboards use persisted summary metrics when available.
- Sample fallback remains only as a backend-offline fallback and is labeled as fallback.
- Procurement cashflow, supplier invoice hold, financial reports, and HPP are removed from Raw Material supported shared-dashboard flow.
- Sidebar/module support was tightened so unsupported finance/invoice/payroll/attendance/contract/roster surfaces are not normal Raw Material navigation.

## Shared Dashboard Wiring

Supported for Raw Material:

```txt
Business overview
Sales analytics as operational analytics
Customers & Partners as supplier partners
Inventory as batch/storage/stock movement context
Team management as responsibility context
Employee performance as operational performance context
Approvals as read-only quality/kandang review context
```

Unsupported or planned for Raw Material:

```txt
Cashflow
Financial Reports
Invoice Generator
HPP Calculator
Payroll
Attendance
Contracts
Roster Overview
Platform Monitoring
```

## Commands Run

Passed:

```bash
.\node_modules\.bin\tsc.CMD -p artifacts\pos-system\tsconfig.raw-material.json --noEmit
```

Further verification should run after final static checks.

## Known Limitations

- Browser QA remains blocked by the local browser runtime issue from Phase 4A.
- `pnpm` commands may remain blocked by `EPERM: operation not permitted, lstat 'C:\Users\LENOVO'`.
- Raw Material does not yet have a standalone material master with minimum stock and average cost.
- Procurement cashflow, supplier invoice hold, and HPP/COGS are intentionally not active until schema and API support exist.

## Manual QA Checklist

- Select Raw Material from `/select-mode`.
- Confirm Raw Material operational modules remain visible.
- Confirm Cashflow, Financial Reports, Invoice Generator, HPP, Payroll, Attendance, Contracts, and Roster Overview are not normal Raw Material navigation.
- Open shared overview, customers, inventory, team, employee performance, and approvals while Raw Material is active.
- Confirm the bridge badge says backend summary when the API is available.
- Stop or block the backend and confirm sample fallback is clearly labeled.
- Open Cashflow, Financial Reports, Invoice Generator, or HPP directly while Raw Material is active.
- Confirm the dashboard reports that Raw Material is not available for that surface.

## Next Recommended Task

Design and implement the minimal Raw Material procurement and supplier invoice schema before enabling cashflow, invoice hold, or HPP/COGS as real workflows.
