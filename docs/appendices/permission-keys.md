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

### 4.3 Action Naming Rules

Recommended actions:

```txt
view
create
update
delete
archive
restore
approve
reject
cancel
refund
export
import
assign
unassign
update-status
manage-settings
open
close
void
adjust
sync
```

Use specific action when security matters.

Prefer:

```txt
restaurant.payments.refund
```

over:

```txt
restaurant.payments.manage
```

Use broad actions only when acceptable:

```txt
shared.settings.manage
```

Rules:

1. `view` means read/list/detail access.
2. `create` means create new record.
3. `update` means edit existing record.
4. `delete` means destructive delete.
5. `update-status` means workflow status change.
6. `manage-settings` means sensitive config update.
7. `export` means generating/downloading data externally.
8. `refund`, `void`, `adjust`, and `cancel` must be treated as sensitive.

---

### 4.4 Role-to-Permission Rules

MVP may use role-to-permission mapping.

Example:

```txt
OWNER → most restaurant/shared permissions
MANAGER → operational permissions
CASHIER → order/payment/shift permissions
KITCHEN → kitchen queue permissions
SERVER → serving queue permissions
```

Rules:

1. Role map must be centralized.
2. Role map must be tested.
3. Backend must call permission helper.
4. Do not scatter role checks everywhere.
5. Future custom roles should reuse permission keys.
6. Changing role permissions must be audited.

Bad:

```ts
if (user.role === "CASHIER") {
  // payment allowed
}
```

Better:

```ts
requirePermission(user, "restaurant.payments.create");
```

### 4.5 Permission Check Rules

Protected endpoint flow:

```txt
requireAuth()
↓
requireActiveUser()
↓
requireBusinessScope()
↓
requireModeAccess()
↓
requirePermission()
↓
validate input
↓
validate business rule
↓
execute action
```

Rules:

1. Authentication comes first.
2. Scope check is mandatory for tenant-owned data.
3. Permission check is mandatory for protected actions.
4. Business rule validation is still required after permission.
5. Permission failure returns `403 Forbidden`.
6. Missing auth returns `401 Unauthorized`.

Permission check does not replace business validation.

Example:

```txt
CASHIER may have restaurant.payments.create
```

But backend must still check:

```txt
order belongs to same restaurant
order is payable
payment amount is valid
payment is not duplicate
```

A permission is a key to the room. It is not permission to set the room on fire.

---

### 4.6 Mode Access Rules

Mode access is separate from permission.

Example:

```txt
User has:
restaurant.orders.create

But current business does not have Restaurant / F&B mode enabled.

Result:
forbidden
```

Rules:

1. User must have access to the mode.
2. Business must have the mode enabled.
3. Permission must still be checked.
4. Mode access failure must not leak other tenant data.
5. Frontend mode navigation is UX only.

---

### 4.7 Feature Plan Rules

Feature plan gating is separate from permission.

Example:

```txt
User has:
shared.reports.export

But plan does not allow:
report_export

Result:
PLAN_UPGRADE_REQUIRED
```

Rules:

1. Permission answers “is this user allowed?”
2. Feature gate answers “does this tenant plan allow this feature?”
3. Both may be required.
4. Backend must enforce both.
5. Frontend may show upgrade UI.

---

### 4.8 Wildcard Permission Rules

Wildcard permission may exist:

```txt
*
restaurant.*
shared.*
platform.*
```

But use carefully.

Rules:

1. `*` should only be used for internal SUPER_ADMIN-like logic.
2. Restaurant OWNER may have many permissions, but not platform permissions.
3. Avoid giving `*` to normal business users.
4. Wildcard behavior must be tested.
5. Wildcard must not bypass tenant isolation.

Even a SUPER_ADMIN must still be audited.

“Admin can do anything” is how systems quietly become crime scenes with dashboards.

---

## 5. Implementation Guide

### 5.1 Permission Type

Example TypeScript type:

