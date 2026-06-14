# Anti-Patterns

## 1. Purpose

This appendix documents anti-patterns that must be avoided in POS System V3.

Anti-patterns are common bad solutions that may look fast, simple, or convenient at first, but create bugs, security holes, messy architecture, scaling problems, or painful refactors later.

The goal is to make bad decisions visible before they become permanent.

This document is not written to make the project slower.

It exists because “temporary solution” is one of the most successful lies in software history.

---

## 2. Current Context

POS System V3 is a SaaS-style POS and business operating system.

The current active mode is:

```txt
Restaurant
```

Core workflows:

```txt
auth
permissions
orders
payments
kitchen
serving
inventory
stock movement
settings
analytics
reports
audit logs
deployment
monitoring
testing
```

The project is intended to grow into a modular multi-mode system.

Future modes may include:

```txt
Retail / Supermarket
Raw Material / Livestock / Kandang
Service / Custom Business
```

Because of this, the project must avoid decisions that:

```txt
lock everything to restaurant-only assumptions
scatter business logic everywhere
trust frontend too much
skip tenant scope
skip permission checks
skip tests
skip audit logs
fake enterprise readiness
overbuild infrastructure too early
```

The system should stay practical, but not careless.

There is a difference between “simple” and “reckless.” Humans confuse those regularly, which explains many dashboards.

---

## 3. Decisions

The following anti-pattern decisions are locked:

1. Do not build microservices for MVP.
2. Do not build all business modes at once.
3. Do not put business logic in frontend components.
4. Do not trust frontend role, price, status, tenant ID, or total amount.
5. Do not update order status directly without transition validation.
6. Do not process payment without idempotency/duplicate prevention.
7. Do not mutate stock without stock movement.
8. Do not query tenant-owned data by ID only.
9. Do not skip backend permission checks.
10. Do not treat hidden buttons as security.
11. Do not return inconsistent API response shapes.
12. Do not return raw stack traces in production.
13. Do not log secrets.
14. Do not cache critical operational data with unsafe TTL.
15. Do not fetch unlimited records.
16. Do not render huge tables without pagination/virtualization.
17. Do not ignore database indexes.
18. Do not use production database for tests.
19. Do not deploy with type errors.
20. Do not add `any` just to silence TypeScript.
21. Do not store uploaded files in app server filesystem.
22. Do not mix SaaS billing payment with restaurant customer payment.
23. Do not treat OWNER as SUPER_ADMIN.
24. Do not fake enterprise features with empty placeholders.
25. Do not call the system production-ready without security, backup, logs, and monitoring.

---

## 4. Rules

### 4.1 Architecture Anti-Patterns

#### Anti-pattern: Microservices too early

Bad:

```txt
auth-service
order-service
payment-service
inventory-service
analytics-service
notification-service
gateway
event-bus
```

while the project is still solo, MVP, and not stable.

Why bad:

```txt
deployment becomes harder
debugging becomes harder
data consistency becomes harder
local development becomes harder
business logic becomes scattered
```

Correct approach:

```txt
modular monolith first
clear feature boundaries
service layer
repository layer
shared core
extract service only when justified
```

#### Anti-pattern: Folder structure cosplay

Bad:

```txt
folders look enterprise
but logic is still random
```

Example:

```txt
src/
├─ enterprise/
├─ core/
├─ domain/
├─ infrastructure/
├─ services/
├─ modules/
└─ final-final/
```

but every folder imports everything.

Correct approach:

```txt
folder structure must reflect real boundaries
features should own their components/services/schemas/types
shared code should be truly shared
```

A folder named `core` does not magically create architecture. Shocking, yes.

#### Anti-pattern: Moving stable code only for folder purity

Bad:

```txt
route works
feature works
but moved aggressively just because folder looks prettier
```

Risk:

```txt
broken imports
broken routes
broken deployment
lost context
new bugs without product value
```

