# Custom Business Service Shared Dashboard Wiring

This document records how Service / Custom Business mock data is wired into the shared dashboard layer.

## Scope

Implemented on `main`.

Files:

```txt
artifacts/pos-system/src/features/shared/service-business/service-business-shared-dashboard-bridge.tsx
artifacts/pos-system/src/features/shared/dashboard/dashboard-shell.tsx
```

## Purpose

The goal is to make shared dashboards aware of the Service / Custom Business workspace without activating the business mode selector or adding backend persistence.

This is a frontend-only bridge.

## Data source

The bridge reads existing mock service workspace data from:

```txt
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-workspace-data.ts
```

It also uses service calculation helpers from:

```txt
artifacts/pos-system/src/app/workspace/custom-business/service/service-business-workspace-domain.ts
```

## What the bridge exposes

The shared bridge computes:

```txt
active service jobs
estimated quote value
pending collection
average collection rate
high-priority service jobs
approved quote count
issued or partial invoice count
latest service status
```

## DashboardShell wiring

`DashboardShell` now maps known shared dashboard titles to a service bridge surface.

Examples:

```txt
Shared Business Dashboard -> business-overview
Sales Analytics -> sales
Customers & Partners -> customers
Inventory Management -> inventory
Cashflow -> cashflow
Financial Reports -> financial-reports
Invoice Generator -> invoice
Cashier Shift Reports -> cashier-shift-reports
HPP Calculator -> hpp
Shift Reports -> operation-reports
Team Management -> team-management
Shift Overview -> roster-overview
Employee Performance -> employee-performance
Audit Log -> audit-log
Approval Center -> approvals
Employee Contracts -> contracts
Employee Attendance -> attendance
Payroll -> payroll
Developer Monitoring -> platform-monitoring
```

If a dashboard title is not listed, `DashboardShell` renders normally without the service bridge.

## Safety constraints

This wiring must not:

```txt
modify Prisma schema
create migrations
create backend routes
call service API placeholders
make custom-business selectable
change restaurant workflow
change shared dashboard data sources permanently
```

## Current behavior

Every mapped shared dashboard renders a `Service Business shared bridge` panel below the dashboard header.

The panel shows:

```txt
Service jobs
Quote value
Pending collection
Latest status
```

It also explains that the data is frontend-only and still reads from mock service workspace data.

## Next cleanup

Run validation locally or through Codex:

```bash
pnpm run typecheck
pnpm --filter @workspace/pos-system run build
```

If a dashboard title changed, update `serviceBusinessSurfaceByTitle` in:

```txt
artifacts/pos-system/src/features/shared/dashboard/dashboard-shell.tsx
```

Do not bypass type errors with `any` or `// @ts-ignore`.
