# System Architecture

## 1. Purpose

This document defines the technical architecture for POS System V3.

It explains how the system should be structured at the application, module, backend, database, deployment, and integration level.

The goal is to make the project maintainable, scalable enough for MVP, easy to debug, and safe for future expansion.

This document does not define detailed API contracts, database schema, frontend UI behavior, or deployment steps. Those areas are handled in separate documents.

---

## 2. Current Context

POS System V3 is currently built as a web-based application focused on Restaurant / F&B operations.

The current active mode is:

```txt
Restaurant / F&B
```

The system is being redesigned into a modular multi-mode business platform.

Planned modes:

```txt
Restaurant / F&B
Retail / Supermarket
Raw Material / Livestock / Kandang
Service / Custom Business
```

Current recommended architecture:

```txt
Modular monolith first.
One app.
One backend.
One database.
Shared core systems.
Shared business dashboards.
Mode-specific workflows.
```

The system should not use microservices, database-per-mode, Kubernetes, event streaming, or complex distributed infrastructure at this stage.

Architecture must support future growth, but implementation must remain simple enough to build and maintain.

---

## 3. Decisions

The following architecture decisions are locked:

1. POS System V3 uses modular monolith architecture.
2. The frontend and backend may live in one Next.js application during MVP.
3. The database is PostgreSQL.
4. Prisma is used as the ORM.
5. The first active mode is Restaurant / F&B.
6. Other modes are planned but not fully implemented in MVP.
7. Core systems are shared across modes.
8. Shared dashboards are reusable across modes.
9. Mode-specific workflows must live inside mode-specific modules.
10. Core modules must not depend on mode-specific modules.
11. Shared modules must not depend on mode-specific workflow details.
12. Mode-specific modules may depend on core and shared modules.
13. Business logic must not live inside UI components.
14. Route handlers must stay thin.
15. Service layer owns business logic.
16. Repository/data-access layer owns database access.
17. Backend must enforce auth, scope, permission, validation, and business rules.
18. Frontend must not directly access the database.
19. PostgreSQL is the source of persisted data.
20. Object storage should be used for files.
21. Redis, queues, WebSocket, and workers are future additions, not MVP defaults.
22. Microservices are out of scope until there is a proven bottleneck.
23. Folder structure must reflect responsibility, not vibes.

---

## 4. Rules

### 4.1 Architecture Rules

1. Keep the architecture modular monolith first.
2. Do not split into microservices during MVP.
3. Do not create separate apps per business mode.
4. Do not create separate databases per business mode.
5. Do not introduce infrastructure that is not required yet.
6. Keep stable Restaurant / F&B flow working while refactoring.
7. Separate core, shared, and mode-specific responsibilities.
8. Do not duplicate core systems per mode.
9. Do not place business logic inside React components.
10. Do not let route handlers become giant service files.

### 4.2 Dependency Rules

Allowed dependency direction:

```txt
Mode-Specific Module
↓
Shared Dashboard Module
↓
Core System
↓
Infrastructure / Database
```

Core must not import from:

```txt
restaurant mode
retail mode
raw material mode
service mode
shared dashboard UI
```

Shared modules must not import from:

```txt
restaurant workflow
retail workflow
raw material workflow
service workflow
```

Mode-specific modules may import from:

```txt
core
shared
their own mode folder
```

Mode-specific modules must not directly import from another mode.

Bad:

```txt
restaurant/kitchen imports retail/barcode
retail/checkout imports restaurant/tables
raw-material/weighing imports restaurant/orders
service/jobs imports restaurant/serving
```

Good:

```txt
restaurant/orders imports core/auth
restaurant/orders imports shared/invoice
retail/checkout imports core/payments
raw-material/intake imports shared/suppliers
service/jobs imports shared/customers
```

---

## 5. Implementation Guide

### 5.1 High-Level Architecture

The MVP architecture should look like this:

```txt
User Browser
↓
Next.js App
↓
Route Handlers / API Layer
↓
Service Layer
↓
Repository / Data Access Layer
↓
Prisma
↓
PostgreSQL
```

Additional supporting systems:

```txt
Object Storage
Error Tracking
Logs
Monitoring
CI/CD
```

Future optional systems:

```txt
Redis
Queue / Worker
WebSocket / SSE
Payment Gateway
Platform Admin Dashboard
Subscription Billing
```

---

### 5.2 Application Layers

The system should be organized into these layers:

```txt
App Layer
Feature Layer
Core Layer
Shared Layer
Infrastructure Layer
```

#### App Layer

Responsible for:

```txt
routing
page composition
API route entry points
layouts
metadata
```

Example:

```txt
src/app/
├─ dashboard/
├─ customer/
├─ select-mode/
└─ api/
```

The app layer should not contain heavy business logic.

#### Feature Layer

Responsible for domain-specific features.

Example:

