# Security

## 1. Purpose

This document defines the security strategy for POS System V3.

It explains how the system protects users, business data, tenant data, authentication, authorization, API access, database operations, files, secrets, sessions, payments, inventory, logs, and production infrastructure.

The goal is to prevent unauthorized access, tenant data leaks, unsafe business mutations, exposed secrets, broken authorization, and insecure implementation shortcuts.

This document does not replace detailed auth, backend, database, rate limiting, logging, monitoring, or hosting documents. Security rules must be enforced across all of them.

---

## 2. Current Context

POS System V3 is a SaaS-style POS and business operating system.

The active mode is:

```txt
Restaurant / F&B
```

The system handles sensitive business data:

```txt
users
roles
sessions
orders
payments
inventory
stock movements
audit logs
cashflow
reports
settings
customer data
menu data
business configuration
```

The current system may still use:

```txt
restaurantId
```

as the ownership scope.

V3 design treats this as business/tenant ownership scope.

Security must protect:

```txt
user account
business data
tenant isolation
payment flow
inventory mutation
role and permission changes
settings
API routes
database queries
uploaded files
secrets
production deployment
```

The backend must be the security enforcement layer.

Frontend security is only user experience support.

---

## 3. Decisions

The following security decisions are locked:

1. Backend must never blindly trust the client.
2. Frontend is not a security boundary.
3. Authentication must be checked in backend.
4. Authorization must be checked in backend.
5. Tenant/business scope must be checked in backend.
6. Permission must be checked in backend.
7. Input must be validated in backend.
8. Business rules must be validated in backend.
9. Database queries for business-owned data must be scoped.
10. Passwords must be hashed.
11. Password hash must never be returned to frontend.
12. Session/token must be protected.
13. HttpOnly cookie is recommended for dashboard session.
14. Secrets must never be committed to GitHub.
15. Private environment variables must not use `NEXT_PUBLIC_*`.
16. Money, stock, payment, invoice, role, permission, and settings mutations must be protected.
17. Important mutations must create audit logs.
18. Payment and subscription webhook must be verified before trusted.
19. Uploaded files must be validated.
20. Private files must not be publicly accessible.
21. Production must use HTTPS.
22. Logs must not contain secrets.
23. Rate limiting is required for sensitive endpoints.
24. Error messages must not leak sensitive internal details.
25. Security must be considered before production or real user testing.

---

## 4. Rules

### 4.1 Never Trust Client Rule

The backend must not trust frontend-provided critical values.

Frontend may send:

```txt
menuItemId
quantity
notes
selected action
payment method
form input
```

Frontend must not be trusted for:

```txt
userId
role
permission
restaurantId
businessId
tenantId
final price
final total
payment status
stock quantity
workflow status
audit actor
subscription status
```

Backend must derive trusted values from:

```txt
current session
database
server-side config
validated provider webhook
trusted internal services
```

Bad:

```ts
const { restaurantId, role, totalAmount } = await req.json();
```

Good:

```ts
const user = await requireAuth();

const menuItems = await prisma.menuItem.findMany({
  where: {
    restaurantId: user.restaurantId,
    id: {
      in: input.items.map((item) => item.menuItemId),
    },
  },
});
```

### 4.2 Authentication Security Rules

Authentication must verify:

```txt
session/token exists
session/token is valid
session/token is not expired
user exists
user is active
business/tenant is active if applicable
```

Rules:

1. Unauthenticated requests must return `401 Unauthorized`.
2. Inactive users must be rejected.
3. Session must expire.
4. Logout must invalidate session.
5. Password reset token must expire.
6. Password reset token must not be logged.
7. Login error should be generic.

Generic login error:

```txt
Invalid email or password
```

Do not reveal:

```txt
email exists
password is wrong
user exists but inactive
```

Attackers do not need free hints. They can suffer like everyone else.

### 4.3 Password Security Rules

Password rules:

1. Never store plain text password.
2. Store password hash only.
3. Use bcrypt or argon2.
4. Never return password hash to frontend.
5. Never log password or password hash.
6. Password reset must use expiring token.
7. Password change should invalidate related sessions if needed.