```ts
export type Permission =
  | "restaurant.orders.view"
  | "restaurant.orders.create"
  | "restaurant.orders.approve"
  | "restaurant.orders.cancel"
  | "restaurant.orders.update-status"
  | "restaurant.payments.view"
  | "restaurant.payments.create"
  | "restaurant.payments.refund"
  | "restaurant.kitchen.view"
  | "restaurant.kitchen.update"
  | "restaurant.serving.view"
  | "restaurant.serving.update"
  | "shared.inventory.view"
  | "shared.inventory.adjust"
  | "shared.reports.view"
  | "shared.reports.export"
  | "shared.settings.view"
  | "shared.settings.update"
  | "platform.tenants.view"
  | "platform.tenants.suspend";
```

For larger systems, permissions may be generated from a const object.

---

### 5.2 Permission Registry

Recommended registry:

```ts
export const permissions = {
  restaurant: {
    orders: {
      view: "restaurant.orders.view",
      create: "restaurant.orders.create",
      approve: "restaurant.orders.approve",
      cancel: "restaurant.orders.cancel",
      updateStatus: "restaurant.orders.update-status",
    },
    payments: {
      view: "restaurant.payments.view",
      create: "restaurant.payments.create",
      refund: "restaurant.payments.refund",
    },
    kitchen: {
      view: "restaurant.kitchen.view",
      update: "restaurant.kitchen.update",
    },
    serving: {
      view: "restaurant.serving.view",
      update: "restaurant.serving.update",
    },
  },
  shared: {
    inventory: {
      view: "shared.inventory.view",
      adjust: "shared.inventory.adjust",
    },
    reports: {
      view: "shared.reports.view",
      export: "shared.reports.export",
    },
    settings: {
      view: "shared.settings.view",
      update: "shared.settings.update",
    },
  },
  platform: {
    tenants: {
      view: "platform.tenants.view",
      suspend: "platform.tenants.suspend",
    },
  },
} as const;
```

Usage:

```ts
requirePermission(user, permissions.restaurant.payments.create);
```

This avoids typo strings scattered everywhere like confetti at a bug funeral.

---

### 5.3 Role Permission Map

MVP role map:

```ts
export const rolePermissions = {
  OWNER: [
    "restaurant.orders.view",
    "restaurant.orders.create",
    "restaurant.orders.approve",
    "restaurant.orders.cancel",
    "restaurant.orders.update-status",

    "restaurant.payments.view",
    "restaurant.payments.create",
    "restaurant.payments.refund",

    "restaurant.kitchen.view",
    "restaurant.kitchen.update",

    "restaurant.serving.view",
    "restaurant.serving.update",

    "shared.inventory.view",
    "shared.inventory.adjust",

    "shared.reports.view",
    "shared.reports.export",

    "shared.settings.view",
    "shared.settings.update",
  ],

  MANAGER: [
    "restaurant.orders.view",
    "restaurant.orders.create",
    "restaurant.orders.approve",
    "restaurant.orders.cancel",
    "restaurant.orders.update-status",

    "restaurant.payments.view",
    "restaurant.payments.create",

    "restaurant.kitchen.view",
    "restaurant.kitchen.update",

    "restaurant.serving.view",
    "restaurant.serving.update",

    "shared.inventory.view",
    "shared.inventory.adjust",

    "shared.reports.view",
    "shared.reports.export",

    "shared.settings.view",
  ],

  CASHIER: [
    "restaurant.orders.view",
    "restaurant.orders.create",
    "restaurant.orders.approve",
    "restaurant.orders.cancel",

    "restaurant.payments.view",
    "restaurant.payments.create",
  ],

  KITCHEN: [
    "restaurant.kitchen.view",
    "restaurant.kitchen.update",

    "restaurant.orders.view",
  ],

  SERVER: [
    "restaurant.serving.view",
    "restaurant.serving.update",

    "restaurant.orders.view",
  ],
} as const;
```

Adjust based on actual product behavior.

This is a baseline, not holy scripture.

---

### 5.4 Platform Role Permission Map

Platform roles are separate.