```txt
src/features/
├─ restaurant/
├─ retail/
├─ raw-material/
├─ service/
└─ shared/
```

Each feature may contain:

```txt
components
services
repositories
schemas
types
constants
permissions
```

#### Core Layer

Responsible for foundational systems used by all modes.

Example:

```txt
src/core/
├─ auth/
├─ permissions/
├─ business-scope/
├─ settings/
├─ payments/
├─ inventory/
├─ audit/
├─ errors/
├─ logger/
└─ validation/
```

Core must stay mode-agnostic.

#### Shared Layer

Responsible for reusable business modules used across modes.

Example:

```txt
src/features/shared/
├─ employees/
├─ attendance/
├─ shifts/
├─ customers/
├─ suppliers/
├─ cashflow/
├─ invoice/
├─ reports/
└─ financial-reports/
```

Shared modules may be mode-aware, but must not hardcode mode-specific workflow behavior.

#### Infrastructure Layer

Responsible for external or low-level technical systems.

Example:

```txt
src/lib/
├─ db/
├─ env/
├─ storage/
├─ response/
├─ logger/
├─ errors/
└─ utils/
```

---

### 5.3 Recommended Folder Structure

Recommended structure:

```txt
src/
├─ app/
│  ├─ dashboard/
│  ├─ customer/
│  ├─ select-mode/
│  └─ api/
│
├─ core/
│  ├─ auth/
│  ├─ permissions/
│  ├─ business-scope/
│  ├─ settings/
│  ├─ payments/
│  ├─ inventory/
│  ├─ audit/
│  ├─ errors/
│  └─ validation/
│
├─ features/
│  ├─ restaurant/
│  │  ├─ orders/
│  │  ├─ cashier/
│  │  ├─ kitchen/
│  │  ├─ serving/
│  │  ├─ tables/
│  │  ├─ menu/
│  │  └─ recipes/
│  │
│  ├─ retail/
│  │  ├─ checkout/
│  │  ├─ products/
│  │  ├─ barcode/
│  │  ├─ receiving/
│  │  ├─ stock-opname/
│  │  └─ promotions/
│  │
│  ├─ raw-material/
│  │  ├─ intake/
│  │  ├─ weighing/
│  │  ├─ batch/
│  │  ├─ kandang/
│  │  ├─ processing/
│  │  └─ quality-control/
│  │
│  ├─ service/
│  │  ├─ requests/
│  │  ├─ jobs/
│  │  ├─ assignments/
│  │  ├─ progress/
│  │  └─ billing/
│  │
│  └─ shared/
│     ├─ employees/
│     ├─ customers/
│     ├─ suppliers/
│     ├─ cashflow/
│     ├─ invoice/
│     └─ reports/
│
├─ components/
│  ├─ ui/
│  ├─ layout/
│  └─ shared/
│
├─ lib/
│  ├─ db/
│  ├─ env/
│  ├─ response/
│  ├─ logger/
│  ├─ errors/
│  └─ utils/
│
└─ types/
```

This structure is a target direction, not a reason to break working code immediately.

Refactor must be gradual.

---

### 5.4 Backend Layer Pattern

Backend implementation should use this flow:

```txt
Route Handler
↓
Auth / Scope / Permission
↓
Schema Validation
↓
Service Layer
↓
Repository Layer
↓
Database
```

#### Route Handler

Responsible for:

```txt
reading request
reading params/query/body
calling service
returning response
```

Route handlers must stay thin.

#### Service Layer

Responsible for:

```txt
business logic
workflow validation
permission-sensitive decisions
transaction coordination
audit creation
stock/payment/status consistency
```

Service layer is where most backend logic belongs.

#### Repository Layer

Responsible for:

```txt
database queries
database mutations
tenant-scoped data access
select/include optimization
```

Repository layer must not contain heavy business policy.

#### Schema Layer

Responsible for:

```txt
input validation
request body shape
params validation
query validation
```

Use Zod or equivalent validation tool.

---

### 5.5 Example Backend Flow

Create restaurant order:

```txt
POST /api/restaurant/orders
↓
getCurrentUser()
↓
requireBusinessScope()
↓
requirePermission("restaurant.orders.create")
↓
validate create order schema
↓
orderService.createOrder()
↓
database transaction:
  - create order
  - create order items
  - calculate price snapshot
  - update table if needed
  - create stock movement if needed
  - create audit log
↓
return response
```

Update kitchen status:

```txt
PATCH /api/restaurant/kitchen/orders/:id/status
↓
getCurrentUser()
↓
requirePermission("restaurant.kitchen.update")
↓
load order with business scope
↓
validate transition
↓
update order status
↓
create audit log
↓
return response
```

Payment flow:

