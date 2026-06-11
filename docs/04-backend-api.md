# Backend API

## 1. Purpose

This document defines the backend API architecture, request handling pattern, validation rules, service layer responsibilities, transaction strategy, response format, error handling, and backend boundaries for POS System V3.

The goal is to make backend implementation consistent, secure, maintainable, and safe for business-critical workflows such as order, payment, kitchen, serving, inventory, invoice, role, permission, and settings.

This document does not define detailed database schema, frontend UI behavior, deployment setup, or monitoring strategy. Those areas are handled in separate documents.

---

## 2. Current Context

POS System V3 currently uses a web-based full-stack architecture.

The active mode is:

```txt
Restaurant / F&B
```

Current backend responsibilities include:

```txt
auth
current user
orders
payments
kitchen status
serving status
menu
inventory
stock movement
analytics
settings
audit logs
```

The current recommended backend direction is:

```txt
REST-style API first
thin route handlers
service layer for business logic
repository layer for database access
Zod or equivalent for validation
Prisma for database operations
PostgreSQL as persisted source of truth
```

The backend must support V3 multi-mode direction without implementing all planned modes at once.

Planned modes:

```txt
Restaurant / F&B
Retail / Supermarket
Raw Material / Livestock / Kandang
Service / Custom Business
```

Backend must remain Restaurant-stable first.

---

## 3. Decisions

The following backend decisions are locked:

1. Backend is the business decision maker.
2. Database is the final persisted source of truth.
3. Frontend is not trusted for critical values.
4. REST-style API is the default API style for MVP.
5. Route handlers must stay thin.
6. Service layer owns business logic.
7. Repository layer owns database access.
8. Validation schema must be used for request body, params, and query when needed.
9. Backend must enforce authentication.
10. Backend must enforce business scope.
11. Backend must enforce permission.
12. Backend must enforce mode access when relevant.
13. Backend must validate workflow transitions.
14. Backend must calculate price, tax, discount, service charge, and total.
15. Backend must validate payment state.
16. Backend must validate stock changes.
17. Backend must create audit logs for important mutations.
18. Money, stock, payment, invoice, status, role, permission, and settings mutations should use database transactions when multiple writes are involved.
19. Backend response format must be consistent.
20. Error codes must be consistent.
21. Business-owned data must always be queried with restaurantId, businessId, or tenantId scope.
22. Frontend must never directly access the database.
23. GraphQL, tRPC, WebSocket, and event-driven workers are not MVP defaults.
24. Payment gateway webhook handling is future scope unless explicitly implemented.
25. API routes must not become giant files full of business logic.

---

## 4. Rules

### 4.1 Request Handling Rules

Every protected API request must follow this order:

```txt
Receive request
↓
Get current user
↓
Check authentication
↓
Check active user
↓
Check business scope
↓
Check mode access if needed
↓
Check permission
↓
Validate params/query/body
↓
Load required resource with business scope
↓
Validate business rule
↓
Execute service logic
↓
Create audit log if needed
↓
Return consistent response
```

Do not mutate business data before auth, scope, permission, and validation are complete.

### 4.2 Route Handler Rules

Route handlers should only:

```txt
read request
parse params/query/body
call auth helper if needed
call service
return response
```

Route handlers must not contain:

```txt
large business logic
complex transaction logic
manual permission duplication
long Prisma workflows
status transition maps
stock deduction rules
payment consistency logic
```

Bad:

```txt
route.ts contains 300 lines of auth, validation, stock, payment, audit, and response logic
```

Good:

```txt
route.ts validates input and calls orderService.createOrder()
```

### 4.3 Service Layer Rules

Service layer owns:

```txt
business rules
workflow validation
status transition validation
permission-sensitive decisions
transaction coordination
stock/payment/order consistency
audit log creation
side effects
```

Examples:

```txt
order.service.ts
payment.service.ts
inventory.service.ts
invoice.service.ts
auth.service.ts
settings.service.ts
```

### 4.4 Repository Layer Rules

Repository layer owns database access.

Repository may:

```txt
find resource by business scope
create record
update record
delete record if allowed
select required fields
include relations carefully
apply pagination
apply filtering
```

Repository must not:

```txt
decide permission
decide business policy
decide workflow transition
calculate final payment state
perform unrelated side effects
```

### 4.5 Validation Rules

Backend must validate:

```txt
request body
route params
query params
enum values
number range
string length
array length
required fields
optional fields
```

Recommended validation tool:

```txt
Zod
```

Frontend validation is not enough.

Backend validation is mandatory.

### 4.6 Business Rule Rules

Input may be valid but business action may still be invalid.

Example:

```txt
status = READY
```

This may be valid enum value.