Bad:

```txt
password = "admin123"
```

Good:

```txt
passwordHash = "$2a$10$..."
```

### 4.4 Session and Cookie Security Rules

Recommended session storage for dashboard:

```txt
HttpOnly cookie
server-side session or secure signed token
```

Production cookie settings:

```txt
HttpOnly
Secure
SameSite=Lax or Strict
Path=/
Max-Age / Expires
```

Rules:

1. Do not store sensitive session token in localStorage if HttpOnly cookie is available.
2. Do not keep session alive forever.
3. Do not expose session token to frontend JavaScript.
4. Do not log session token.
5. Rotate session secret if leaked.
6. Use HTTPS in production.

### 4.5 Authorization Security Rules

Authorization must check what the authenticated user is allowed to do.

Examples:

```txt
OWNER may manage business settings.
MANAGER may manage operational data.
CASHIER may create orders and payments.
KITCHEN may update kitchen status.
SERVER may update serving status.
CUSTOMER may only access customer-facing order data.
```

Rules:

1. Authenticated user is not automatically authorized.
2. Every protected mutation must check permission.
3. Role check alone is not enough for future V3.
4. Permission must be checked in backend.
5. Frontend hidden button is not security.
6. Permission failure returns `403 Forbidden`.

### 4.6 Tenant Isolation Rules

Tenant isolation is mandatory.

Current MVP scope:

```txt
restaurantId
```

Future V3 scope:

```txt
businessId
tenantId
```

Rules:

1. Every business-owned query must include ownership scope.
2. Every business-owned mutation must include ownership scope.
3. Do not use ID-only access for tenant-owned resources.
4. Scope must come from backend current user/session.
5. Platform admin cross-tenant access must be audited.
6. Tenant A must never access Tenant B data.

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

For wrong tenant access, prefer safe response:

```txt
404 Not Found
```

or:

```txt
403 Forbidden
```

depending on endpoint policy.

### 4.7 Input Validation Rules

All user input must be validated.

Validate:

```txt
email
password
name
price
quantity
status
payment amount
payment method
file upload
settings
date range
pagination params
IDs
```

Recommended tool:

```txt
Zod
```

Rules:

1. Validate request body.
2. Validate route params.
3. Validate query params.
4. Validate enum values.
5. Validate string length.
6. Validate number range.
7. Validate array size.
8. Reject invalid input before database mutation.

Frontend validation is for UX.

Backend validation is for security and correctness.

### 4.8 Business Rule Security Rules

Valid input may still be invalid business action.

Example:

```txt
status = READY
```

The value is valid, but this transition is not:

```txt
WAITING_PAYMENT → READY
```

Backend must validate:

```txt
current status
next status
allowed transition
user permission
business scope
resource state
side effects
```

Rules:

1. Do not update workflow status without transition validation.
2. Do not create payment for non-payable order.
3. Do not create duplicate payment.
4. Do not deduct stock without stock movement.
5. Do not modify completed/cancelled records without explicit rule.
6. Do not update settings without permission and audit.

### 4.9 API Security Rules

Protected API routes must check:

```txt
authentication
active user
business scope
mode access if relevant
permission
input validation
business rule
```

Rules:

1. API must not rely on frontend route guard.
2. API must not expose stack traces in production response.
3. API must return consistent error response.
4. API must rate limit sensitive routes.
5. API must avoid leaking existence of cross-tenant resources.
6. API must not expose internal-only fields.

Sensitive endpoints:

```txt
/api/auth/login
/api/auth/register
/api/password-reset
/api/orders
/api/payments
/api/settings
/api/users
/api/inventory
/api/reports/export
/api/webhooks/*
```

### 4.10 Database Security Rules

Database access must be protected through backend.

Rules:

1. Frontend must not directly access database.
2. Database credentials must never be exposed.
3. Database URL must not be logged.
4. Queries must be scoped by business.
5. Raw SQL must be parameterized.
6. Avoid unsafe raw query execution.
7. Production database must not be reset casually.
8. Production database must have backup.
9. Migration must be reviewed before production.