```ts
export const platformRolePermissions = {
  SUPER_ADMIN: [
    "platform.tenants.view",
    "platform.tenants.suspend",
    "platform.tenants.update",
    "platform.subscriptions.view",
    "platform.subscriptions.update",
    "platform.billing.view",
    "platform.support.view",
    "platform.support.impersonate",
  ],

  SUPPORT_ADMIN: [
    "platform.tenants.view",
    "platform.support.view",
  ],

  BILLING_ADMIN: [
    "platform.tenants.view",
    "platform.subscriptions.view",
    "platform.subscriptions.update",
    "platform.billing.view",
  ],
} as const;
```

Rules:

1. Platform permissions must not be assigned to restaurant staff.
2. Restaurant OWNER must not get platform permissions.
3. Platform actions must be audited.

---

### 5.5 Permission Helper

Example helper:

```ts
type UserWithPermissions = {
  id: string;
  role: string;
  permissions: string[];
};

export function hasPermission(
  user: UserWithPermissions,
  permission: string,
) {
  if (user.permissions.includes("*")) {
    return true;
  }

  if (user.permissions.includes(permission)) {
    return true;
  }

  const [scope] = permission.split(".");

  if (user.permissions.includes(`${scope}.*`)) {
    return true;
  }

  return false;
}
```

Strict version:

```ts
export function requirePermission(
  user: UserWithPermissions,
  permission: string,
) {
  if (!hasPermission(user, permission)) {
    throw new AppError({
      statusCode: 403,
      code: "FORBIDDEN",
      message: "You do not have permission to perform this action.",
    });
  }
}
```

---

### 5.6 Backend Usage Example

Payment endpoint:

```ts
export async function POST(req: Request) {
  const user = await requireAuth();

  requirePermission(user, "restaurant.payments.create");

  const input = createPaymentSchema.parse(await req.json());

  const payment = await paymentService.createPayment({
    user,
    input,
  });

  return successResponse("Payment created", payment);
}
```

Kitchen status endpoint:

```ts
export async function PATCH(req: Request) {
  const user = await requireAuth();

  requirePermission(user, "restaurant.kitchen.update");

  const input = updateOrderStatusSchema.parse(await req.json());

  const order = await orderService.updateKitchenStatus({
    user,
    input,
  });

  return successResponse("Order status updated", order);
}
```

---

### 5.7 Frontend Usage Example

Frontend can use permissions for UI:

```tsx
if (hasPermission(user, "restaurant.payments.create")) {
  return <ProcessPaymentButton />;
}
```

But remember:

```txt
frontend permission check is not security
```

Backend must still enforce permission.

Frontend check only improves UX.

It prevents normal users from seeing irrelevant buttons, not determined users from sending requests manually.

---

### 5.8 Permission Test Examples

Test permission map:

```ts
import { describe, expect, it } from "vitest";
import { hasPermission } from "./permissions";

describe("permissions", () => {
  it("allows cashier to create payment", () => {
    const user = {
      id: "user_1",
      role: "CASHIER",
      permissions: ["restaurant.payments.create"],
    };

    expect(
      hasPermission(user, "restaurant.payments.create"),
    ).toBe(true);
  });

  it("blocks kitchen from creating payment", () => {
    const user = {
      id: "user_1",
      role: "KITCHEN",
      permissions: ["restaurant.kitchen.update"],
    };

    expect(
      hasPermission(user, "restaurant.payments.create"),
    ).toBe(false);
  });

  it("allows wildcard scope permission", () => {
    const user = {
      id: "user_1",
      role: "OWNER",
      permissions: ["restaurant.*"],
    };

    expect(
      hasPermission(user, "restaurant.orders.create"),
    ).toBe(true);
  });
});
```

Also test backend endpoint behavior:

```txt
KITCHEN → POST /api/payments → 403
SERVER → PATCH kitchen status → 403
CASHIER → POST /api/payments → 201
Unauthenticated → protected endpoint → 401
```

---

### 5.9 Permission Categories

#### Restaurant Orders

