# Dashboard Feature Structure

This folder separates reusable business dashboards from Restaurant/F&B-only operational modules.

## Shared dashboards

`shared/` contains dashboards that can be reused by future business modes:

- `sales/` - Sales Analytics
- `customers/` - Customers & Partners
- `inventory/` - Inventory Management
- `cashflow/` - Cashflow
- `financial-reports/` - Financial Reports
- `invoice-generator/` - Invoice Generator
- `cashier-shift-reports/` - Cashier Shift Reports

Shared dashboards can be mounted by Restaurant/F&B today and by Retail, Service, or Warehouse modes later.

## F&B core system

`fnb/core-system/` contains operational modules that only belong to Restaurant/F&B:

- `menu/` - Menu Management and Recipe Management
- `kitchen/` - Kitchen Display System
- `server/` - Checkout, Orders, Payments, Table Management, and Serving

Do not add future Retail, Service, or Warehouse modules yet. Add mode-specific folders beside `fnb/` only when those real modules are implemented.

## Practical rule

Place business dashboards under `shared/` only when the concept can be reused by more than one business mode. Place mode-specific workflows under their mode folder.

## Shared systems

Phase 1 shared systems live under `shared/`:

- `types/` - reusable business models such as transactions, customers, suppliers, inventory, and analytics.
- `filters/` - reusable controlled filter components for search, date range, category, and status.
- `table/` - generic table primitives for consistent dashboard tables, toolbars, pagination, and column toggles.
- `cards/` - reusable stat/KPI cards and status pills.
- `export/` - centralized CSV and Excel-compatible export helpers.
- `dashboard/` - shared dashboard shell, panels, actions, filters, and tabs.

## App UI ownership

Reusable UI primitives live outside this folder in `components/shared/` and low-level shadcn-style primitives remain in `components/ui/`.

App shell concerns live in `components/core/`:

- `app-shell/`
- `sidebar/`
- `navbar/`
- `dashboard-layout/`
- `mode-selector/`
- `route-guard/`

Business modules should not be moved into `components/`.
