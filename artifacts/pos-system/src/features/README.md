# Dashboard Feature Structure

This folder separates reusable business dashboards from Restaurant/F&B-only dashboards.

## Shared dashboards

`shared/` contains dashboards that can be reused by future business modes:

- `sales/` - Sales Analytics
- `customers/` - Customers & Partners
- `inventory/` - Inventory Management
- `cashflow/` - Cashflow
- `financial-reports/` - Financial Reports

Shared dashboards can be mounted by Restaurant/F&B today and by Retail, Service, or Warehouse modes later.

## F&B exclusive dashboards

`fnb/` contains modules that only belong to Restaurant/F&B:

- `tables/` - Table Management
- `menu/` - Menu Management
- `recipes/` - Recipe Management
- `kitchen/` - Kitchen Display System
- `serving/` - Serving Dashboard

Do not add future Retail, Service, or Warehouse dashboards here. Add new mode-specific folders beside `fnb/` when those modes are implemented.

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
