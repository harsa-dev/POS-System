# V3 Folder Structure

This is the recommended target structure for POS System V3.

It is a target direction, not an instruction to immediately move all files.

```txt
src/
  app/
    shell/
    router/
    providers/

  core/
    auth/
    permissions/
    settings/
    inventory/
    payments/
    analytics/
    audit/

  business/
    management/
    employees/
    attendance/
    shifts/
    reports/
    customers/
    cashflow/
    invoice/

  modules/
    restaurant/
      pos/
      kitchen/
      serving/
      tables/
      menu/
      recipes/
      orders/

    retail/
      cashier/
      catalog/
      barcode/
      receiving/
      stock-opname/
      shelf-management/
      promotions/

    raw-material/
      intake/
      weighing/
      batches/
      storage/
      processing/
      kandang/
      suppliers/

    custom-business/
      registry/
      feature-flags/
      config/

  shared/
    ui/
    logic/
    types/
    constants/

  lib/
    api/
    realtime/
    utils/
    errors/
```

## What Belongs In app

`app/` contains the application frame.

Belongs here:

- shell composition
- router composition
- provider composition
- app-level layout wiring

Does not belong here:

- inventory calculations
- payment rules
- permission policy
- Restaurant workflow logic
- Retail workflow logic
- Raw Material workflow logic

## What Belongs In core

`core/` contains reusable systems.

Belongs here:

- auth
- permissions
- settings
- inventory engine
- payments
- analytics
- audit

Core is reusable across business modes.

Core should expose stable capabilities to business and mode modules.

## What Belongs In business

`business/` contains shared business management modules.

Belongs here:

- employees
- attendance
- shifts
- reports
- customers
- cashflow
- invoice
- shared management screens

These modules are business-facing and reusable across modes.

## What Belongs In modules

`modules/` contains business-mode-specific workflows.

Restaurant belongs here:

- POS
- Kitchen
- Serving
- Tables
- Menu
- Recipes
- Orders

Retail belongs here when built later:

- Cashier
- Catalog
- Barcode
- Receiving
- Stock Opname
- Shelf Management
- Promotions

Raw Material belongs here when built later:

- Intake
- Weighing
- Batches
- Storage
- Processing
- Kandang
- Suppliers

Custom Business belongs here when built later:

- Registry
- Feature flags
- Configuration

## What Belongs In shared

`shared/` contains reusable, domain-free code.

Belongs here:

- buttons
- cards
- tables
- modals
- inputs
- layout primitives
- simple reusable hooks
- shared constants
- shared TypeScript utility types

Does not belong here:

- sales formulas
- inventory valuation
- order status rules
- payment rules
- kitchen logic
- barcode receiving logic
- kandang logic

## What Belongs In lib

`lib/` contains infrastructure helpers.

Belongs here:

- API client plumbing
- realtime connection helpers
- generic utilities
- error helpers

Does not belong here:

- business rules
- module workflows
- dashboard calculations
- permission policies

## Import Rules

Allowed direction:

```txt
app -> modules
app -> business
app -> core
app -> shared
app -> lib

modules -> business
modules -> core
modules -> shared
modules -> lib

business -> core
business -> shared
business -> lib

core -> shared
core -> lib

shared -> no business imports
lib -> no business imports
```

Forbidden direction:

- `shared` importing from `modules`
- `shared` importing from `business`
- `shared` importing from `core`
- `lib` importing from mode modules
- Restaurant importing Retail
- Retail importing Restaurant
- Raw Material importing Restaurant or Retail

## Module Registry Direction

The module registry should live near application composition once implemented.

It should define:

- module ID
- module label
- supported modes
- workspace routes
- sidebar items
- permissions
- feature flags
- active/planned/deprecated status

The registry should not contain business calculations.

## Sidebar Direction

Sidebar items should be generated from module metadata.

Inputs:

- current business mode
- enabled modules
- user permissions
- feature flags
- registered workspaces

The sidebar should not know implementation details of each workspace.

## Workspace Direction

A workspace should be task-oriented.

Examples:

- Restaurant POS Workspace
- Retail Cashier Workspace
- Raw Material Weighing Workspace

A workspace can compose shared UI, core systems, and business modules, but it should keep workflow-specific logic inside its owning mode module.

## What Should Not Be Built Yet

Do not build:

- Retail implementation folders
- Raw Material implementation folders
- Custom Business dynamic builder
- plugin system
- dashboard marketplace
- workflow automation engine

Only create these folders when real implementation begins.

## What Should Not Be Moved Yet

Do not move stable runtime code immediately.

Do not move:

- current Restaurant POS flow
- payment callbacks
- active backend contracts
- active Prisma models
- current working routes

Use the target structure as a migration guide, not a forced rewrite checklist.