But this transition is invalid:

```txt
WAITING_PAYMENT → READY
```

Backend must validate:

```txt
current resource state
next requested state
allowed transition
user permission
business scope
side effects
```

### 4.7 Tenant / Business Scope Rules

Every business-owned resource must be scoped.

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

If future schema uses `businessId`:

```ts
await prisma.order.findFirst({
  where: {
    id,
    businessId: user.businessId,
  },
});
```

Never trust `restaurantId`, `businessId`, or `tenantId` from request body as final scope.

Scope must come from current authenticated user/session.

### 4.8 Permission Rules

Every protected mutation must check permission in backend.

Examples:

```txt
restaurant.orders.create
restaurant.orders.approve
restaurant.payments.create
restaurant.kitchen.update
restaurant.serving.update
shared.invoice.create
shared.reports.view
core.settings.update
```

Frontend may hide buttons, but backend must still reject unauthorized requests.

### 4.9 Transaction Rules

Use database transaction when one business action writes multiple related records.

Transaction required or strongly recommended for:

```txt
create order + order items + stock movement
create payment + update order status
refund payment + update payment/order/invoice/cashflow
stock adjustment + stock movement + audit log
processing batch + input stock + output stock + waste
create invoice + invoice items
update role/permission + audit log
settings update + audit log
```

Do not partially complete money, stock, payment, invoice, or workflow mutations.

### 4.10 Audit Rules

Audit logs are required for important mutations.

Audit required for:

```txt
order status update
payment created
payment refunded
stock adjusted
stock deducted
inventory correction
invoice created
invoice voided
role changed
permission changed
settings updated
batch created
batch rejected
weighing record created
service job assigned
service job completed
```

Audit optional for:

```txt
view dashboard
filter table
search product
open page
```

Audit actor must come from backend current user.

Frontend must not provide final audit actor.

---

## 5. Implementation Guide

### 5.1 Recommended Backend Folder Structure

Recommended structure:

```txt
src/
├─ app/
│  └─ api/
│     ├─ auth/
│     ├─ restaurant/
│     │  ├─ orders/
│     │  ├─ kitchen/
│     │  ├─ serving/
│     │  └─ payments/
│     ├─ shared/
│     │  ├─ invoice/
│     │  ├─ cashflow/
│     │  └─ reports/
│     └─ core/
│        ├─ settings/
│        └─ health/
│
├─ core/
│  ├─ auth/
│  ├─ permissions/
│  ├─ business-scope/
│  ├─ audit/
│  ├─ errors/
│  ├─ response/
│  └─ validation/
│
├─ features/
│  ├─ restaurant/
│  │  ├─ orders/
│  │  │  ├─ order.service.ts
│  │  │  ├─ order.repository.ts
│  │  │  ├─ order.schema.ts
│  │  │  ├─ order.permissions.ts
│  │  │  ├─ order-status.ts
│  │  │  └─ order.types.ts
│  │  ├─ kitchen/
│  │  ├─ serving/
│  │  └─ payments/
│  │
│  └─ shared/
│     ├─ invoice/
│     ├─ cashflow/
│     └─ reports/
│
└─ lib/
   ├─ db/
   ├─ env/
   ├─ logger/
   └─ utils/
```

This is a target structure.

Do not break working Restaurant flow just to move files around.

---

### 5.2 API Naming Strategy

Use clear resource-based routes.

Good:

```txt
GET    /api/restaurant/orders
POST   /api/restaurant/orders
GET    /api/restaurant/orders/:id
PATCH  /api/restaurant/orders/:id/status
POST   /api/restaurant/orders/:id/cancel

GET    /api/restaurant/kitchen/orders
PATCH  /api/restaurant/kitchen/orders/:id/status

GET    /api/restaurant/serving/orders
PATCH  /api/restaurant/serving/orders/:id/status

POST   /api/restaurant/payments
GET    /api/shared/invoices
POST   /api/shared/invoices
```

Bad:

```txt
POST /api/doOrderThing
GET  /api/getStuff
POST /api/updateData
POST /api/fixStatus
```

API names must describe resources and actions clearly.

---

### 5.3 Standard Response Format

Success response:

```json
{
  "success": true,
  "message": "Order created",
  "data": {}
}
```

Error response:

```json
{
  "success": false,
  "message": "Invalid order status transition",
  "code": "INVALID_STATE_TRANSITION"
}
```

Paginated response:

```json
{
  "success": true,
  "message": "Orders retrieved",
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

Rules:

1. Always return `success`.
2. Use `message` for human-readable summary.
3. Use `code` for machine-readable error.
4. Use `data` for payload.
5. Use `meta` for pagination or extra metadata.

---

### 5.4 Standard Error Codes

Common error codes:

```txt
UNAUTHORIZED
FORBIDDEN
TENANT_ACCESS_DENIED
MODE_ACCESS_DENIED
VALIDATION_ERROR
NOT_FOUND
CONFLICT
INVALID_STATE_TRANSITION
INSUFFICIENT_STOCK
PAYMENT_REQUIRED
PAYMENT_ALREADY_EXISTS
DUPLICATE_PAYMENT
RESOURCE_LOCKED
RATE_LIMITED
INTERNAL_SERVER_ERROR
```

HTTP status mapping:

```txt
400 Bad Request:
VALIDATION_ERROR
INVALID_STATE_TRANSITION

401 Unauthorized:
UNAUTHORIZED

403 Forbidden:
FORBIDDEN
TENANT_ACCESS_DENIED
MODE_ACCESS_DENIED

404 Not Found:
NOT_FOUND

409 Conflict:
CONFLICT
PAYMENT_ALREADY_EXISTS
DUPLICATE_PAYMENT
RESOURCE_LOCKED

429 Too Many Requests:
RATE_LIMITED

500 Internal Server Error:
INTERNAL_SERVER_ERROR
```

---

### 5.5 Backend Helper Functions

Recommended core helpers:

```txt
getCurrentUser()
requireAuth()
requirePermission()
requireModeAccess()
requireBusinessScope()
validateTransition()
successResponse()
errorResponse()
createAuditLog()
```

Example concept:

```ts
const user = await requireAuth();

requirePermission(user, "restaurant.orders.create");

const input = createOrderSchema.parse(await req.json());

const result = await orderService.createOrder({
  user,
  input,
});

return successResponse("Order created", result);
```

---

### 5.6 Create Order Flow

Create order API flow:

```txt
POST /api/restaurant/orders
↓
requireAuth()
↓
requirePermission("restaurant.orders.create")
↓
validate body
↓
load menu items with business scope
↓
calculate price from database
↓
validate stock if recipe/inventory is enabled
↓
database transaction:
  - create order
  - create order items with snapshots
  - create stock movements if needed
  - update table if needed
  - create audit log
↓
return created order
```

Frontend may send:

```txt
menuItemId
quantity
notes
tableId
customerName
```

Backend must decide:

```txt
price snapshot
subtotal
tax
service charge
discount
total
initial status
business scope
stock effect
audit actor
```

---

### 5.7 Payment Flow

Payment API flow:

```txt
POST /api/restaurant/payments
↓
requireAuth()
↓
requirePermission("restaurant.payments.create")
↓
validate body
↓
load order with business scope
↓
validate order payable state
↓
validate amount and payment method
↓
database transaction:
  - create payment
  - update order paymentStatus
  - update order status to PAID if valid
  - create cashflow entry if enabled
  - create audit log
↓
return payment result
```

Payment must prevent duplicate payment.

Possible strategies:

```txt
unique constraint on orderId for single-payment order
idempotency key
status validation
transaction
```

Payment must not rely on frontend success state.

---

### 5.8 Kitchen Status Flow

Kitchen API flow:

```txt
PATCH /api/restaurant/kitchen/orders/:id/status
↓
requireAuth()
↓
requirePermission("restaurant.kitchen.update")
↓
validate next status
↓
load order with business scope
↓
validate current status
↓
validate allowed transition
↓
update status
↓
create audit log
↓
return updated order
```

Allowed kitchen transitions:

```txt
PAID → PREPARING
PREPARING → READY
```

Kitchen must not process payment.

Kitchen must not see unpaid orders.

---

### 5.9 Serving Status Flow

Serving API flow:

```txt
PATCH /api/restaurant/serving/orders/:id/status
↓
requireAuth()
↓
requirePermission("restaurant.serving.update")
↓
validate next status
↓
load order with business scope
↓
validate current status
↓
validate allowed transition
↓
update status
↓
create audit log
↓
return updated order
```

Allowed serving transitions:

```txt
READY → SERVED
SERVED → COMPLETED
```

Server must not process payment.

Server must not update kitchen status.

---

### 5.10 Inventory Mutation Flow

Inventory mutation flow:

```txt
POST /api/inventory/movements
↓
requireAuth()
↓
requirePermission("inventory.movement.create")
↓
validate input
↓
load inventory item with business scope
↓
validate quantity
↓
database transaction:
  - create stock movement
  - update inventory quantity
  - create audit log