Correct approach:

```txt
refactor gradually
move with tests/build check
preserve behavior
avoid cosmetic architecture churn
```

---

### 4.2 Multi-Mode Anti-Patterns

#### Anti-pattern: Building all modes at once

Bad:

```txt
Restaurant
Retail
Livestock
Service
```

all partially built, none stable.

Why bad:

```txt
too many workflows
too many schemas
too many UI assumptions
too many unfinished modules
```

Correct approach:

```txt
make Restaurant stable first
standardize shared core
prepare mode registry
document future modes
implement future modes one at a time
```

#### Anti-pattern: Forcing restaurant logic into every mode

Bad:

```txt
every business has kitchen
every business has table
every business has menu item
every business has server role
```

Correct approach:

```txt
shared core handles common systems
mode-specific module handles workflow
```

Example:

```txt
shared:
auth, permissions, inventory, reports, payments, audit

restaurant:
kitchen, serving, tables, menu

retail:
barcode, product catalog, checkout lane

livestock:
batch, lot, weight, production cycle
```

#### Anti-pattern: Hardcoding mode checks everywhere

Bad:

```ts
if (mode === "restaurant") {
  // do restaurant thing
}

if (mode === "retail") {
  // do retail thing
}
```

scattered across many files.

Correct approach:

```txt
mode registry
mode-specific routes/modules
shared interface where useful
centralized mode access check
```

---

### 4.3 Frontend Anti-Patterns

#### Anti-pattern: Business logic in React components

Bad:

```txt
CashierPage.tsx
- validates role
- calculates price
- checks stock
- updates order
- updates payment
- updates inventory
- creates audit log
```

Correct approach:

```txt
frontend collects input
backend validates business logic
service layer executes transaction
frontend displays result
```

Frontend should not be the judge, cashier, accountant, and stock manager at once. It can barely keep a modal open correctly.

#### Anti-pattern: Hidden button as security

Bad:

```tsx
{user.role === "CASHIER" && <PaymentButton />}
```

then API has no permission check.

Correct approach:

```txt
frontend hides button for UX
backend enforces permission for security
```

Backend must still reject:

```txt
KITCHEN → POST /api/payments → 403
```

#### Anti-pattern: Fetching all data for frontend filtering

Bad:

```txt
GET /api/orders/all
frontend filters by status/date/search
```

Correct approach:

```txt
GET /api/orders?status=PAID&page=1&limit=20
```

Rules:

```txt
filter on backend
paginate on backend
index database for query pattern
return only needed fields
```

#### Anti-pattern: Rendering massive tables

Bad:

```txt
render 50,000 rows in browser
```

Correct approach:

```txt
pagination
server-side filtering
virtualized list if needed
```

Browser is not a landfill for database rows.

#### Anti-pattern: No loading/error/empty state

Bad:

```txt
blank page
broken spinner forever
error only in console
```

Correct approach:

```txt
loading state
empty state
error state
retry action
clear user message
```

---

### 4.4 Backend/API Anti-Patterns

#### Anti-pattern: Route handler contains everything

Bad:

```txt
route.ts:
- parse body
- auth
- permission
- validate status
- calculate total
- query menu
- update stock
- create order
- create payment
- audit log
- response formatting
```

Correct approach:

```txt
route handler:
request/response only

schema:
input validation

service:
business logic and transaction

repository:
database access

permission helper:
authorization

response helper:
standard response
```

#### Anti-pattern: Direct database update from input

Bad:

```ts
await prisma.order.update({
  where: { id },
  data: {
    status: input.status,
  },
});
```

Correct approach:

```ts
await orderService.transitionOrderStatus({
  user,
  orderId,
  nextStatus: input.status,
});
```

#### Anti-pattern: Trusting frontend total amount

Bad:

```ts
const { totalAmount } = await req.json();

await prisma.payment.create({
  data: { amount: totalAmount },
});
```