```txt
POST /api/payments
↓
getCurrentUser()
↓
requirePermission("restaurant.payments.create")
↓
load order with business scope
↓
validate payable state
↓
validate amount
↓
database transaction:
  - create payment
  - update order status to PAID
  - create cashflow entry if needed
  - create audit log
↓
return response
```

---

### 5.6 Frontend Architecture Overview

Frontend should be organized by route, layout, shared UI, and feature-specific components.

Frontend responsibilities:

```txt
display data
collect input
show loading state
show error state
show empty state
manage local UI state
call API
reflect backend response
```

Frontend must not:

```txt
decide final price
decide final total
decide real permission
decide tenant scope
decide final payment status
decide final stock deduction
decide final workflow transition
```

Recommended frontend state separation:

```txt
Server state → fetched from backend
Local UI state → component state
Form state → React Hook Form / controlled form
Global client state → selected mode, sidebar, temporary cart
Auth state → backend session/current user
```

---

### 5.7 Database Architecture Overview

Database:

```txt
PostgreSQL
```

ORM:

```txt
Prisma
```

Rules:

1. Business-owned tables must include restaurantId, businessId, or tenantId.
2. Queries must be scoped.
3. Money must use Decimal or integer minor units.
4. Important historical transactions must store snapshots.
5. Stock changes must create stock movement.
6. Payment/order/invoice/status changes should be transaction-safe.
7. Indexes must support common queries.
8. Migration must be planned.

Current implementation may still use:

```txt
restaurantId
```

V3 conceptual ownership should move toward:

```txt
businessId
```

or:

```txt
tenantId
```

but only with a planned migration.

---

### 5.8 Infrastructure Architecture Overview

MVP infrastructure may use:

```txt
Frontend + API:
Vercel / similar platform

Database:
PostgreSQL on Neon / Supabase / Railway

File Storage:
Cloudflare R2 / Supabase Storage / S3-compatible storage

Version Control:
GitHub

CI/CD:
GitHub Actions + hosting provider deploy

Error Tracking:
Sentry

Monitoring:
UptimeRobot / Better Stack / provider monitoring
```

Do not overbuild infrastructure before MVP is stable.

Future infrastructure may include:

```txt
Redis
Queue / worker
WebSocket / SSE
Dedicated backend service
Platform admin service
Billing integration
Advanced monitoring
```

---

### 5.9 Runtime Architecture

MVP runtime:

```txt
Browser
↓
Next.js App
↓
API Route / Server Action
↓
Prisma
↓
PostgreSQL
```

With storage:

```txt
Browser
↓
Backend validates upload request
↓
Object Storage
↓
Database stores file path / URL
```

With future payment gateway:

```txt
User payment
↓
Payment provider
↓
Webhook
↓
Backend verifies webhook
↓
Database updates payment/subscription/order status
```

With future realtime:

```txt
Kitchen / Serving UI
↓
Polling / SSE / WebSocket
↓
Backend
↓
Database
```

MVP may use polling before introducing WebSocket.

---

## 6. Anti-Patterns

Do not:

- Split into microservices during MVP
- Create separate database for each mode
- Create separate frontend app for each mode too early
- Put all business logic inside route handlers
- Put backend business logic inside React components
- Let frontend call database directly
- Let core import restaurant, retail, raw-material, or service modules
- Let shared modules depend on kitchen, barcode, weighing, or technician workflow
- Duplicate payment logic per mode
- Duplicate auth logic per mode
- Duplicate inventory foundation per mode
- Move stable Restaurant code just to make folders look cleaner
- Create placeholder mode folders and claim implementation is done
- Add Redis before cache strategy exists
- Add WebSocket before polling/API flow is stable
- Add queue before there is a real background job need
- Add Kubernetes before deployment basics are stable
- Rename restaurantId to businessId without migration plan
- Use architecture docs as an excuse for endless refactor

---

## 7. Checklist

Architecture is acceptable when:

- [ ] Modular monolith is preserved.
- [ ] Core, shared, and mode-specific boundaries are clear.
- [ ] Restaurant / F&B flow remains stable.
- [ ] Planned modes are not falsely treated as implemented.
- [ ] Business logic is not inside UI components.
- [ ] Route handlers are thin.
- [ ] Service layer owns business logic.
- [ ] Repository layer owns data access.
- [ ] Database access is business-scoped.
- [ ] Core does not import mode-specific modules.
- [ ] Shared modules do not hardcode mode-specific workflow.
- [ ] Infrastructure remains MVP-appropriate.
- [ ] No microservices, database-per-mode, or app-per-mode are introduced prematurely.
- [ ] Documentation is updated when architecture changes.

---

## 8. References

Related documents:

- 00-ai-context.md
- 01-system-design.md
- 03-frontend.md
- 04-backend-api.md
- 05-database-storage.md
- 06-auth-permissions.md
- 09-security.md
- 14-testing.md
- appendices/folder-structure.md
- appendices/implementation-rules.md