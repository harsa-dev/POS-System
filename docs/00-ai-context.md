# AI Context

## 1. Purpose

This document gives AI assistants, coding agents, and future contributors the minimum required context before modifying the POS System V3 project.

The goal is to prevent random refactors, inconsistent architecture, temporary fixes, unsafe shortcuts, and feature implementation that ignores the actual product direction.

This file must be read before working on any technical implementation.

---

## 2. Current Context

POS System V3 is a portfolio-grade modular business operating system.

Although the project name is POS System, V3 is no longer designed as a restaurant-only POS.

The system is designed to support multiple business modes inside one application, one backend, and one database.

The first active and stable mode is:

```txt
Restaurant / F&B
````

Other planned modes are:

```txt
Retail / Supermarket
Raw Material / Livestock / Kandang
Service / Custom Business
```

The current technical direction is:

```txt
Modular monolith first.
One app.
One backend.
One database.
Shared core.
Mode-specific workflow.
```

The project may currently still contain restaurant-oriented naming such as:

```txt
restaurantId
Restaurant
Restaurant settings
Restaurant roles
```

In V3 design, this should be understood as the current implementation of business ownership scope.

Future architecture may migrate toward:

```txt
businessId
```

or:

```txt
tenantId
```

However, migration must be planned carefully and must not be done casually.

---

## 3. Decisions

The following decisions are locked:

1. POS System V3 uses modular monolith architecture.
2. Restaurant / F&B is the active mode.
3. Retail, Raw Material / Kandang, and Service are planned modes.
4. The system must use shared core systems and mode-specific workflows.
5. Core systems must not contain mode-specific workflow logic.
6. Mode-specific modules may use core and shared modules.
7. Core and shared modules must not depend on mode-specific modules.
8. Backend is the business decision maker.
9. Database is the final persisted source of truth.
10. Frontend is only the presentation and input layer.
11. All business-owned data must be scoped by restaurantId, businessId, or tenantId.
12. MVP does not mean all four modes are fully implemented.
13. MVP means Restaurant mode is stable and V3 architecture is prepared.
14. Microservices are out of scope for now.
15. Database-per-mode is out of scope for now.
16. Separate app per business mode is out of scope for now.
17. Service / Custom Business is not a no-code builder.
18. Temporary fixes must be avoided.
19. Hardcoded shortcuts must be avoided unless explicitly documented as temporary MVP constraints.
20. Existing stable Restaurant workflows must not be broken for folder purity.

---

## 4. Rules

All AI-generated changes must follow these rules:

1. Do not break the existing Restaurant / F&B flow.
2. Do not implement all planned modes at once.
3. Do not create empty fake features and call them completed.
4. Do not move stable code only for aesthetic folder structure.
5. Do not duplicate auth, payment, inventory, audit, or settings logic per mode.
6. Do not trust frontend for critical values.
7. Do not trust frontend for user role, permission, restaurantId, businessId, tenantId, price, total, payment status, or workflow status.
8. Do not query business-owned data without business scope.
9. Do not update workflow status without transition validation.
10. Do not update money, stock, invoice, role, permission, or settings without backend validation.
11. Do not change schema without considering migration impact.
12. Do not use Float for money.
13. Do not change inventory quantity without stock movement.
14. Do not create payment without idempotency or duplicate-payment protection.
15. Do not add microservices, queues, Redis, WebSocket, or Kubernetes unless the related doc says it is required.
16. Do not hide security only in frontend.
17. Backend API must enforce auth, scope, permission, validation, and business rules.
18. Important mutations must create audit logs.
19. Errors must use consistent response format.
20. If a proper fix requires deeper refactor, do not patch around it silently.

---

## 5. Implementation Guide

When implementing a feature, follow this order:

```txt
1. Read AI context
2. Read related technical document
3. Identify the feature layer
4. Check whether it belongs to core, shared dashboard, or mode-specific workflow
5. Check current Restaurant implementation
6. Preserve stable behavior
7. Add or update validation
8. Add permission check
9. Add tenant/business scope
10. Add audit log if important
11. Add tests or manual checklist
12. Update documentation if behavior changes
```

Feature placement guide:

```txt
Used by all modes and foundational:
Core system

Used by multiple modes as business dashboard:
Shared dashboard

Only meaningful for one business mode:
Mode-specific workflow
```

Examples:

```txt
Auth → Core
Permission → Core
Business scope → Core
Inventory engine → Core
Cashflow → Shared dashboard
Invoice → Shared dashboard
Employees → Shared dashboard
Kitchen queue → Restaurant mode
Barcode checkout → Retail mode
Weighing → Raw Material mode
Service job assignment → Service mode
```

---

## 6. Anti-Patterns

Do not:

* Build all modes at once
* Treat planned mode as completed
* Create placeholder pages and call them features
* Put kitchen logic inside core inventory
* Put barcode checkout inside generic payment core
* Put weighing logic inside restaurant inventory
* Use one universal status enum for every mode
* Trust request body businessId
* Trust frontend calculated total
* Use findUnique by ID only for tenant-owned resources
* Let localStorage decide real permission or mode access
* Let support/platform admin access tenant data without audit
* Create a giant global role enum without permission strategy
* Add realtime infrastructure before polling/API flow works
* Add caching before source of truth is clear
* Add scaling infrastructure before bottleneck is measured
* Rename restaurantId everywhere without migration plan
* Build subscription billing before internal order/payment flow is stable
* Build a no-code builder under Service mode
* Use AI-generated temporary fixes without documenting risk

---

## 7. Checklist

Before any implementation is considered acceptable:

* [ ] The feature belongs to the correct layer.
* [ ] Business scope is enforced.
* [ ] Permission is enforced in backend.
* [ ] Input is validated.
* [ ] Business rule is validated.
* [ ] Money, stock, invoice, status, role, permission, or settings mutation is audited.
* [ ] Frontend does not act as final source of truth.
* [ ] Existing Restaurant flow remains stable.
* [ ] No unrelated refactor was introduced.
* [ ] No planned mode is falsely marked as completed.
* [ ] Documentation is updated if architecture or workflow changed.

---

## 8. References

Related documents:

* 01-system-design.md
* 02-system-architecture.md
* 03-frontend.md
* 04-backend-api.md
* 05-database-storage.md
* 06-auth-permissions.md
* 09-security.md
* appendices/implementation-rules.md