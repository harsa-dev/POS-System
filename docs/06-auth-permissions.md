# Auth & Permissions

## 1. Purpose

This document defines authentication, authorization, role strategy, permission strategy, session handling, route protection, API protection, tenant/business scope, and access control rules for POS System V3.

The goal is to ensure that every user can only access data and actions they are allowed to access.

This document also prevents frontend-only security, role confusion, cross-tenant access, and unsafe shortcuts in backend authorization.

---

## 2. Current Context

POS System V3 currently focuses on Restaurant / F&B operations.

The active mode is:

```txt
Restaurant / F&B
```

Current or MVP roles may include:

```txt
OWNER
MANAGER
CASHIER
KITCHEN
SERVER
```

V3 is moving toward a more flexible permission model based on:

```txt
global role
business ownership scope
mode access
permission keys
```

Current implementation may still use:

```txt
restaurantId
```

as the ownership scope.

In V3 design, this should be treated as the current implementation of:

```txt
businessId / tenantId
```

The backend must enforce all authentication, authorization, permission, and business scope checks.

Frontend may hide UI for better user experience, but frontend must never be the final security layer.

---

## 3. Decisions

The following auth and permission decisions are locked:

1. Authentication proves who the user is.
2. Authorization decides what the user can do.
3. Backend must enforce authentication.
4. Backend must enforce authorization.
5. Frontend permission checks are only for user experience.
6. Protected API routes must not rely on frontend guards.
7. User identity must come from a trusted session or token.
8. User role must come from backend/database/session, not request body.
9. Business scope must come from current user/session.
10. Current MVP may use role enum.
11. V3 direction should support permission keys.
12. Role describes responsibility.
13. Permission controls actual access.
14. Platform roles must be separated from business roles.
15. Business-wide roles must be separated from mode-specific roles.
16. External actors must be separated from login-capable users.
17. OWNER is not SUPER_ADMIN.
18. Restaurant / F&B roles are active MVP roles.
19. Retail, Raw Material, and Service permissions may be planned but not fully implemented yet.
20. Inactive users must not access protected routes.
21. Auth session must expire.
22. Password must be hashed.
23. Password hash must never be returned to frontend.
24. Important role or permission changes must create audit logs.
25. Tenant/business scope must be checked together with permission.

---

## 4. Rules

### 4.1 Authentication Rules

Authentication must verify:

```txt
user exists
password or session is valid
user is active
session/token is valid
session/token is not expired
business/tenant is valid when applicable
```

Backend must reject unauthenticated requests with:

```txt
401 Unauthorized
```

Authentication must not trust:

```txt
userId from request body
role from request body
permission from request body
restaurantId from request body
businessId from request body
tenantId from request body
```

### 4.2 Authorization Rules

Authorization must verify whether the authenticated user can perform the requested action.

Backend must reject authenticated but unauthorized requests with:

```txt
403 Forbidden
```

Example:

```txt
KITCHEN can update kitchen order status.
KITCHEN cannot create payment.
CASHIER can process payment.
CASHIER cannot update kitchen status unless explicitly permitted.
SERVER can update serving status.
SERVER cannot update payment.
```

### 4.3 Role Rules

Role describes user responsibility.

MVP roles may include:

```txt
OWNER
MANAGER
CASHIER
KITCHEN
SERVER
```

Future global roles may include:

```txt
OWNER
MANAGER
ADMIN
ACCOUNTANT
STAFF
VIEWER
```

Platform roles may include:

```txt
SUPER_ADMIN
SUPPORT_ADMIN
BILLING_ADMIN
```

Rules:

1. OWNER controls one business.
2. SUPER_ADMIN controls the platform.
3. OWNER must not access other tenants.
4. STAFF may require mode-specific permissions.
5. Role alone should not become the only access control forever.

### 4.4 Permission Rules

Permissions should use this format:

```txt
scope.resource.action
```

Examples:

```txt
core.settings.update
core.audit.view
shared.invoice.create
shared.cashflow.view
restaurant.orders.create
restaurant.payments.create
restaurant.kitchen.update
restaurant.serving.update
retail.checkout.create
raw-material.weighing.create
service.job.assign
```

Rules:

1. Backend must check permission for protected actions.
2. Permission names must be stable and readable.
3. Permission must describe real action.
4. Do not create vague permissions like `canDoStuff`.
5. Do not create one giant role for every job combination.
6. Use permission keys for flexibility.

### 4.5 Business Scope Rules

Every protected business action must check business ownership scope.

Current MVP may use:

```txt
restaurantId
```