Correct approach:

```txt
frontend sends menuItemId and quantity
backend loads prices from database
backend calculates subtotal/tax/service/total
backend validates payment amount
```

#### Anti-pattern: Random API response format

Bad:

```json
{ "ok": true }
```

then:

```json
{ "success": true, "result": {} }
```

then:

```json
{ "data": {}, "error": null }
```

Correct approach:

```json
{
  "success": true,
  "data": {}
}
```

or:

```json
{
  "success": false,
  "message": "Invalid status transition.",
  "code": "INVALID_STATE_TRANSITION"
}
```

#### Anti-pattern: Returning 200 for failed operation

Bad:

```json
{
  "success": false,
  "message": "Payment failed."
}
```

with HTTP `200`.

Correct approach:

```txt
400/403/409/500 depending on failure
```

---

### 4.5 Auth & Permission Anti-Patterns

#### Anti-pattern: Login equals security

Bad assumption:

```txt
user can login
therefore app is secure
```

Correct understanding:

```txt
authentication proves identity
authorization controls action
tenant scope controls data ownership
business validation controls workflow
```

#### Anti-pattern: Role checks scattered everywhere

Bad:

```ts
if (user.role === "OWNER" || user.role === "MANAGER") {}
```

copied across dozens of files.

Correct approach:

```ts
requirePermission(user, "restaurant.payments.create");
```

#### Anti-pattern: OWNER as SUPER_ADMIN

Bad:

```txt
restaurant owner can manage platform tenants
```

Correct separation:

```txt
OWNER:
manages one business

SUPER_ADMIN:
manages SaaS platform
```

#### Anti-pattern: Frontend-provided role

Bad:

```ts
const { role } = await req.json();
```

Correct approach:

```txt
role comes from backend session/database
```

#### Anti-pattern: Missing tenant scope

Bad:

```ts
await prisma.order.findUnique({
  where: { id: orderId },
});
```

Correct:

```ts
await prisma.order.findFirst({
  where: {
    id: orderId,
    restaurantId: user.restaurantId,
  },
});
```

One missing tenant filter can turn SaaS into a data leak buffet. Very generous. Very illegal-adjacent.

---

### 4.6 Database Anti-Patterns

#### Anti-pattern: No tenant ID on business data

Bad:

```txt
orders table without restaurantId/businessId
```

Correct:

```txt
every tenant-owned business record must include business scope
```

Examples:

```txt
orders
payments
menu items
inventory
stock movements
audit logs
settings
employees
reports
```

#### Anti-pattern: Money as Float

Bad:

```prisma
price Float
totalAmount Float
```

Correct:

```txt
Decimal
or integer minor unit
```

Money and floating point are a cursed pairing. Accountants did nothing to deserve this.

#### Anti-pattern: No indexes for common queries

Bad:

```txt
orders filtered by restaurantId/status/createdAt
but no related index
```

Correct:

```prisma
@@index([restaurantId, status, createdAt])
```

#### Anti-pattern: Deleting historical business data casually

Bad:

```txt
delete menu item used in old orders
delete user who created payments
delete payment history
```

Correct:

```txt
soft delete
archive
deactivate
keep snapshots
preserve audit/report history
```

#### Anti-pattern: Stock quantity changes without movement

Bad:

```ts
await prisma.inventoryItem.update({
  data: {
    quantity: newQuantity,
  },
});
```

Correct:

```txt
create stock movement
update stock quantity in transaction
create audit log
```

---

### 4.7 Order/Payment Anti-Patterns

#### Anti-pattern: Status teleportation

Bad:

```txt
WAITING_PAYMENT → READY
PAID → COMPLETED
COMPLETED → PREPARING
```

Correct:

```txt
validate transition map
validate permission
validate side effects
audit transition
```

#### Anti-pattern: Payment as plain status update

Bad:

```ts
await prisma.order.update({
  data: {
    status: "PAID",
  },
});
```