```txt
restaurant.orders.view
restaurant.orders.create
restaurant.orders.approve
restaurant.orders.cancel
restaurant.orders.update-status
restaurant.orders.reject
restaurant.orders.complete
```

#### Restaurant Payments

```txt
restaurant.payments.view
restaurant.payments.create
restaurant.payments.refund
restaurant.payments.void
```

#### Kitchen

```txt
restaurant.kitchen.view
restaurant.kitchen.update
```

#### Serving

```txt
restaurant.serving.view
restaurant.serving.update
```

#### Tables

```txt
restaurant.tables.view
restaurant.tables.create
restaurant.tables.update
restaurant.tables.delete
restaurant.tables.update-status
```

#### Menu

```txt
restaurant.menu.view
restaurant.menu.create
restaurant.menu.update
restaurant.menu.delete
restaurant.menu.update-availability
```

#### Inventory

```txt
shared.inventory.view
shared.inventory.create
shared.inventory.update
shared.inventory.adjust
shared.inventory.view-movements
shared.inventory.export
```

#### Reports

```txt
shared.reports.view
shared.reports.export
shared.analytics.view
shared.cashflow.view
shared.financial-reports.view
```

#### Employees

```txt
shared.employees.view
shared.employees.create
shared.employees.update
shared.employees.deactivate
shared.employees.assign-role
```

#### Shifts

```txt
shared.shifts.view
shared.shifts.open
shared.shifts.close
shared.shifts.adjust
```

#### Settings

```txt
shared.settings.view
shared.settings.update
shared.settings.payment-methods.update
shared.settings.tax.update
shared.settings.business-profile.update
```

#### Audit Logs

```txt
shared.audit-logs.view
shared.audit-logs.export
```

#### Platform Admin

```txt
platform.tenants.view
platform.tenants.update
platform.tenants.suspend
platform.subscriptions.view
platform.subscriptions.update
platform.billing.view
platform.support.view
platform.support.impersonate
platform.audit-logs.view
```

---

## 6. Anti-Patterns

Do not:

- Check role directly in every route handler
- Hide button in frontend and call it security
- Trust frontend permission
- Trust frontend role
- Trust frontend tenant scope
- Mix platform permissions with restaurant permissions
- Treat OWNER as SUPER_ADMIN
- Use vague permissions like `canManageStuff`
- Use random permission strings across files
- Create permission names without documentation
- Use only broad `manage` permission for sensitive actions
- Give wildcard permission to normal users
- Let permission bypass tenant isolation
- Let permission bypass business rules
- Let permission bypass subscription feature gate
- Forget to test permission map
- Forget to audit role/permission changes
- Keep dead permission keys forever
- Rename permission keys without migration plan
- Add new protected endpoint without permission decision

---

## 7. Checklist

Permission system is acceptable when:

- [ ] Permission key format is `scope.resource.action`.
- [ ] Permission keys are centralized.
- [ ] Permission keys are documented.
- [ ] Backend enforces permission.
- [ ] Frontend permission check is UX only.
- [ ] Role-to-permission map exists for MVP.
- [ ] Platform permissions are separated from business permissions.
- [ ] OWNER is not SUPER_ADMIN.
- [ ] Permission check does not replace tenant scope check.
- [ ] Permission check does not replace business validation.
- [ ] Mode access is separate from permission.
- [ ] Feature gating is separate from permission.
- [ ] Critical permissions are tested.
- [ ] Unauthorized requests return 401.
- [ ] Forbidden requests return 403.
- [ ] Role/permission changes are audited.
- [ ] Wildcard permissions are restricted.
- [ ] Permission names are readable and consistent.

---

## 8. References

Related documents:

- 00-ai-context.md
- 01-system-design.md
- 02-system-architecture.md
- 04-backend-api.md
- 06-auth-permissions.md
- 09-security.md
- 14-testing.md
- 16-and-more.md
- appendices/status-transitions.md
- appendices/error-codes.md
- appendices/api-response-format.md
- appendices/anti-patterns.md
- appendices/implementation-rules.md