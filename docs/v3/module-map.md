# V3 Module Map

This document defines the ownership map for POS System V3 modules.

The goal is to keep Restaurant mode stable while preparing for Retail, Raw Material / Livestock / Kandang, and Custom Business through a modular monolith architecture.

## Core Systems

Core systems are reusable across all business modes.

Core belongs in `core/`.

Recommended core modules:

- Auth
- Permissions
- Settings
- Inventory Engine
- Payments
- Analytics
- Audit

Core systems should provide capabilities used by business and mode modules.

Core should not contain mode-specific workflow UI.

## Business Management Modules

Business management modules are reusable business operations that are not tied to a single mode.

Business management belongs in `business/`.

Recommended business modules:

- Management
- Employees
- Attendance
- Shifts
- Reports
- Customers
- Cashflow
- Invoice

These modules can be used by Restaurant, Retail, Raw Material, and Custom Business.

## Restaurant Modules

Restaurant is the active stable mode.

Restaurant modules belong in `modules/restaurant/`.

Restaurant modules:

- POS
- Kitchen
- Serving
- Tables
- Menu
- Recipes
- Orders

Restaurant owns workflows such as:

- customer order
- cart
- table assignment
- kitchen queue
- serving queue
- payment handoff
- receipt
- menu and recipe inventory deduction

Restaurant should use core inventory and payments, but should own restaurant-specific order flow and operational screens.

## Retail / Supermarket Modules

Retail should be planned but not built yet.

Retail modules will belong in `modules/retail/`.

Recommended future modules:

- Cashier
- Catalog
- Barcode
- Receiving
- Stock Opname
- Shelf Management
- Promotions

Retail-specific concepts:

- barcode
- SKU
- product variant
- shelf / rack / bin
- supplier receiving
- price labels
- stock count
- promo rules
- fast checkout

Retail should reuse:

- core payments
- core inventory engine
- business customers
- business cashflow
- business reports
- business invoice
- cashier shifts

Retail should not reuse:

- restaurant tables
- kitchen queue
- serving queue
- restaurant menu recipe flow as-is

## Raw Material / Livestock / Kandang Modules

Raw Material should be planned but not built yet.

Raw Material modules will belong in `modules/raw-material/`.

Recommended future modules:

- Intake
- Weighing
- Batches
- Storage
- Processing
- Kandang
- Suppliers

Raw-material-specific concepts:

- batch / lot
- weighing
- gross weight
- tare weight
- net weight
- supplier intake
- purchase receiving
- livestock group
- kandang / pen
- cold storage
- shrinkage
- waste
- loss
- transformation
- unit conversion
- dynamic pricing

Raw Material should reuse:

- core inventory engine
- core analytics
- core audit
- business suppliers
- business cashflow
- business reports

Raw Material should keep separate:

- weighing workflows
- batch transformation logic
- kandang operations
- livestock-specific tracking

## Custom Business Modules

Custom Business should be module-composition based.

Custom Business belongs in `modules/custom-business/`.

Recommended future modules:

- Registry
- Feature Flags
- Config

Custom Business should allow users to enable approved modules, not create arbitrary unsupported workflows.

Custom Business should use:

- module registry
- enabled feature flags
- business mode configuration
- sidebar generation from registered modules
- workspace generation from registered modules

Custom Business should not become:

- a drag-and-drop app builder
- a plugin marketplace
- a no-code workflow system
- a reason to add business-mode checks everywhere

## Shared Layer

Shared belongs in `shared/`.

Shared should contain:

- UI primitives
- domain-free reusable logic
- shared types
- shared constants

Shared should not contain:

- business rules
- mode-specific workflows
- inventory valuation policy
- payment policy
- permissions policy

## Infrastructure Layer

Infrastructure helpers belong in `lib/`.

Lib should contain:

- API helpers
- realtime helpers
- utility functions
- error helpers

Lib should not contain business logic.

## What Should Not Be Built Yet

Do not build:

- Retail implementation
- Raw Material implementation
- Custom Business builder
- module marketplace
- microservices
- separate databases
- generic workflow engine

## What Should Not Be Moved Yet

Do not move stable Restaurant runtime code yet.

Do not move:

- POS
- Kitchen
- Serving
- Tables
- Menu
- Recipes
- Orders
- Payments
- active backend contracts
- active routes

Move one workspace at a time only when the V3 route and validation plan are ready.