Correct:

```txt
create payment
validate amount
prevent duplicate
update paymentStatus
update order status
use transaction
audit action
```

#### Anti-pattern: Duplicate payment allowed

Bad:

```txt
click payment button twice
two payments created
```

Correct:

```txt
unique constraint
idempotency key if needed
transaction
duplicate payment error
disabled submit button
```

#### Anti-pattern: Cancel paid order without refund logic

Bad:

```txt
PAID → CANCELLED
no refund
no audit
no stock/table policy
```

Correct:

```txt
cancellation policy based on current status
refund flow if needed
audit log
stock/table side effects
```

#### Anti-pattern: Frontend calculates final price

Bad:

```txt
frontend sends price and total
backend accepts
```

Correct:

```txt
backend calculates from database price snapshot
```

---

### 4.8 Inventory Anti-Patterns

#### Anti-pattern: Inventory as simple number

Bad:

```txt
inventory = quantity field only
```

Correct:

```txt
inventory item
stock movement
movement type
actor
reason
timestamp
audit trail
```

#### Anti-pattern: No stock movement for order deduction

Bad:

```txt
order created
stock decreases
no record why
```

Correct:

```txt
stock movement type SALE
linked orderId
actor/system
quantity used
```

#### Anti-pattern: No negative stock policy

Bad:

```txt
stock can become -999
everyone pretends it is fine
```

Correct:

```txt
negative stock allowed or blocked explicitly
business rule documented
tests exist
```

---

### 4.9 Caching Anti-Patterns

#### Anti-pattern: Cache everything

Bad:

```txt
cache auth
cache payment
cache inventory
cache active order status
cache private dashboard publicly
```

Correct:

```txt
cache only safe read-heavy data
short TTL for dynamic data
no-store for sensitive/critical endpoints
tenant-scoped cache keys
invalidation after mutation
```

#### Anti-pattern: Cache without tenant scope

Bad:

```txt
cache:menu
```

Correct:

```txt
cache:restaurant:{restaurantId}:menu
```

#### Anti-pattern: Cache as source of truth

Bad:

```txt
payment is PAID because cache says so
```

Correct:

```txt
database is source of truth
cache is temporary copy
```

---

### 4.10 Logging & Error Anti-Patterns

#### Anti-pattern: Console chaos

Bad:

```ts
console.log("here");
console.log("error bro");
console.log(user);
```

Correct:

```txt
structured logger
log levels
requestId
safe context
no secrets
```

#### Anti-pattern: Logging secrets

Never log:

```txt
password
passwordHash
session token
JWT
reset token
API key
DATABASE_URL
payment secret
storage secret
```

#### Anti-pattern: Returning raw stack trace

Bad:

```txt
PrismaClientKnownRequestError at /var/task/src/...
```

Correct:

```json
{
  "success": false,
  "message": "Internal server error.",
  "code": "INTERNAL_SERVER_ERROR"
}
```

#### Anti-pattern: Swallowing errors

Bad:

```ts
try {
  await doImportantThing();
} catch {}
```

Correct:

```txt
handle expected errors
log unexpected errors
return safe response
send to error tracking if needed
```

Silent failure is not stability. It is lying quietly.

---

### 4.11 Security Anti-Patterns

#### Anti-pattern: Secrets in GitHub

Bad:

```txt
.env committed
DATABASE_URL committed
JWT_SECRET committed
payment key committed
```

Correct:

```txt
.env in .gitignore
secrets in hosting provider env
rotate leaked secrets
```

#### Anti-pattern: Token in localStorage by default

Bad:

```txt
store session token in localStorage
```

Correct:

```txt
HttpOnly cookie for dashboard auth when possible
```

#### Anti-pattern: File upload without validation

Bad:

```txt
accept any file
store any file
serve publicly
```

Correct:

```txt
file type validation
file size limit
private/public distinction
object storage
signed URL for private files
```

