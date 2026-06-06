# V3 Migration Plan

POS System V3 should migrate using the Strangler Pattern.

The existing V2 structure should remain working while V3 workspaces are introduced beside it. Do not rewrite the app. Do not break Restaurant mode. Do not move stable code unless a workspace is actively being migrated.

## Strangler Pattern Rules

1. Keep V2 routes working.
2. Create V3 workspace routes beside old routes.
3. Migrate one workspace at a time.
4. Validate the V3 workspace.
5. Redirect the old route only after the V3 workspace is stable.
6. Remove old code only after imports, routes, and user flows are no longer active.

## Migration Order

Recommended order:

1. Document boundaries and module ownership.
2. Add module registry metadata without changing runtime behavior.
3. Add sidebar generation using registry data for a small safe area.
4. Add one V3 workspace route beside one old route.
5. Migrate a low-risk workspace first.

Avoid starting with payments, checkout, or kitchen flow because they are active operational paths.

## First 5 Safest Migration Steps

1. Create V3 architecture docs and folder boundary rules.
2. Define module IDs, workspace IDs, and sidebar metadata in documentation.
3. Create registry shape planning before implementation.
4. Migrate non-critical shared dashboards first, such as reports or analytics views.
5. Add redirects only after the new workspace has been tested manually and through build checks.

## First 5 Dangerous Moves To Avoid

1. Moving Restaurant POS, Kitchen, Orders, or Payments before the registry and route strategy are stable.
2. Replacing V2 routes immediately with V3 routes.
3. Changing backend contracts during frontend architecture migration.
4. Creating Retail, Raw Material, and Custom Business implementations before Restaurant V3 is stable.
5. Turning `lib/`, `shared/`, or a generic service folder into a dumping ground for business logic.

## Folder Boundary Rules

### app

Allowed:

- app shell
- router
- providers
- app composition

Not allowed:

- business formulas
- permission rules
- inventory workflows
- mode-specific screens

### core

Allowed:

- auth
- permissions
- settings
- inventory engine
- payments
- analytics
- audit

Not allowed:

- restaurant kitchen UI
- retail cashier UI
- raw-material weighing UI
- business-mode-specific workflow screens

### business

Allowed:

- management
- employees
- attendance
- shifts
- reports
- customers
- cashflow
- invoice

Not allowed:

- kitchen queue
- table assignment
- barcode scanner workflow
- kandang operations

### modules

Allowed:

- Restaurant workflows
- Retail workflows
- Raw Material workflows
- Custom Business configuration workflows

Not allowed:

- shared UI primitives
- infrastructure API helpers
- global permission engine

### shared

Allowed:

- UI primitives
- domain-free logic
- shared types
- constants

Not allowed:

- business mode rules
- inventory valuation rules
- payment decisions
- route ownership

### lib

Allowed:

- API client helpers
- realtime helpers
- error utilities
- generic utilities

Not allowed:

- business calculations
- module workflows
- dashboard state ownership
- permission policy

## Import Dependency Rules

Preferred dependency direction:

- `app` may import from `core`, `business`, `modules`, `shared`, and `lib`.
- `modules` may import from `core`, `business`, `shared`, and `lib`.
- `business` may import from `core`, `shared`, and `lib`.
- `core` may import from `shared` and `lib`.
- `shared` should not import from `core`, `business`, or `modules`.
- `lib` should not import from `core`, `business`, or `modules`.

Mode-specific modules should not import from other mode-specific modules.

Restaurant should not import Retail.

Retail should not import Restaurant.

Raw Material should not import Restaurant or Retail.

Shared behavior should be promoted into `core` or `business` only when it is genuinely reusable.

## Module Registry Direction

The module registry should describe modules, not execute business logic.

Registry metadata should include:

- module ID
- display label
- supported business modes
- workspace routes
- sidebar items
- permission keys
- feature flags
- status: planned, active, deprecated

The registry should help generate routes and sidebar items without scattering mode checks across the app.

## Sidebar Generation Direction

Sidebar generation should use:

- active business mode
- enabled modules
- user permissions
- workspace registry
- feature flags

Avoid:

- large switch statements in UI components
- repeated `businessMode === "restaurant"` checks
- hardcoded duplicated sidebar arrays per mode

## Workspace Composition Direction

Each workspace should be composed from:

- workspace shell
- header
- actions
- filters
- main operating panel
- side panel or drawer when needed
- status widgets

Reusable UI belongs in `shared/ui`.

Business rules belong in `core`, `business`, or the relevant mode module.

## What Should Not Be Built Yet

Do not build:

- full Retail mode
- full Raw Material mode
- full Custom Business builder
- plugin marketplace
- dynamic dashboard builder
- workflow automation engine
- database split
- microservices

## What Should Not Be Moved Yet

Do not move:

- stable Restaurant POS
- Kitchen
- Serving
- Tables
- Menu
- Recipes
- Orders
- Payments
- active backend routes
- Prisma schema
- payment callbacks

Only migrate a module when its V3 replacement route and validation plan are ready.
