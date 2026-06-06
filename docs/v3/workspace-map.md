# V3 Workspace Map

POS System V3 should be organized around workspaces. A workspace is a focused operating area where users complete a real business workflow.

Workspaces are different from dashboards. A dashboard summarizes information. A workspace supports action.

## Shared Business Workspaces

These workspaces are reusable across all business modes:

- Sales Analytics
- Customers
- Suppliers
- Cashflow
- Financial Reports
- Invoice Generator
- Cashier Shift Reports
- Inventory Overview
- Reports

These belong in `business/` when they represent business management, or `core/` when they represent reusable engines.

## Restaurant Workspaces

Restaurant mode is the active stable mode.

Restaurant workspaces:

- POS Workspace
- Kitchen Workspace
- Serving Workspace
- Tables Workspace
- Menu Workspace
- Recipes Workspace
- Orders Workspace

Restaurant workflow:

- customer order
- cart
- table assignment
- kitchen queue
- serving queue
- payment
- receipt
- menu and recipe inventory deduction

Restaurant modules belong in `modules/restaurant/`.

## Retail / Supermarket Workspaces

Retail mode should not be built yet, but the architecture should prepare for it.

Recommended future workspaces:

- Cashier Workspace
- Product Catalog Workspace
- Barcode / SKU Workspace
- Receiving Workspace
- Stock Opname Workspace
- Shelf Management Workspace
- Promotions Workspace
- Price Label Workspace

Retail-specific workflows:

- barcode scanning
- fast checkout
- SKU lookup
- supplier stock receiving
- shelf, rack, and bin management
- price label management
- promotions and discount rules
- stock opname

Retail should reuse:

- payments
- sales records
- receipts
- customers
- suppliers
- inventory engine
- cashier shifts
- cashflow
- financial reports

Retail should not reuse:

- restaurant tables
- kitchen queue
- serving queue
- menu recipe flow as-is
- restaurant order lifecycle as-is

## Raw Material / Livestock / Kandang Workspaces

Raw Material mode should not be built yet, but the architecture should prepare for it.

Recommended future workspaces:

- Supplier Intake Workspace
- Weighing Workspace
- Batch Inventory Workspace
- Storage Workspace
- Processing Workspace
- Kandang Workspace
- Shrinkage / Waste Workspace
- Dynamic Pricing Workspace

Raw-material-specific workflows:

- purchase receiving
- batch tracking
- weighing
- gross, tare, and net weight
- storage location tracking
- cold storage
- livestock group tracking
- kandang / pen tracking
- transformation from raw material to output batch
- shrinkage, waste, and loss reporting
- unit conversion
- dynamic pricing by grade, weight, or batch

Raw Material should reuse:

- inventory engine
- suppliers
- purchase receiving concepts
- stock movement ledger
- cashflow
- reports
- analytics
- audit

Raw Material should keep separate:

- weighing workflows
- batch transformation
- livestock/kandang tracking
- raw-material yield calculations
- cold storage operations

## Custom Business Workspaces

Custom Business mode should be module-composition based.

It should allow a business to enable compatible modules, such as:

- Sales
- Customers
- Suppliers
- Inventory
- Cashflow
- Invoice
- Reports
- Cashier Shifts

Custom Business should not allow unlimited arbitrary workspace creation in the first version.

The user should choose modules from approved presets. The app should generate sidebar items and routes from the module registry.

## Workspace Route Direction

V3 routes should be introduced beside old routes.

Recommended route direction:

- `/v3/restaurant/pos`
- `/v3/restaurant/kitchen`
- `/v3/restaurant/serving`
- `/v3/restaurant/tables`
- `/v3/restaurant/menu`
- `/v3/restaurant/recipes`
- `/v3/restaurant/orders`
- `/v3/retail/cashier`
- `/v3/retail/catalog`
- `/v3/retail/receiving`
- `/v3/retail/stock-opname`
- `/v3/raw-material/intake`
- `/v3/raw-material/weighing`
- `/v3/raw-material/batches`
- `/v3/raw-material/storage`
- `/v3/custom-business/workspaces`

Old V2 routes should keep working until the matching V3 workspace is stable.

## Sidebar Generation Direction

The sidebar should be generated from enabled modules and workspace registrations.

Sidebar inputs:

- active business mode
- enabled module IDs
- user permissions
- route availability
- workspace metadata

Sidebar should not be hardcoded with large mode conditionals.

## Workspace Composition Direction

A workspace may be composed from:

- workspace shell
- toolbar
- filters
- actions
- primary panel
- secondary panel
- detail drawer
- status widgets
- table or queue

Composition should reuse shared UI from `shared/ui`, but business decisions should stay in `core`, `business`, or `modules`.

## What Should Not Be Built Yet

Do not build:

- Retail workspace implementations
- Raw Material workspace implementations
- Custom workspace builder
- drag-and-drop dashboards
- advanced widget marketplace
- generic workflow engine

Only document and prepare the registry direction.

## What Should Not Be Moved Yet

Do not move stable Restaurant routes or components solely to satisfy the target workspace naming.

Migrate one workspace only when:

- the target V3 workspace route exists
- the old route still works
- the new route is tested
- sidebar registration is clear
- permissions are verified