#### Anti-pattern: Raw SQL unsafe with user input

Bad:

```ts
prisma.$queryRawUnsafe(`SELECT * FROM users WHERE email = '${email}'`);
```

Correct:

```ts
prisma.$queryRaw`SELECT * FROM users WHERE email = ${email}`;
```

or use Prisma query builder.

---

### 4.12 Testing Anti-Patterns

#### Anti-pattern: Manual testing only

Bad:

```txt
clicked once
worked once
ship it
```

Correct:

```txt
typecheck
build
unit tests for business logic
integration tests for critical flows
manual QA checklist
E2E for main workflow
```

#### Anti-pattern: Testing only happy path

Bad:

```txt
test only successful payment
```

Correct test also:

```txt
duplicate payment
wrong role
wrong tenant
invalid amount
invalid order status
```

#### Anti-pattern: Production database for tests

Bad:

```txt
test script touches production
```

Correct:

```txt
local/staging test database
seed data
safe reset strategy
```

#### Anti-pattern: Skipping failing tests forever

Bad:

```ts
it.skip("blocks duplicate payment", () => {});
```

Correct:

```txt
fix the bug
or document why test is temporarily skipped
remove skip quickly
```

---

### 4.13 Deployment Anti-Patterns

#### Anti-pattern: Deploy with red build

Bad:

```txt
TypeScript error
build failed
deploy anyway
```

Correct:

```txt
typecheck
lint
test
build
then deploy
```

#### Anti-pattern: No rollback plan

Bad:

```txt
deploy breaks auth
no idea how to revert
```

Correct:

```txt
Git commit history
hosting deployment rollback
database migration caution
release notes
```

#### Anti-pattern: Environment variables undocumented

Bad:

```txt
app works only on one laptop
because no one knows env keys
```

Correct:

```txt
.env.example
docs for env
hosting env configured
secrets not committed
```

---

### 4.14 Monitoring Anti-Patterns

#### Anti-pattern: User as monitoring system

Bad:

```txt
wait until user reports bug
```

Correct:

```txt
health check
uptime monitor
error tracking
logs
database alerts
payment/order monitoring
```

#### Anti-pattern: Alert for everything

Bad:

```txt
every 404 sends panic alert
```

Correct:

```txt
actionable alerts
thresholds
severity
rate-based alerts
critical workflow focus
```

#### Anti-pattern: No backup restore test

Bad:

```txt
backup exists
never tested
```

Correct:

```txt
restore tested in staging
runbook documented
backup retention defined
```

A backup that has never been restored is a bedtime story for developers.

---

### 4.15 SaaS/Product Anti-Patterns

#### Anti-pattern: Mixing SaaS billing and restaurant payment

Bad:

```txt
same Payment model for:
- customer buying food
- restaurant paying SaaS subscription
```

Correct:

```txt
Restaurant Payment:
order/customer transaction

SaaS Billing:
subscription/invoice/platform revenue
```

#### Anti-pattern: Fake enterprise features

Bad:

```txt
empty dashboard card says "Enterprise Analytics"
no real data
no logic
no security
```

Correct:

```txt
small but real feature
accurate documentation
clear scope
no fake claims
```

#### Anti-pattern: No support flow

Bad:

```txt
paid user has issue
developer searches database manually
```

Correct:

```txt
support process
admin lookup
logs
requestId
audit-safe tools
```

#### Anti-pattern: Overbuilding legal/compliance too early

Bad:

```txt
spend weeks on enterprise legal/compliance
before POS core works
```

Correct:

```txt
document future legal needs
prepare basic privacy/terms before public launch
review properly before paid commercial use
```

---

## 5. Implementation Guide

### 5.1 How to Use This Document

Before implementing a feature, check:

```txt
Does this violate any anti-pattern?
Is this shortcut safe?
Is this temporary solution documented?
Will this break tenant isolation?
Will this bypass backend validation?
Will this make future refactor worse?
```

