# POS System V3 - System Design

## 1. Purpose

This document defines the high-level product design, business direction, scope, workflow strategy, and source-of-truth principles for POS System V3.

It explains what the system is, what it is not, which business modes it supports, and what design rules must be followed before implementation.

This document does not define detailed folder structure, API contracts, database schema, deployment setup, or testing strategy. Those are handled in separate technical documents.

---

## 2. Current Context

POS System V3 started from a Restaurant / F&B POS system.

The current active mode is:

```txt
Restaurant / F&B
````

The existing Restaurant flow includes:

```txt
Order
Cashier
Payment
Kitchen
Serving
Menu
Inventory
Shift
Analytics
Settings
Audit logs
```

V3 expands the direction from a restaurant-only POS into a modular business operating system.

Planned business modes are:

```txt
Restaurant / F&B
Retail / Supermarket
Raw Material / Livestock / Kandang
Service / Custom Business
```

The current recommended architecture is:

```txt
Modular monolith
One app
One backend
One database
Shared core systems
Shared business dashboards
Mode-specific workflows
```

The system must be designed for multiple modes but implemented gradually.

MVP does not mean all business modes are complete.

MVP means:

```txt
Restaurant mode is stable.
Shared/core foundation is prepared.
Planned modes are documented.
The architecture does not block future expansion.
```

---

## 3. Decisions

The following system design decisions are locked:

1. POS System V3 is a modular business operating system.
2. The system uses modular monolith architecture.
3. The system uses one application, one backend, and one database.
4. Restaurant / F&B is the first active and stable mode.
5. Retail / Supermarket is a planned mode.
6. Raw Material / Livestock / Kandang is a planned mode.
7. Service / Custom Business is a planned mode.
8. Shared core systems must be reused across modes.
9. Shared business dashboards must remain mode-aware but mode-agnostic.
10. Mode-specific workflows must live inside their related mode.
11. Core systems must not depend on mode-specific modules.
12. Mode-specific modules may depend on core and shared modules.
13. Each business mode may define its own workflow and status flow.
14. One universal workflow status enum must not be forced across all modes.
15. Database is the final persisted source of truth.
16. Backend is the business decision maker.
17. Frontend is the presentation and input layer.
18. Business-owned data must be scoped by restaurantId, businessId, or tenantId.
19. Current restaurantId should be treated as the current implementation of business ownership scope.
20. Future migration to businessId or tenantId must be planned carefully.
21. Microservices are out of scope for now.
22. Database-per-mode is out of scope for now.
23. Separate app per mode is out of scope for now.
24. Full no-code builder is out of scope for now.
25. Full ERP accounting is out of scope for now.

---

## 4. Rules

### 4.1 Product Rules

1. The system must remain Restaurant-first during MVP.
2. The system must not pretend that planned modes are completed.
3. Planned modes may be documented before implementation.
4. Restaurant mode must not be broken while preparing V3 architecture.
5. New features must be placed based on responsibility, not convenience.

### 4.2 Layer Rules

The system has three responsibility layers:

```txt
Core System
Shared Business Dashboard
Mode-Specific Workflow
```

Core System includes:

```txt
Auth
Permissions
Business scope
Settings foundation
Inventory engine
Payments foundation
Audit logs
Error handling
Validation
```

Shared Business Dashboard includes:

```txt
Employees
Attendance
Shifts
Customers / Clients
Suppliers
Cashflow
Invoice
Reports
Financial reports
```

Mode-Specific Workflow includes:

```txt
Restaurant kitchen / serving / table / recipe workflow
Retail barcode / SKU / stock opname / checkout workflow
Raw Material intake / weighing / batch / kandang / processing workflow
Service request / job / assignment / progress workflow
```

Rules:

1. Core must not import mode-specific workflow.
2. Shared dashboard must not import mode-specific workflow.
3. Mode-specific modules may import core and shared modules.
4. Mode-specific logic must not pollute core.
5. Shared modules must stay generic.

### 4.3 Source of Truth Rules

1. Database is the final persisted truth.
2. Backend decides business logic.
3. Frontend must not be trusted for critical values.
4. LocalStorage must not be trusted for security.
5. Backend must calculate price, tax, discount, and total.
6. Backend must validate payment status.
7. Backend must validate status transitions.
8. Backend must validate stock changes.
9. Backend must create audit logs for important mutations.
10. Business-owned data must always be scoped.

### 4.4 Workflow Rules

1. Every workflow must have a clear starting point.
2. Every workflow must define allowed transitions.
3. Every workflow must define terminal states.
4. Backend must validate every transition.
5. Frontend must not decide final workflow state.
6. Money, stock, invoice, and status mutations should be transaction-safe.
7. Important workflow mutations must create audit logs.

---

## 5. Implementation Guide

### 5.1 Business Modes

The system supports four business modes.

| Mode                               | Status  | Purpose                                                        |
| ---------------------------------- | ------- | -------------------------------------------------------------- |
| Restaurant / F&B                   | Active  | Order, cashier, payment, kitchen, serving, menu, recipe, table |
| Retail / Supermarket               | Planned | SKU, barcode, shelf, checkout, stock opname, promotion         |
| Raw Material / Livestock / Kandang | Planned | Intake, weighing, batch, kandang, processing, quality control  |
| Service / Custom Business          | Planned | Client request, service job, assignment, progress, invoice     |

### 5.2 MVP Direction

MVP focuses on:

```txt
Restaurant mode stability
Core system cleanup
Shared dashboard foundation
Mode selection foundation
Documentation
```

MVP does not require:

```txt
Full Retail implementation
Full Raw Material implementation
Full Service implementation
Microservices
Database-per-mode
Payment gateway automation
Advanced SaaS billing
Native mobile app
```

### 5.3 Restaurant Workflow

Restaurant is the active workflow.

Main flow:

```txt
WAITING_CASHIER_APPROVAL
→ WAITING_PAYMENT
→ PAID
→ PREPARING
→ READY
→ SERVED
→ COMPLETED
```

Terminal statuses:

```txt
REJECTED
CANCELLED
REFUNDED
```

Rules:

1. Kitchen must only receive paid orders.
2. Kitchen must not process unpaid orders.
3. Server must only handle ready or served orders.
4. Cashier must not update kitchen status unless explicitly permitted.
5. Kitchen staff must not process payment.
6. Completed orders must not be edited casually.
7. Cancelled orders must not re-enter active workflow casually.

### 5.4 Role Strategy

The system should use:

```txt
Global role
Mode access
Permission keys
```

Role describes responsibility.

Permission controls actual action.

Example permissions:

```txt
core.settings.update
shared.invoice.create
restaurant.kitchen.update
retail.checkout.create
raw-material.weighing.create
service.job.assign
```

Backend must enforce permissions.

Frontend permission checks are only for user experience.

### 5.5 Source of Truth

Frontend may send:

```txt
itemId
quantity
notes
paymentMethod
selected action
```

Frontend must not decide:

```txt
final price
final tax
final total
business scope
user role
permissions
payment status
stock deduction
workflow transition
audit actor
```

Backend must decide or verify critical business values.

---

## 6. Anti-Patterns

Do not:

* Build all modes at once
* Treat planned modes as completed
* Create fake placeholder modules and call them implemented
* Break Restaurant mode for architecture purity
* Put kitchen logic inside core inventory
* Put weighing logic inside generic inventory without mode boundary
* Put barcode checkout inside shared payment logic
* Force one universal status enum across all modes
* Trust frontend for total amount
* Trust frontend for businessId, restaurantId, or tenantId
* Query tenant-owned data by ID only
* Use findUnique by ID only for business-owned data
* Skip audit logs for payment, stock, settings, role, or status mutation
* Rename restaurantId to businessId without migration plan
* Add microservices before modular monolith is stable
* Add WebSocket before polling/API flow is stable
* Add Redis/cache before source of truth is clear
* Build a no-code workflow builder under Service mode
* Use Float for money
* Change stock quantity without stock movement

---

## 7. Checklist

This system design is respected when:

* [ ] Restaurant / F&B remains the active stable mode.
* [ ] Planned modes are documented but not falsely treated as done.
* [ ] Core, shared, and mode-specific responsibilities are separated.
* [ ] Backend owns business decisions.
* [ ] Database remains final source of truth.
* [ ] Frontend is not trusted for critical values.
* [ ] All business-owned data is scoped.
* [ ] Workflow transitions are validated by backend.
* [ ] Permissions are enforced by backend.
* [ ] Money, stock, invoice, status, role, permission, and settings mutations are audited.
* [ ] No microservices/database-per-mode/app-per-mode are introduced prematurely.
* [ ] Documentation is updated when decisions change.

---

## 8. References

Related documents:

* 00-ai-context.md
* 02-system-architecture.md
* 03-frontend.md
* 04-backend-api.md
* 05-database-storage.md
* 06-auth-permissions.md
* 09-security.md
* appendices/status-transitions.md
* appendices/permission-keys.md
* appendices/implementation-rules.md

