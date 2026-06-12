# Permission Keys

## 1. Purpose

This appendix defines the permission key system for POS System V3.

Permission keys are used to describe what an authenticated user is allowed to do.

The goal is to avoid hardcoding every access rule directly into role checks like:

```ts
if (user.role === "OWNER" || user.role === "MANAGER") {
  // allow
}
```

That works early, then slowly becomes spaghetti with a badge.

Permission keys make access control more explicit, searchable, testable, and easier to expand when the system grows beyond Restaurant / F&B mode.

---

## 2. Current Context

POS System V3 currently supports Restaurant / F&B mode.

Current operational roles:

```txt
OWNER
MANAGER
CASHIER
KITCHEN
SERVER
```

Future platform roles may include:

```txt
SUPER_ADMIN
SUPPORT_ADMIN
BILLING_ADMIN
```

Future external/user-facing roles may include:

```txt
CUSTOMER
CLIENT
SUPPLIER
```

Current system still mostly thinks in restaurant roles.

V3 direction:

```txt
global role
+
business scope
+
mode access
+
permission keys
```

Permission keys must support:

```txt
restaurant workflows
shared dashboard systems
platform admin actions
future business modes
```

The permission system must stay strict enough for security but simple enough to actually implement.

Because a permission system no one understands is just security theater with extra strings.

---

## 3. Decisions

The following permission key decisions are locked:

1. Backend must enforce permissions.
2. Frontend permission checks are UX only.
3. Permission keys must be string-based.
4. Permission keys must be centralized.
5. Permission keys must be documented.
6. Permission keys must follow consistent naming.
7. Permission checks must happen before protected actions.
8. Role-to-permission mapping may be used for MVP.
9. Future custom roles may reuse the same permission keys.
10. OWNER is not SUPER_ADMIN.
11. Platform permissions must be separated from business permissions.
12. Restaurant permissions must be separated from shared permissions.
13. Future mode permissions must be namespaced by mode.
14. Permission checks must include business/tenant scope.
15. Permission alone is not enough without scope.
16. Permission alone is not enough without authentication.
17. Permission alone is not enough without business rule validation.
18. Critical permissions must be tested.
19. Permission keys must not be generated randomly inside components.
20. Permission names must be readable by humans.
21. Deprecated permissions must be removed carefully.
22. Wildcard permissions may exist only for trusted internal logic.
23. Feature plan gating is separate from permission.
24. Mode access is separate from permission.
25. Audit is required for permission/role changes.

---

## 4. Rules

### 4.1 Naming Rules

Permission key format:

```txt
scope.resource.action
```

Examples:

```txt
restaurant.orders.create
restaurant.orders.view
restaurant.payments.create
shared.reports.export
platform.tenants.suspend
```

Structure:

```txt
scope:
which system area owns this permission

resource:
what entity or feature is being accessed

action:
what operation is being performed
```

Rules:

1. Use lowercase.
2. Use dot notation.
3. Use plural resource names when practical.
4. Use clear action verbs.
5. Avoid vague actions like `manage` unless intentionally broad.
6. Do not use spaces.
7. Do not use random abbreviations.
8. Do not mix role names into permission keys.

Bad:

```txt
canDoStuff
ownerOnly
cashierPayment
allow_admin
orderThing
```

Good:

```txt
restaurant.payments.create
restaurant.orders.update-status
shared.analytics.view
platform.tenants.view
```

Humanity already made CSS naming hard enough. Permission names do not need to join the circus.

---

### 4.2 Scope Rules

Main permission scopes:

```txt
restaurant
shared
platform
customer
retail
livestock
service
```

#### restaurant

For Restaurant / F&B mode.

Examples:

```txt
restaurant.orders.create
restaurant.kitchen.update
restaurant.serving.view
```

#### shared

For shared systems used across business modes.

Examples:

```txt
shared.reports.view
shared.inventory.view
shared.invoices.create
shared.cashflow.view
shared.cashflow.create
shared.cashflow.sync
shared.cashflow.void
shared.cashflow.export
```

Cashflow permissions:

```txt
shared.cashflow.view
read cashflow dashboard and entries

shared.cashflow.create
create manual cashflow ledger entries

shared.cashflow.sync
sync trusted backend sources such as paid orders and closed shifts into cashflow

shared.cashflow.void
void existing cashflow entries without deleting historical records

shared.cashflow.export
export cashflow reports and filtered ledgers
```

#### platform

For SaaS platform admin.

Examples:

```txt
platform.tenants.view
platform.subscriptions.update
platform.support.impersonate
```

#### customer

For customer-facing actions.

Examples:

```txt
customer.orders.create
customer.orders.view-own
```

#### future mode scopes

Examples:

```txt
retail.products.scan
livestock.batches.create
service.jobs.assign
```

Rules:

1. Business mode permissions must stay mode-scoped.
2. Shared permissions must not secretly contain restaurant-only behavior.
3. Platform permissions must not be given to restaurant OWNER.
4. Customer permissions must not access staff dashboard data.

---