Before accepting AI/Codex output, check:

```txt
Did it hardcode role checks?
Did it skip permission?
Did it trust frontend?
Did it ignore restaurantId/businessId scope?
Did it update status directly?
Did it mutate stock without movement?
Did it return inconsistent API response?
Did it add any secrets?
Did it use any/ts-ignore to silence errors?
```

Because AI is very good at producing confident nonsense with indentation.

### 5.2 Temporary Solution Rules

Temporary solution is allowed only when:

```txt
it is safe
it does not violate security
it does not corrupt data
it is documented
it has TODO with reason
it does not become foundation
```

Temporary solution is not allowed for:

```txt
auth
permission
tenant isolation
payment
stock mutation
order status transition
security
data migration
production secrets
```

Bad TODO:

```ts
// TODO fix later
```

Better TODO:

```ts
// TODO(pos-v3): Replace polling with SSE when kitchen queue traffic becomes too high.
// Current polling interval is 5s and acceptable for MVP.
```

### 5.3 Review Checklist for New Code

For every new backend feature:

```txt
- auth checked?
- permission checked?
- tenant scope checked?
- input validated?
- business rule validated?
- transaction needed?
- audit log needed?
- error code consistent?
- response format consistent?
- logs safe?
- tests needed?
```

For every new frontend feature:

```txt
- loading state?
- error state?
- empty state?
- permission-based UI?
- backend still enforces permission?
- pagination needed?
- data fetching duplicated?
- responsive enough?
```

For every database change:

```txt
- tenant scope needed?
- index needed?
- relation correct?
- cascade behavior safe?
- migration safe?
- historical data preserved?
```

---

## 6. Anti-Patterns Summary

Avoid these most dangerous patterns:

```txt
1. Trusting frontend for business truth
2. Skipping tenant scope
3. Skipping backend permission checks
4. Direct status update without state machine
5. Payment as plain order status update
6. Stock mutation without stock movement
7. Inconsistent API response
8. Logging secrets
9. Returning raw stack trace
10. Fetching unlimited data
11. Missing indexes
12. No tests for critical flows
13. Deploying broken build
14. Fake enterprise placeholders
15. Premature microservices
```

These are the “big fifteen.”

Very majestic. Very capable of ruining your weekend.

---

## 7. Checklist

Anti-pattern protection is acceptable when:

- [ ] Business logic is not placed in UI components.
- [ ] Backend validates auth.
- [ ] Backend validates permission.
- [ ] Backend validates tenant scope.
- [ ] Backend validates business rules.
- [ ] Order status uses transition map.
- [ ] Payment uses payment service, not direct status update.
- [ ] Duplicate payment is blocked.
- [ ] Stock changes create stock movements.
- [ ] API response format is consistent.
- [ ] Error codes are consistent.
- [ ] Logs do not include secrets.
- [ ] Production errors do not expose stack traces.
- [ ] Large lists use pagination.
- [ ] Common database queries have indexes.
- [ ] Uploaded files use object storage.
- [ ] Static/public assets use CDN when appropriate.
- [ ] Tests cover critical business flows.
- [ ] CI blocks broken build.
- [ ] Environment variables are documented.
- [ ] Backup/restore is planned before production.
- [ ] Microservices are delayed until justified.
- [ ] Future modes are not built before Restaurant mode is stable.
- [ ] Temporary solutions are documented and safe.

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
- 08-cicd-version-control.md
- 09-security.md
- 10-rate-limiting.md
- 11-caching-cdn.md
- 12-error-tracking-logs.md
- 13-monitoring-alerts.md
- 14-testing.md
- 15-scaling.md
- 16-and-more.md
- appendices/permission-keys.md
- appendices/status-transitions.md
- appendices/error-codes.md
- appendices/api-response-format.md
- appendices/implementation-rules.md