Bad:

```ts
await prisma.$queryRawUnsafe(
  `SELECT * FROM users WHERE email = '${email}'`
);
```

Better:

```ts
await prisma.$queryRaw`
  SELECT * FROM users WHERE email = ${email}
`;
```

Use Prisma query methods where possible.

### 4.11 File Upload Security Rules

Files must be validated before storing.

Validate:

```txt
file type
file size
file extension
mime type
ownership scope
upload permission
```

Rules:

1. Do not trust file name from user.
2. Do not store executable files unless explicitly needed.
3. Do not store private files with public access.
4. Do not expose storage secret keys to frontend.
5. Use signed upload/download flow for private files if needed.
6. Store file metadata in database.
7. Include business scope in file metadata and storage path.

File categories:

```txt
Public:
menu image
business logo

Private:
invoice PDF
payment proof
report export
internal attachment
```

### 4.12 Secret Management Rules

Secrets include:

```txt
DATABASE_URL
SESSION_SECRET
JWT_SECRET
STORAGE_SECRET_KEY
PAYMENT_SECRET_KEY
WEBHOOK_SECRET
SENTRY_AUTH_TOKEN
private keys
```

Rules:

1. Do not commit secrets to GitHub.
2. Do not expose secrets with `NEXT_PUBLIC_*`.
3. Do not log secrets.
4. Store production secrets in hosting provider environment variables.
5. Use different secrets for local, staging, and production.
6. Rotate leaked secrets immediately.
7. Keep `.env.example` safe and placeholder-only.

Bad:

```env
NEXT_PUBLIC_DATABASE_URL="postgresql://..."
```

That is not configuration. That is public embarrassment with credentials.

### 4.13 XSS Protection Rules

XSS risk exists when unsafe user content is rendered in browser.

Risky fields:

```txt
menu description
business description
customer note
order note
custom message
uploaded file name
user name
```

Rules:

1. Rely on React escaping by default.
2. Avoid `dangerouslySetInnerHTML`.
3. Sanitize HTML if rich text is ever allowed.
4. Do not store auth token in localStorage if avoidable.
5. Use Content Security Policy in production when ready.
6. Validate and limit user-generated text.

Safe:

```tsx
<p>{menu.description}</p>
```

Risky:

```tsx
<div dangerouslySetInnerHTML={{ __html: menu.description }} />
```

The word “dangerously” is right there. Software tried to warn us. Humanity proceeded anyway.

### 4.14 CSRF Protection Rules

If using cookie-based auth, CSRF must be considered.

Rules:

1. Use `SameSite=Lax` or `SameSite=Strict` for auth cookies.
2. Use CSRF token for sensitive cross-site mutation if needed.
3. Do not allow unsafe cross-origin mutation.
4. Validate request origin for sensitive endpoints when appropriate.
5. Do not disable browser protections casually.

Sensitive mutation endpoints:

```txt
payment
settings
role/permission update
inventory adjustment
order status update
user management
```

### 4.15 CORS Rules

CORS must be restrictive.

Rules:

1. Do not use wildcard origin for authenticated APIs in production.
2. Allow only trusted frontend domains.
3. Keep credentials policy strict.
4. Separate public customer endpoints from internal dashboard endpoints if needed.
5. Review CORS when frontend/backend are separated.

Bad:

```txt
Access-Control-Allow-Origin: *
Access-Control-Allow-Credentials: true
```

That is the security equivalent of leaving the door open and calling it hospitality.

### 4.16 Payment Security Rules

Payment flow must be protected.

Rules:

1. Backend must validate payable state.
2. Backend must validate amount.
3. Backend must prevent duplicate payment.
4. Backend must update payment/order status in transaction.
5. Payment creation must create audit log.
6. Payment provider webhook must verify signature.
7. Frontend payment success page must not be trusted as final payment proof.
8. Refund must require permission and audit.

For manual MVP payment:

```txt
cashier creates payment
backend validates order
backend validates amount
backend updates status
backend audits action
```

For future gateway payment:

```txt
provider webhook
signature verification
idempotency
database transaction
audit log
```

### 4.17 Inventory Security Rules

Inventory affects business accuracy.

Rules:

1. Stock quantity must not change without stock movement.
2. Stock adjustment must require permission.
3. Stock correction must require reason.
4. Stock mutation must be scoped.
5. Stock mutation must be audited.
6. Backend must validate sufficient stock when needed.
7. Frontend stock value must not be trusted.

### 4.18 Audit Security Rules

Audit logs protect accountability.

Audit required for:

```txt
login security events when relevant
role changed
permission changed
settings updated
payment created
payment refunded
order cancelled
order status changed
stock adjusted
invoice voided
platform admin tenant access
```

Rules:

1. Audit actor must come from backend current user.
2. Audit must include entity type and entity ID.
3. Audit must be scoped.
4. Audit must not store secrets.
5. Normal users must not edit audit logs.
6. Audit log viewing must require permission.

### 4.19 Error Message Security Rules

Production error response must not leak internals.

Do not expose:

```txt
stack trace
database URL
SQL query with secrets
session token
internal file path
provider secret
full environment config
```

Good production error:

```json
{
  "success": false,
  "message": "Internal server error",
  "code": "INTERNAL_SERVER_ERROR"
}
```

Logs may contain safe debugging metadata.

User-facing error must be safe.

### 4.20 Rate Limiting Security Rules

Rate limit sensitive endpoints.

Required:

```txt
login
register
password reset
customer order
payment
report export
webhook if applicable
```

Rate limiting is covered in:

```txt
10-rate-limiting.md
```

Rules:

1. Login must be rate-limited.
2. Password reset must be rate-limited.
3. Public customer order must be rate-limited.
4. Expensive reports must be rate-limited.
5. Rate limit logs should not expose sensitive data.

---

## 5. Implementation Guide

### 5.1 Security Request Flow

Protected mutation flow:

```txt
Request received
↓
requireAuth()
↓
requireActiveUser()
↓
requireBusinessScope()
↓
requireModeAccess() if needed
↓
requirePermission()
↓
validate input
↓
load resource with scope
↓
validate business rule
↓
execute transaction
↓
create audit log
↓
return safe response
```

This flow applies to:

```txt
order creation
payment creation
status update
stock adjustment
settings update
role update
invoice mutation
```

---

### 5.2 Security Helper Functions

Recommended helpers:

```txt
requireAuth()
requireActiveUser()
requirePermission()
requireModeAccess()
requireBusinessScope()
validateTransition()
safeErrorResponse()
createAuditLog()
sanitizePublicUser()
```

Example:

```ts
const user = await requireAuth();

requirePermission(user, "restaurant.payments.create");

const input = paymentSchema.parse(await req.json());

const payment = await paymentService.createPayment({
  user,
  input,
});

return successResponse("Payment created", payment);
```

---

### 5.3 Secure Current User Object

Safe current user object:

```ts
type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  restaurantId: string;
  permissions: string[];
  isActive: boolean;
};
```

Must not include:

```txt
passwordHash
session token
reset token
internal secret
private security metadata
```

---

### 5.4 Tenant-Scoped Query Pattern

Use scoped query helpers where possible.

Example concept:

```ts
async function findOrderForUser(orderId: string, user: CurrentUser) {
  return prisma.order.findFirst({
    where: {
      id: orderId,
      restaurantId: user.restaurantId,
    },
  });
}
```

If not found:

```txt
return NOT_FOUND
```

Do not reveal whether the order exists in another tenant.

---

### 5.5 Secure Payment Mutation

Payment mutation should:

```txt
require auth
require payment permission
validate input
load order with scope
validate order payable status
validate amount
prevent duplicate payment
use transaction
create payment
update order status
create audit log
return safe response
```

Duplicate protection may use:

```txt
unique order payment constraint
status validation
idempotency key
transaction
```

---

### 5.6 Secure Stock Mutation

Stock mutation should:

```txt
require auth
require inventory permission
validate input
load inventory item with scope
validate quantity
use transaction
create stock movement
update stock quantity
create audit log
return safe response
```

Never update stock silently.

---

### 5.7 Secure Settings Mutation

Settings update should:

```txt
require auth
require settings permission
validate input
load settings with scope
update allowed fields only
create audit log
return safe response
```

Rules:

1. Do not allow arbitrary settings object update.
2. Whitelist fields.
3. Audit old and new values if safe.
4. Do not expose secrets in settings response.

---

### 5.8 Secure File Upload Flow

Recommended upload flow:

```txt
frontend selects file
↓
backend checks auth and permission
↓
backend validates file type and size
↓
backend creates safe file key
↓
file stored in object storage
↓
database stores metadata
↓
response returns safe file reference
```

File key should include scope:

```txt
restaurants/{restaurantId}/menu/{fileId}.webp
restaurants/{restaurantId}/invoices/{invoiceId}.pdf
```

Do not use raw user filename as storage path.

---

### 5.9 Production Security Minimum

Before production or serious user testing:

```txt
HTTPS enabled
secure cookie config
secrets in environment variables
no secrets in GitHub
database scoped queries
backend permission checks
input validation
basic rate limiting
audit logs for important mutations
error tracking enabled
logs avoid secrets
database backup enabled
```

This is the minimum. Not luxury. Minimum. Like brakes on a car, not seat massage.

---

## 6. Anti-Patterns

Do not:

- Trust frontend role
- Trust frontend permission
- Trust frontend business scope
- Trust frontend total amount
- Trust frontend payment status
- Trust frontend stock quantity
- Use frontend guards as final security
- Query tenant-owned data by ID only
- Return passwordHash to frontend
- Store password in plain text
- Store sensitive token in localStorage when HttpOnly cookie is available
- Commit `.env` secrets
- Put secrets in `NEXT_PUBLIC_*`
- Log password, token, reset token, database URL, or API secret
- Use wildcard CORS with credentials
- Expose stack trace in production response
- Use unsafe raw SQL with user input
- Let KITCHEN create payment
- Let SERVER update payment
- Let CUSTOMER access dashboard APIs
- Let OWNER access other tenants
- Let platform admin access tenant data without audit
- Update stock without stock movement
- Create payment without duplicate protection
- Trust payment success page instead of backend/provider verification
- Store private files as public files
- Disable validation because frontend already validates
- Skip audit logs for critical mutations

---

## 7. Checklist

Security is acceptable when:

- [ ] Backend enforces authentication.
- [ ] Backend enforces authorization.
- [ ] Backend enforces business scope.
- [ ] Backend validates input.
- [ ] Backend validates business rules.
- [ ] Frontend is not treated as security boundary.
- [ ] Passwords are hashed.
- [ ] Password hash is never returned.
- [ ] Session expires.
- [ ] Production cookies are secure.
- [ ] Tenant-owned queries are scoped.
- [ ] Critical mutations create audit logs.
- [ ] Payment mutation is duplicate-safe.
- [ ] Stock mutation creates stock movement.
- [ ] Secrets are not committed.
- [ ] Private env variables do not use `NEXT_PUBLIC_*`.
- [ ] Production uses HTTPS.
- [ ] File uploads are validated.
- [ ] Private files are protected.
- [ ] Sensitive endpoints are rate-limited.
- [ ] Production errors do not leak internals.
- [ ] Logs do not contain secrets.
- [ ] Database backup exists before production.

---

## 8. References

Related documents:

- 00-ai-context.md
- 01-system-design.md
- 02-system-architecture.md
- 03-frontend.md
- 04-backend-api.md
- 05-database-storage.md
- 06-auth-permissions.md
- 07-hosting-cloud.md
- 10-rate-limiting.md
- 12-error-tracking-logs.md
- 13-monitoring-alerts.md
- 14-testing.md
- appendices/permission-keys.md
- appendices/status-transitions.md
- appendices/error-codes.md
- appendices/implementation-rules.md