# POS System V3 Vision

POS System V3 is evolving from a restaurant POS into a modular Business Operating System that can support multiple business modes without rewriting the application.

The agreed direction is:

- One app.
- One backend.
- One database.
- Modular monolith.
- No microservices.
- No database split.
- No full rewrite.
- Incremental migration.
- Workspace-based UI instead of page-based dashboard sprawl.

Restaurant mode remains the active and stable mode. Retail, Raw Material / Livestock / Kandang, and Custom Business should be planned architecturally before implementation.

## Primary Goal

The goal of V3 is to separate stable core systems, shared business management modules, and mode-specific operational workflows.

The application should not become a large conditional dashboard where every component asks which business mode is active. Instead, each mode should be composed from registered modules and workspaces.

## Architecture Layers

### app

`app/` owns application composition.

It should contain:

- shell setup
- router setup
- app-level providers
- layout composition
- app bootstrapping

It should not contain business rules, inventory formulas, payment rules, or mode-specific workflows.

### core

`core/` contains reusable core systems that are used by many modules.

It should contain:

- auth
- permissions
- settings
- inventory engine
- payments
- analytics
- audit

Core systems should be reusable across Restaurant, Retail, Raw Material, and Custom Business modes.

Core should not contain workflow UI such as kitchen screens, cashier screens, stock opname pages, weighing forms, or kandang operations.

### business

`business/` contains shared business management modules.

It should contain:

- management
- employees
- attendance
- shifts
- reports
- customers
- cashflow
- invoice

These modules are business-wide and reusable across modes. They are not tied to Restaurant, Retail, or Raw Material workflow details.

### modules

`modules/` contains mode-specific workflows.

It should contain:

- restaurant
- retail
- raw-material
- custom-business

Mode modules describe how a specific kind of business operates day to day.

Examples:

- Restaurant uses POS, kitchen, serving, tables, menu, recipes, and orders.
- Retail uses cashier, catalog, barcode, receiving, stock opname, shelf management, and promotions.
- Raw Material uses intake, weighing, batches, storage, processing, kandang, and suppliers.
- Custom Business uses registry, feature flags, and config.

### shared

`shared/` contains domain-free reusable UI, lightweight logic, shared types, and constants.

It should contain:

- ui
- logic
- types
- constants

Shared code must not know about Restaurant, Retail, Raw Material, or Custom Business workflows.

### lib

`lib/` contains infrastructure helpers.

It should contain:

- api
- realtime
- utils
- errors

Lib should not become a business logic layer. It should support infrastructure concerns only.

## Workspace-Based UI

V3 should use workspace-based UI instead of a traditional page-based dashboard tree.

A workspace is a task-focused operating area, such as:

- Restaurant POS Workspace
- Kitchen Workspace
- Retail Cashier Workspace
- Stock Receiving Workspace
- Raw Material Weighing Workspace
- Batch Processing Workspace

Dashboards can still exist, but the core product experience should be organized around workspaces that match real business operations.

## Mode Strategy

Business modes should be composed from modules.

Restaurant mode can use:

- shared business modules
- core systems
- restaurant-specific modules

Retail mode can use:

- shared business modules
- core systems
- retail-specific modules

Raw Material mode can use:

- shared business modules
- core systems
- raw-material-specific modules

Custom Business mode should use:

- shared business modules
- selected compatible modules
- configuration
- feature flags

Custom Business should not become a free-form app builder.

## What Should Not Be Built Yet

Do not build these yet:

- full Retail mode
- full Raw Material mode
- full Custom Business builder
- plugin marketplace
- microservices
- database-per-mode
- workflow automation engine
- external hardware integrations beyond what is already needed
- advanced reporting engine
- AI recommendations

Plan for these, but do not implement them until the current V3 foundation is stable.

## What Should Not Be Moved Yet

Do not move stable runtime code only to match the target folder structure.

Do not move:

- stable Restaurant mode workflows
- working POS, kitchen, serving, tables, menu, recipes, or orders code
- backend contracts
- Prisma models
- payment callbacks
- active API clients
- working routes

Move code only when a workspace is being migrated and the replacement is validated.

## Migration Philosophy

Use the Strangler Pattern.

Keep old V2 routes working while V3 workspace routes are introduced beside them. Migrate one workspace at a time. Only redirect old routes after the V3 workspace is stable, tested, and accepted.

This protects the active Restaurant mode while allowing the architecture to improve incrementally.