↓
return movement result
```

Stock quantity must not change without stock movement.

---

### 5.11 Status Transition Validation

Status transition must be centralized.

Example:

```ts
const restaurantOrderTransitions = {
  WAITING_CASHIER_APPROVAL: ["WAITING_PAYMENT", "REJECTED"],
  WAITING_PAYMENT: ["PAID", "CANCELLED"],
  PAID: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY"],
  READY: ["SERVED"],
  SERVED: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
  REJECTED: [],
  REFUNDED: [],
} as const;
```

Validation:

```ts
function validateTransition(
  currentStatus: string,
  nextStatus: string,
  allowedTransitions: Record<string, readonly string[]>,
) {
  const allowedNext = allowedTransitions[currentStatus] ?? [];

  if (!allowedNext.includes(nextStatus)) {
    throw new AppError({
      code: "INVALID_STATE_TRANSITION",
      message: "Invalid state transition",
      statusCode: 400,
    });
  }
}
```

Do not duplicate status transition logic across route handlers.

---

### 5.12 Pagination and Filtering

List endpoints must support pagination when data can grow.

Examples:

```txt
GET /api/restaurant/orders?page=1&limit=20&status=PAID
GET /api/restaurant/payments?page=1&limit=20
GET /api/inventory/movements?page=1&limit=20
GET /api/audit-logs?page=1&limit=20
```

Rules:

1. Do not return unlimited large lists.
2. Apply business scope.
3. Apply filters safely.
4. Apply stable sorting.
5. Return pagination metadata.

Default:

```txt
page = 1
limit = 20
max limit = 100
```

---

### 5.13 Idempotency

Idempotency prevents duplicate effects from repeated requests.

Important for:

```txt
payment
order creation from customer app
webhook handling
invoice payment
stock processing
```

MVP may start with database constraints and status validation.

Future implementation may add:

```txt
Idempotency-Key header
idempotency table
request fingerprint
provider event ID tracking
```

Payment endpoints must not create duplicate payment records for the same order.

---

### 5.14 Webhook Handling

Webhook is future scope unless payment gateway is implemented.

Webhook rules:

```txt
verify signature
validate provider event
ensure idempotency
load related payment/order/subscription
update status in transaction
log event
return proper response
```

Never trust webhook payload without verification.

Never update payment/subscription status from frontend success page alone.

---

### 5.15 Health Check API

The system should provide a health check endpoint.

Example:

```txt
GET /api/health
```

Basic response:

```json
{
  "status": "ok",
  "timestamp": "2026-06-11T00:00:00.000Z"
}
```

Optional database check:

```txt
SELECT 1
```

Health check must stay lightweight.

Do not run expensive analytics inside health check. That would be impressively self-defeating.

---

## 6. Anti-Patterns

Do not:

- Put all backend logic inside route handlers
- Put backend business logic inside frontend components
- Trust frontend total amount
- Trust frontend payment status
- Trust frontend role or permission
- Trust frontend businessId, restaurantId, or tenantId
- Query business-owned data without business scope
- Use `findUnique` by ID only for tenant-owned resource
- Update order status without transition validation
- Create payment without duplicate protection
- Change stock quantity without stock movement
- Skip audit log for important mutations
- Return inconsistent response formats
- Throw raw errors directly to user
- Expose stack trace in production response
- Use `any` everywhere to silence TypeScript
- Catch errors and ignore them silently
- Add WebSocket before normal API flow is stable
- Add queue before there is real background job need
- Add GraphQL just because it sounds advanced
- Create route names like `/api/doStuff`
- Create temporary fixes without documenting risk

---

## 7. Checklist

Backend API is acceptable when:

- [ ] Route handlers are thin.
- [ ] Service layer owns business logic.
- [ ] Repository layer owns database access.
- [ ] Protected APIs require authentication.
- [ ] Protected APIs enforce permission.
- [ ] Business-owned data is scoped.
- [ ] Request body, params, and query are validated.
- [ ] Workflow transitions are validated.
- [ ] Backend calculates critical values.
- [ ] Payment mutation is duplicate-safe.
- [ ] Stock mutation creates stock movement.
- [ ] Important mutations create audit logs.
- [ ] Multi-write critical actions use transactions.
- [ ] List endpoints support pagination.
- [ ] Response format is consistent.
- [ ] Error codes are consistent.
- [ ] Stable Restaurant workflow remains working.
- [ ] Planned modes are not falsely implemented.
- [ ] No unnecessary infrastructure is introduced.

---

## 8. References

Related documents:

- 00-ai-context.md
- 01-system-design.md
- 02-system-architecture.md
- 03-frontend.md
- 05-database-storage.md
- 06-auth-permissions.md
- 09-security.md
- 10-rate-limiting.md
- 12-error-tracking-logs.md
- 14-testing.md
- appendices/api-response-format.md
- appendices/error-codes.md
- appendices/status-transitions.md
- appendices/permission-keys.md
- appendices/implementation-rules.md