Future V3 may use:

```txt
businessId
tenantId
```

Rules:

1. Scope must come from current user/session.
2. Scope must not come from request body as final truth.
3. Every business-owned resource must be queried with scope.
4. Permission check without business scope is incomplete.
5. Cross-tenant access is only allowed for platform roles and must be audited.

Bad:

```ts
await prisma.order.findUnique({
  where: { id },
});
```

Good:

```ts
await prisma.order.findFirst({
  where: {
    id,
    restaurantId: user.restaurantId,
  },
});
```

### 4.6 Mode Access Rules

V3 supports business modes:

```txt
Restaurant / F&B
Retail / Supermarket
Raw Material / Livestock / Kandang
Service / Custom Business
```

Mode access determines which business modes a user may access.

Rules:

1. Restaurant / F&B is active.
2. Other modes may be planned.
3. User must have access to the selected mode.
4. LocalStorage selected mode is not security.
5. Backend must validate mode access for mode-specific protected actions.

### 4.7 Frontend Guard Rules

Frontend may:

```txt
hide menu
hide button
disable action
redirect page
show unauthorized page
```

Frontend must not:

```txt
be the only permission check
be the only route protection
decide final role
decide final permission
decide final business scope
```

Frontend guards are for UX.

Backend guards are for security.

### 4.8 Password Rules

Password rules:

1. Password must be hashed.
2. Password must never be stored in plain text.
3. Password hash must never be returned to frontend.
4. Login error message should be generic.
5. Password reset token must expire.
6. Password reset token must not be logged.
7. Password changes should invalidate relevant sessions if needed.

Recommended hashing:

```txt
bcrypt
argon2
```

### 4.9 Session Rules

Session rules:

1. Session must be created after successful login.
2. Session must expire.
3. Logout must invalidate session.
4. Inactive user session must be rejected.
5. Session token must be stored securely.
6. HttpOnly cookie is recommended for dashboard app.
7. Do not store sensitive auth token in localStorage if avoidable.

Cookie security:

```txt
HttpOnly
Secure in production
SameSite=Lax or Strict
Path=/
Max-Age / Expires
```

### 4.10 Audit Rules

Audit is required for important auth and permission actions.

Audit required for:

```txt
user created
user deactivated
user reactivated
role changed
permission changed
password reset requested
password changed
platform admin accessed tenant
support admin accessed tenant
session revoked
```

Audit actor must come from backend current user.

Frontend must not send final audit actor.

---

## 5. Implementation Guide

### 5.1 Auth Concepts

Authentication answers:

```txt
Who is this user?
```

Authorization answers:

```txt
What can this user do?
```

Example:

```txt
User logs in as KITCHEN.

Authentication:
valid user.

Authorization:
can update kitchen order status.
cannot process payment.
```

Use correct HTTP status:

```txt
401 Unauthorized:
not logged in or invalid session

403 Forbidden:
logged in but does not have permission
```

---

### 5.2 Recommended User Model

Current MVP conceptual shape:

```ts
type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  restaurantId: string;
  isActive: boolean;
};
```

Future V3 conceptual shape:

```ts
type CurrentUser = {
  id: string;
  businessId: string;
  name: string;
  email: string;
  globalRole: GlobalRole;
  modeAccess: BusinessMode[];
  permissions: PermissionKey[];
  isActive: boolean;
};
```

Global role:

```ts
type GlobalRole =
  | "OWNER"
  | "MANAGER"
  | "ADMIN"
  | "ACCOUNTANT"
  | "STAFF"
  | "VIEWER";
```

Business mode:

```ts
type BusinessMode =
  | "RESTAURANT"
  | "RETAIL"
  | "RAW_MATERIAL"
  | "SERVICE";
```

Permission key:

```ts
type PermissionKey = string;
```

---

### 5.3 Login Flow

Login flow:

```txt
User submits email and password
↓
Backend validates input
↓
Backend finds user by email
↓
Backend checks user exists
↓
Backend checks user is active
↓
Backend compares password with passwordHash
↓
Backend creates session
↓
Backend sets secure cookie
↓
Backend returns safe user object
```

Safe user response must not include:

```txt
password
passwordHash
session token if using HttpOnly cookie
secret
internal security metadata
```

Generic login error:

```txt
Invalid email or password
```

Do not reveal:

```txt
email exists but password wrong
email not found
user exists but inactive
```

Keep response safe. Attackers do not need free hints. Shocking, apparently.

---

### 5.4 Logout Flow

Logout flow:

```txt
User clicks logout
↓
Frontend calls logout endpoint
↓
Backend deletes or invalidates session
↓
Backend clears cookie
↓
Frontend redirects to login
```

Logout must not be only frontend redirect.

If cookie/session remains valid, the user is not actually logged out.

---

### 5.5 Current User Flow

Current user endpoint:

```txt
GET /api/auth/me
```

Response should include safe user data:

```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "name": "Cashier",
    "email": "cashier@example.com",
    "role": "CASHIER",
    "restaurantId": "resto_123",
    "permissions": [
      "restaurant.orders.create",
      "restaurant.payments.create"
    ]
  }
}
```

Frontend may use this for:

```txt
display user profile
render navigation
hide unavailable actions
redirect unauthenticated users
```

But every protected backend API must still check auth independently.

---

### 5.6 Backend Auth Helper

Recommended helpers:

```txt
getCurrentUser()
requireAuth()
requirePermission()
requireAnyPermission()
requireModeAccess()
requireBusinessScope()
requireActiveUser()
```

Example:

```ts
const user = await requireAuth();

requirePermission(user, "restaurant.payments.create");
```

A protected API should not manually duplicate auth logic everywhere.

Centralize auth helpers.

---

### 5.7 Permission Map for MVP

MVP may use hardcoded role-permission map.

Example:

```ts
const rolePermissions = {
  OWNER: ["*"],
  MANAGER: [
    "restaurant.orders.view",
    "restaurant.orders.update-status",
    "restaurant.payments.create",
    "restaurant.kitchen.update",
    "restaurant.serving.update",
    "shared.reports.view",
    "shared.cashflow.view"
  ],
  CASHIER: [
    "restaurant.orders.create",
    "restaurant.orders.view",
    "restaurant.orders.approve",
    "restaurant.payments.create"
  ],
  KITCHEN: [
    "restaurant.kitchen.view",
    "restaurant.kitchen.update"
  ],
  SERVER: [
    "restaurant.serving.view",
    "restaurant.serving.update"
  ]
} as const;
```

This is acceptable for MVP.

Future version may move permission assignment to database.

Do not build dynamic permission UI before core workflow is stable. That is how “simple auth” becomes a swamp.

---

### 5.8 Permission Check Helper

Conceptual helper:

```ts
function hasPermission(user: CurrentUser, permission: PermissionKey) {
  if (user.permissions.includes("*")) {
    return true;
  }

  return user.permissions.includes(permission);
}

function requirePermission(user: CurrentUser, permission: PermissionKey) {
  if (!hasPermission(user, permission)) {
    throw new AppError({
      code: "FORBIDDEN",
      message: "Forbidden",
      statusCode: 403,
    });
  }
}
```

Rules:

1. `OWNER` may use wildcard in MVP.
2. Wildcard must be used carefully.
3. Platform admin wildcard must not automatically apply to tenant business actions without audit.
4. Permission helper must be used in backend services/routes.

---

### 5.9 Business Scope Helper

Conceptual helper:

```ts
function requireSameBusiness(
  userBusinessId: string,
  resourceBusinessId: string,
) {
  if (userBusinessId !== resourceBusinessId) {
    throw new AppError({
      code: "TENANT_ACCESS_DENIED",
      message: "Resource not found",
      statusCode: 404,
    });
  }
}
```

For MVP with restaurantId:

```ts
function requireSameRestaurant(
  userRestaurantId: string,
  resourceRestaurantId: string,
) {
  if (userRestaurantId !== resourceRestaurantId) {
    throw new AppError({
      code: "TENANT_ACCESS_DENIED",
      message: "Resource not found",
      statusCode: 404,
    });
  }
}
```

Returning `404` for wrong-scope resource may be safer than exposing that the resource exists.

---

### 5.10 Mode Access Helper

Conceptual helper:

```ts
function requireModeAccess(user: CurrentUser, mode: BusinessMode) {
  if (!user.modeAccess.includes(mode)) {
    throw new AppError({
      code: "MODE_ACCESS_DENIED",
      message: "Mode access denied",
      statusCode: 403,
    });
  }
}
```

MVP may simplify this while only Restaurant mode is active.

But the design should not block future mode access.

---

### 5.11 Route Protection

Frontend route protection:

```txt
redirect unauthenticated users away from dashboard
hide pages based on role
show unauthorized page
```

Backend route protection:

```txt
require auth
require permission
require business scope
require mode access when relevant
validate business rule
```

Backend route protection is mandatory.

Frontend route protection is optional UX improvement.

---

### 5.12 Restaurant Role Permissions

Restaurant active permissions may include:

```txt
restaurant.orders.view
restaurant.orders.create
restaurant.orders.approve
restaurant.orders.cancel
restaurant.payments.create
restaurant.kitchen.view
restaurant.kitchen.update
restaurant.serving.view
restaurant.serving.update
restaurant.tables.view
restaurant.tables.manage
restaurant.menu.view
restaurant.menu.manage
restaurant.inventory.view
restaurant.inventory.manage
```

Recommended mapping:

```txt
OWNER:
all restaurant permissions

MANAGER:
view/manage operational data, reports, selected settings

CASHIER:
create/view/approve orders, process payment, manage own shift

KITCHEN:
view kitchen queue, update PAID → PREPARING, update PREPARING → READY

SERVER:
view serving queue, update READY → SERVED, update SERVED → COMPLETED
```

---

### 5.13 Platform Roles

Platform roles are not tenant business roles.

Platform roles:

```txt
SUPER_ADMIN
SUPPORT_ADMIN
BILLING_ADMIN
```

SUPER_ADMIN may manage platform-level systems.

SUPPORT_ADMIN may help tenants.

BILLING_ADMIN may manage SaaS billing.

Rules:

1. Platform roles must be separated from business roles.
2. Platform admin tenant access must be audited.
3. Platform admin must not silently modify tenant data.
4. OWNER must not be treated as SUPER_ADMIN.

---

### 5.14 External Actors

External actors may include:

```txt
CUSTOMER
SUPPLIER
BUYER
CLIENT
MEMBER
```

External actors are not always login-capable users.

Rules:

1. Customer must not access internal dashboard.
2. Supplier must not access internal dashboard unless supplier portal exists.
3. Client portal is future scope.
4. Customer order status must be scoped to their own order/session/table token.
5. External actor access must be limited and explicit.

---

### 5.15 Future Permission System

Future V3 may support database-driven permission management.

Possible models:

```txt
Permission
RoleTemplate
UserRoleAssignment
UserPermissionOverride
ModeAccess
```

Concept:

```txt
RoleTemplate:
Restaurant Cashier

Permissions:
restaurant.orders.create
restaurant.orders.approve
restaurant.payments.create
```

User may have:

```txt
global role
mode access
role template
permission overrides
```

This is future scope.

MVP should keep permission implementation simple and stable.

---

## 6. Anti-Patterns

Do not:

- Treat login as the only security layer
- Use frontend route guard as final API protection
- Trust role from request body
- Trust permission from request body
- Trust restaurantId/businessId/tenantId from request body
- Let KITCHEN create payment
- Let CASHIER update kitchen status unless explicitly permitted
- Let SERVER update payment
- Let CUSTOMER access staff dashboard
- Mix OWNER with SUPER_ADMIN
- Let OWNER access other tenants
- Let support admin access tenant data without audit
- Return passwordHash to frontend
- Store password in plain text
- Store session token in localStorage if HttpOnly cookie is available
- Use overly specific role names for every job combination
- Create giant global role enum without permission strategy
- Build complex dynamic permission UI before workflow is stable
- Check role without checking business scope
- Query protected data by ID only
- Allow inactive users to access the system
- Leave sessions with no expiration
- Log password, token, reset token, or secret

---

## 7. Checklist

Auth and permission system is acceptable when:

- [ ] Password is hashed.
- [ ] Password hash is never returned to frontend.
- [ ] Login uses generic error message.
- [ ] Session/token expires.
- [ ] Logout invalidates session.
- [ ] Inactive users are rejected.
- [ ] Protected APIs require authentication.
- [ ] Protected APIs enforce permission.
- [ ] Protected APIs enforce business scope.
- [ ] Mode-specific APIs enforce mode access when applicable.
- [ ] Frontend guards are treated as UX only.
- [ ] Backend guards are mandatory.
- [ ] Role and permission changes are audited.
- [ ] Platform roles are separated from business roles.
- [ ] OWNER is not treated as SUPER_ADMIN.
- [ ] External actors cannot access internal dashboard.
- [ ] Current MVP roles still support Restaurant workflow.
- [ ] Permission keys are documented.
- [ ] No role-only access shortcut breaks tenant isolation.

---

## 8. References

Related documents:

- 00-ai-context.md
- 01-system-design.md
- 02-system-architecture.md
- 03-frontend.md
- 04-backend-api.md
- 05-database-storage.md
- 09-security.md
- 12-error-tracking-logs.md
- 14-testing.md
- appendices/permission-keys.md
- appendices/status-transitions.md
- appendices/implementation-rules.md