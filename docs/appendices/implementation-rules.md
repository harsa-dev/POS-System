# Implementation Rules

## 1. Purpose

This appendix defines strict implementation rules for POS System V3.

These rules are intended for:

```txt
human developer
AI assistant
Codex
future contributor
future maintainer
```

The goal is to make implementation safe, consistent, maintainable, and aligned with the documented system design.

This document exists because AI and humans share one tragic habit:

```txt
making confident changes without understanding the system first
```

This file prevents that. Or at least makes the crime scene easier to investigate.

---

## 2. Current Context

POS System V3 is a SaaS-style POS and business operating system.

Current active mode:

```txt
Restaurant / F&B
```

Core architecture direction:

```txt
modular monolith
Next.js
TypeScript
Prisma
PostgreSQL
role + permission based access
tenant/business scoped data
documented status transitions
standard API response
standard error codes
audit logs for critical actions
```

Primary workflow:

```txt
WAITING_CASHIER_APPROVAL
→ WAITING_PAYMENT
→ PAID
→ PREPARING
→ READY
→ SERVED
→ COMPLETED
```

Critical systems:

```txt
auth
permissions
tenant isolation
orders
payments
kitchen
serving
inventory
stock movement
settings
analytics
audit logs
error tracking
testing
deployment
```

The project must not be implemented as random features glued together.

It must follow the docs.

Yes, reading docs before coding. Barbaric, I know.

---

## 3. Decisions

The following implementation decisions are locked:

1. Read relevant docs before changing code.
2. Do not implement features without understanding current architecture.
3. Do not remove existing working behavior unless explicitly required.
4. Do not replace real fixes with temporary patches.
5. Do not silence TypeScript errors using `any` unless strongly justified.
6. Do not use `// @ts-ignore` as normal solution.
7. Do not bypass backend permission checks.
8. Do not bypass tenant/business scope checks.
9. Do not trust frontend for business-critical data.
10. Do not update order status directly without transition validation.
11. Do not process payment without duplicate prevention.
12. Do not mutate stock without stock movement.
13. Do not change schema without considering migration impact.
14. Do not create inconsistent API response shapes.
15. Do not introduce new error codes without documenting them.
16. Do not introduce new permission keys without documenting them.
17. Do not add new status without updating transition map and tests.
18. Do not add hardcoded business mode logic everywhere.
19. Do not build future modes before Restaurant mode is stable.
20. Do not introduce microservices for MVP.
21. Do not add dependency without reason.
22. Do not duplicate existing utilities.
23. Do not hide bugs by catching errors silently.
24. Do not leave broken build/typecheck.
25. Every critical change must be testable or manually verifiable.

---

## 4. Rules

### 4.1 Read Before Implementing Rules

Before changing code, check relevant documents.

For frontend:

```txt
03-frontend.md
06-auth-permissions.md
appendices/permission-keys.md
appendices/api-response-format.md
appendices/anti-patterns.md
```

For backend/API:

```txt
04-backend-api.md
05-database-storage.md
06-auth-permissions.md
09-security.md
appendices/error-codes.md
appendices/api-response-format.md
appendices/status-transitions.md
appendices/implementation-rules.md
```

For database:

```txt
05-database-storage.md
15-scaling.md
appendices/status-transitions.md
appendices/anti-patterns.md
```

For deployment:

```txt
07-hosting-cloud.md
08-cicd-version-control.md
12-error-tracking-logs.md
13-monitoring-alerts.md
```

For testing:

```txt
14-testing.md
appendices/status-transitions.md
appendices/permission-keys.md
appendices/error-codes.md
```

Rules:

1. Never implement blindly.
2. Identify which module is affected.
3. Identify which business rule is affected.
4. Identify which permissions are needed.
5. Identify which status transitions are affected.
6. Identify which tests/checks must run.

---

### 4.2 Change Scope Rules

Every implementation must define scope.

Before coding, answer:

```txt
What feature/bug is being changed?
Which files are affected?
Which modules are affected?
Which behavior must remain unchanged?
Which docs are relevant?
Which tests/checks prove the change is safe?
```

Rules:

1. Keep changes focused.
2. Do not refactor unrelated areas.
3. Do not rename files without need.
4. Do not change architecture while fixing small bug.
5. Do not bundle multiple unrelated fixes into one change.
6. If a refactor is needed, explain why.

Bad:

```txt
fix payment bug
also rewrite sidebar
also rename order folders
also change schema
also add new dashboard
```

Correct:

```txt
fix duplicate payment prevention in payment service
```

Software does not become cleaner because you touched more files. Sometimes it just becomes more haunted.

---

### 4.3 No Temporary Patch Rules

Temporary patches are dangerous.

Not allowed for:

```txt
auth
permissions
tenant isolation
order status
payment
inventory stock
audit logs
security
database migration
production deployment
```

Allowed only if:

```txt
safe
documented
limited scope
does not corrupt data
does not weaken security
has TODO with reason
has follow-up plan
```

Bad:

```ts
// TODO fix later
return true;
```

Good:

```ts
// TODO(pos-v3): Replace polling with SSE when kitchen traffic exceeds MVP limit.
// Current 5s polling is acceptable for MVP and documented in 15-scaling.md.
```

Rules:

1. Never use temporary patch to bypass business rule.
2. Never use temporary patch to bypass permission.
3. Never use temporary patch to bypass tenant scope.
4. Never use temporary patch to skip payment validation.
5. Never use temporary patch to skip stock movement.
6. Temporary solution must be explicitly marked.

---

### 4.4 TypeScript Rules

TypeScript must be respected.

Rules:

1. Do not use `any` casually.
2. Do not use `as unknown as` to force broken types.
3. Do not use `// @ts-ignore` unless absolutely necessary.
4. Fix root type problem.
5. Keep domain types explicit.
6. Use generated Prisma types where helpful.
7. Validate external input with schemas.
8. Do not trust frontend type safety for backend runtime safety.

Bad:

```ts
const order: any = await getOrder();
```

Better:

```ts
type OrderWithItems = Prisma.OrderGetPayload<{
  include: {
    items: true;
  };
}>;
```

Bad:

```ts
const status = body.status as OrderStatus;
```

Better:

```ts
const input = updateOrderStatusSchema.parse(body);
```

TypeScript is annoying because it tells you the truth earlier than runtime. Rude, but useful.

---

### 4.5 Validation Rules

Every external input must be validated.

External input includes:

```txt
request body
query params
route params
headers
cookies
webhook payload
file upload metadata
frontend form data
```

Use validation schema.

Recommended:

```txt
Zod
```

Rules:

1. Validate request body before service logic.
2. Validate query params.
3. Validate route params.
4. Validate enum values.
5. Validate numeric ranges.
6. Validate file size and type.
7. Validate webhook payload.
8. Never trust TypeScript alone for runtime input.

Example:

```ts
const body = await req.json();
const input = createOrderSchema.parse(body);
```

Do not:

```ts
const input = await req.json();
await orderService.create(input);
```

That is not backend. That is an open window with JSON.

---

### 4.6 Auth Rules

Every protected endpoint must authenticate user.

Rules:

1. Use centralized `requireAuth()` or equivalent.
2. Do not trust user ID from request body.
3. Do not trust role from request body.
4. Do not trust restaurantId/businessId from request body.
5. Session must be validated server-side.
6. Inactive user must be rejected.
7. Missing/invalid session returns `401 UNAUTHORIZED`.

Bad:

```ts
const { userId, role } = await req.json();
```

Good:

```ts
const user = await requireAuth();
```

---

### 4.7 Permission Rules

Every protected action must check permission.

Rules:

1. Use permission key, not scattered role checks.
2. Permission check must happen in backend.
3. Frontend permission check is UX only.
4. Missing permission returns `403 FORBIDDEN` or `MISSING_PERMISSION`.
5. New permission must be documented in `appendices/permission-keys.md`.
6. Critical permission behavior must be tested.

Bad:

```ts
if (user.role !== "OWNER") {
  throw new Error("Forbidden");
}
```

Better:

```ts
requirePermission(user, "restaurant.payments.create");
```

Permission does not replace:

```txt
tenant scope
business rule
status transition
input validation
```

Because security has layers. Annoying, yes. Necessary, also yes.

---

### 4.8 Tenant/Business Scope Rules

Every tenant-owned resource must be scoped.

Tenant-owned data includes:

```txt
orders
payments
menu items
inventory items
stock movements
tables
settings
reports
audit logs
employees
shifts
```

Rules:

1. Query tenant-owned data with `restaurantId` or `businessId`.
2. Never use `findUnique({ id })` alone for tenant-owned data.
3. Use `findFirst({ id, restaurantId })` when needed.
4. Do not trust frontend-provided tenant ID.
5. Cross-tenant access should return safe `404` or `403`.
6. Cache keys must include tenant scope.
7. Logs must include tenant scope only when safe.

Bad:

```ts
await prisma.order.findUnique({
  where: {
    id: orderId,
  },
});
```

Good:

```ts
await prisma.order.findFirst({
  where: {
    id: orderId,
    restaurantId: user.restaurantId,
  },
});
```

One missing scope filter can turn a SaaS into a legal complaint generator.

---

### 4.9 Service Layer Rules

Business logic belongs in service layer.

Route handler should:

```txt
parse request
authenticate
authorize
validate input
call service
return response
```

Service should:

```txt
apply business rules
validate transitions
coordinate transaction
call repositories if used
create audit logs
return result
```

Repository should:

```txt
query database
persist records
avoid heavy business logic
```

Rules:

1. Do not put complex business logic in route handler.
2. Do not put business logic in React component.
3. Do not duplicate business logic across endpoints.
4. Centralize critical logic.
5. Service functions must accept current user/context.
6. Service functions must enforce business rules.

Bad:

```txt
app/api/orders/[id]/status/route.ts contains full state machine
```

Good:

```txt
order.service.ts contains transition logic
route.ts calls orderService.transitionStatus()
```

---

### 4.10 Transaction Rules

Use database transaction when one action changes multiple related records.

Transaction required for:

```txt
create order + order items + stock movement
payment create + order update + audit log
stock adjustment + stock movement + audit log
shift close + cash summary + audit log
refund + payment update + order update + audit log
```

Rules:

1. Use transaction for multi-record critical mutation.
2. Keep transaction short.
3. Do not call slow external API inside long transaction if avoidable.
4. Do not partially update critical workflow.
5. Rollback on failure.
6. Audit log should be created in same transaction when possible.

Bad:

```ts
await createPayment();
await updateOrder();
await createAuditLog();
```

without transaction.

Correct:

```ts
await prisma.$transaction(async (tx) => {
  const payment = await tx.payment.create(...);
  const order = await tx.order.update(...);
  await tx.auditLog.create(...);

  return { payment, order };
});
```

---

### 4.11 Order Implementation Rules

Order logic must follow status transition docs.

Rules:

1. Do not create order without validated items.
2. Do not trust frontend price.
3. Backend must load menu item price from database.
4. Store item name/price snapshot.
5. Check menu item availability.
6. Check tenant scope.
7. Check table status if table is used.
8. Check stock if inventory recipe is enabled.
9. Create audit log for important actions.
10. Status update must use transition service.

Order item must preserve history:

```txt
nameSnapshot
priceSnapshot
quantity
notes
subtotal
```

Because menu price can change later.

Historical order must not change just because someone edited “Nasi Goreng” into “Nasi Goreng Premium Ultra Deluxe.” Humanity did not need that chaos.

---

### 4.12 Payment Implementation Rules

Payment is critical.

Rules:

1. Payment must be created through payment service.
2. Payment must validate order scope.
3. Payment must validate order payable state.
4. Payment must validate amount.
5. Payment must block duplicate payment.
6. Payment and order update must use transaction.
7. Payment must create audit log.
8. Payment must not trust frontend total.
9. Payment provider webhook must be verified if used.
10. Refund must use separate refund flow.

Do not:

```ts
await prisma.order.update({
  data: {
    status: "PAID",
  },
});
```

without payment logic.

That is not payment. That is pretending money happened.

---

### 4.13 Inventory Implementation Rules

Inventory mutation must be traceable.

Rules:

1. Stock quantity must not change without stock movement.
2. Stock movement must include type.
3. Stock movement must include quantity.
4. Stock movement must include actor/system source.
5. Stock movement must include reason when manual.
6. Stock mutation must use transaction.
7. Negative stock policy must be explicit.
8. Order stock deduction/restore must be documented.
9. Inventory mutation must be tenant-scoped.
10. Important inventory changes must create audit log.

Do not:

```ts
await prisma.inventoryItem.update({
  where: { id },
  data: { quantity },
});
```

without movement.

That is accounting by vibes. Avoid.

---

### 4.14 Status Transition Rules

Any status update must follow transition maps.

Applies to:

```txt
order status
payment status
table status
shift status
invoice status future
subscription status future
```

Rules:

1. Load current status from database.
2. Validate next status.
3. Check transition map.
4. Check permission.
5. Check side effects.
6. Use transaction when needed.
7. Create audit log.
8. Add test for new transition.
9. Update docs when adding status.

Do not:

```ts
data: { status: input.status }
```

unless the service already validated everything.

---

### 4.15 API Response Rules

Every API route must use standard response format.

Success:

```json
{
  "success": true,
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "message": "Invalid state transition.",
  "code": "INVALID_STATE_TRANSITION"
}
```

Rules:

1. Use centralized response helpers.
2. Do not invent response shape per route.
3. Use documented error codes.
4. Include requestId when available.
5. Do not return raw stack trace.
6. Do not return sensitive fields.
7. Match HTTP status with error meaning.

---

### 4.16 Error Handling Rules

Errors must be handled consistently.

Rules:

1. Use `AppError` for expected business errors.
2. Use standard error codes.
3. Unexpected errors become `INTERNAL_SERVER_ERROR`.
4. Log unexpected errors.
5. Do not catch and ignore errors.
6. Do not return success after failed mutation.
7. Do not expose internal details in production.
8. Validation errors use `VALIDATION_ERROR`.

Bad:

```ts
try {
  await createPayment();
} catch {
  return successResponse({ data: null });
}
```

This is not resilience. This is lying with extra steps.

---

### 4.17 Logging Rules

Important actions and failures must be logged safely.

Log:

```txt
requestId
userId
restaurantId/businessId
action
entityId
errorCode
durationMs
```

Do not log:

```txt
password
passwordHash
session token
JWT
reset token
DATABASE_URL
API key
payment secret
storage secret
raw sensitive payload
```

Rules:

1. Use structured logs.
2. Use correct log level.
3. Include requestId.
4. Avoid noisy debug logs in production.
5. Log unexpected failures.
6. Log security-relevant events safely.

---

### 4.18 Audit Log Rules

Audit logs are required for critical business/security actions.

Audit required for:

```txt
order status updated
payment created
payment refunded
stock adjusted
settings updated
role changed
user deactivated
shift closed
subscription changed future
platform admin action future
```

Rules:

1. Audit actor comes from backend current user.
2. Audit must be tenant-scoped.
3. Audit should include before/after values when safe.
4. Audit must not store secrets.
5. Audit should be in same transaction when possible.
6. Audit logs must not be editable by normal users.

---

### 4.19 Database Schema Rules

Schema changes must be careful.

Rules:

1. Do not change schema casually.
2. Consider migration impact.
3. Add indexes for common query patterns.
4. Preserve historical data.
5. Use Decimal/integer for money.
6. Use relation constraints where appropriate.
7. Use unique constraints for duplicate prevention.
8. Use nullable fields intentionally.
9. Do not delete columns without migration plan.
10. Update docs when schema changes affect architecture.

Before adding model, ask:

```txt
is this shared or mode-specific?
does it need tenant scope?
does it need audit?
does it need indexes?
does it need soft delete?
does it affect reports?
```

---

### 4.20 Dependency Rules

Adding dependency must be justified.

Rules:

1. Check if existing dependency already solves it.
2. Prefer small, maintained libraries.
3. Avoid abandoned packages.
4. Avoid huge dependency for tiny function.
5. Check security implications.
6. Document why dependency is needed.
7. Do not add UI library that conflicts with current design system.
8. Do not add state management library unless needed.

Bad:

```txt
install 9 packages to format currency
```

Correct:

```txt
use Intl.NumberFormat
```

Congratulations, JavaScript already has one useful thing.

---

### 4.21 File and Folder Rules

Project structure should stay predictable.

Rules:

1. Feature-specific logic goes in feature folder.
2. Shared reusable code goes in shared/lib folder.
3. Do not duplicate utilities.
4. Do not create random `utils2.ts`.
5. Do not create `final.ts`.
6. Do not mix frontend component with backend service.
7. Keep file names descriptive.
8. Use barrel exports only when they help clarity.

Bad:

```txt
src/helpers/fix.ts
src/lib/random.ts
src/components/NewNewDashboardFinal.tsx
```

Good:

```txt
src/features/orders/services/order.service.ts
src/features/payments/services/payment.service.ts
src/lib/errors/app-error.ts
```

---

### 4.22 Frontend Implementation Rules

Frontend must be clear and operational.

Rules:

1. Use shared UI components.
2. Use feature components for feature-specific UI.
3. Include loading state.
4. Include error state.
5. Include empty state.
6. Disable submit button while request is pending.
7. Do not duplicate API calls.
8. Do not fetch data that page does not need.
9. Do not put backend business logic in UI.
10. Do not treat UI permission as security.
11. Use enum display maps.
12. Keep forms validated on frontend and backend.

Cashier UI:

```txt
fast
clear
minimal friction
```

Kitchen UI:

```txt
large readable cards
clear status
quick actions
```

Owner UI:

```txt
accurate analytics
filters
reports
```

A cashier does not need a philosophical dashboard. They need the payment button to work.

---

### 4.23 Testing Implementation Rules

Critical changes need tests or manual checklist.

Test required for:

```txt
order status transition
payment creation
duplicate payment
permission map
tenant isolation
stock movement
validation schema
error code behavior
API response shape
```

Rules:

1. Add unit tests for pure business logic.
2. Add integration tests for DB/service critical flow.
3. Add E2E/manual checklist for main workflow.
4. Do not use production database.
5. Do not skip failing tests permanently.
6. Do not mock so much that test proves nothing.
7. Run typecheck/build before declaring done.

Minimum checks before merge/deploy:

```bash
pnpm typecheck
pnpm build
pnpm test
pnpm prisma validate
```

Adjust to actual project scripts.

---

### 4.24 CI/CD Implementation Rules

CI/CD must protect main branch.

Rules:

1. Main branch should stay deployable.
2. CI should run typecheck/build.
3. CI should run tests when available.
4. CI should validate Prisma schema.
5. Failed CI should block risky deploy.
6. Do not commit `.env`.
7. Keep `.env.example` updated.
8. Use clear commit messages.
9. Keep pull request scope focused.
10. Use rollback when production breaks.

Commit examples:

```txt
feat: add order status transition validator
fix: block duplicate payment creation
docs: add implementation rules appendix
test: add payment permission tests
refactor: move order mutation into service
```

Bad commit:

```txt
fix
```

A commit named `fix` helps no one, including future you, who will already be disappointed.

---

### 4.25 AI/Codex-Specific Rules

When AI/Codex implements changes:

1. It must inspect existing files before editing.
2. It must preserve existing behavior unless requested.
3. It must not invent missing architecture without confirmation.
4. It must not create duplicate utilities if existing ones exist.
5. It must not bypass type errors.
6. It must not delete code to make build pass unless deletion is correct.
7. It must not replace real logic with mock data unless explicitly requested.
8. It must not hardcode tenant/user IDs.
9. It must not hardcode sample data into production paths.
10. It must not create fake enterprise placeholder pages.
11. It must not update status directly without service.
12. It must not skip auth/permission checks.
13. It must not create inconsistent API response.
14. It must not change schema without migration awareness.
15. It must not add dependency without explanation.
16. It must run or suggest relevant checks.
17. It must summarize changed files and reasons.
18. It must report unresolved risks honestly.

Codex prompt should include:

```txt
Do not use temporary fixes.
Do not silence TypeScript errors.
Do not remove features to make build pass.
Fix root cause.
Follow docs.
Keep changes scoped.
Explain every important change.
```

AI is a tool, not a senior engineer. It can type fast. That is not the same as judgment.

---

## 5. Implementation Guide

### 5.1 Standard Backend Route Pattern

Recommended route pattern:

```ts
export async function POST(req: Request) {
  const requestId = createRequestId();

  try {
    const user = await requireAuth();

    requirePermission(user, "restaurant.orders.create");

    const body = await req.json();
    const input = createOrderSchema.parse(body);

    const order = await orderService.createOrder({
      user,
      input,
      requestId,
    });

    return successResponse({
      message: "Order created successfully.",
      data: order,
      status: 201,
      requestId,
    });
  } catch (error) {
    return handleApiError(error, requestId);
  }
}
```

Route must not become a 500-line business logic swamp.

### 5.2 Standard Service Pattern

```ts
export async function createOrder({
  user,
  input,
  requestId,
}: {
  user: CurrentUser;
  input: CreateOrderInput;
  requestId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const menuItems = await loadMenuItemsForOrder({
      tx,
      restaurantId: user.restaurantId,
      items: input.items,
    });

    const totals = calculateOrderTotals({
      inputItems: input.items,
      menuItems,
    });

    const order = await tx.order.create({
      data: {
        restaurantId: user.restaurantId,
        status: "WAITING_PAYMENT",
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        serviceChargeAmount: totals.serviceChargeAmount,
        totalAmount: totals.totalAmount,
        createdById: user.id,
      },
    });

    await tx.auditLog.create({
      data: {
        restaurantId: user.restaurantId,
        actorUserId: user.id,
        action: "ORDER_CREATED",
        entityType: "Order",
        entityId: order.id,
      },
    });

    return order;
  });
}
```

### 5.3 Standard Permission Pattern

```ts
const user = await requireAuth();

requirePermission(user, "restaurant.payments.create");
```

Do not:

```ts
if (user.role === "CASHIER") {}
```

unless the permission system intentionally maps it there.

### 5.4 Standard Tenant Scope Pattern

```ts
const order = await prisma.order.findFirst({
  where: {
    id: orderId,
    restaurantId: user.restaurantId,
  },
});
```

Not:

```ts
const order = await prisma.order.findUnique({
  where: {
    id: orderId,
  },
});
```

### 5.5 Standard Status Transition Pattern

```ts
const order = await loadScopedOrder(user, orderId);

validateOrderTransition({
  user,
  order,
  nextStatus,
});

await applyOrderTransition({
  user,
  order,
  nextStatus,
});
```

Never:

```ts
await prisma.order.update({
  data: {
    status: nextStatus,
  },
});
```

without validation.

### 5.6 Standard Error Pattern

```ts
throw new AppError({
  statusCode: 409,
  code: "DUPLICATE_PAYMENT",
  message: "Payment already exists for this order.",
});
```

Do not:

```ts
throw new Error("anjg payment double");
```

Emotionally valid. Operationally useless.

### 5.7 Standard Audit Pattern

```ts
await tx.auditLog.create({
  data: {
    restaurantId: user.restaurantId,
    actorUserId: user.id,
    action: "PAYMENT_CREATED",
    entityType: "Payment",
    entityId: payment.id,
    metadata: {
      orderId: order.id,
      amount: payment.amount,
    },
  },
});
```

Rules:

```txt
actor from backend
tenant scope included
no secrets
inside transaction when critical
```

### 5.8 Standard Manual Verification Format

When a change cannot be fully tested automatically yet, document manual verification:

```md
## Manual Verification

- [ ] Login as CASHIER.
- [ ] Create order.
- [ ] Process payment.
- [ ] Confirm order becomes PAID.
- [ ] Login as KITCHEN.
- [ ] Confirm order appears in kitchen queue.
- [ ] Mark PREPARING.
- [ ] Mark READY.
- [ ] Login as SERVER.
- [ ] Confirm order appears in serving queue.
- [ ] Mark SERVED.
- [ ] Mark COMPLETED.
```

Manual testing is not ideal, but undocumented manual testing is worse.

---

## 6. Anti-Patterns

Do not:

- Implement before reading docs
- Fix symptoms instead of root cause
- Use temporary patch for critical logic
- Silence TypeScript with `any`
- Use `@ts-ignore` as fix
- Delete code to make build pass without understanding it
- Remove feature because it caused error
- Trust frontend role
- Trust frontend tenant ID
- Trust frontend total amount
- Trust frontend status
- Skip backend auth
- Skip backend permission
- Skip tenant scope
- Update order status directly
- Create payment without duplicate prevention
- Mutate stock without stock movement
- Add new status without transition map
- Add new permission without docs
- Add new error code without docs
- Return inconsistent API response
- Catch and ignore errors
- Log secrets
- Commit `.env`
- Use production database for tests
- Add dependency without reason
- Create fake placeholder enterprise features
- Refactor unrelated files during bug fix
- Build future modes before Restaurant is stable
- Add microservices before modular monolith is stable

---

## 7. Checklist

Implementation is acceptable when:

- [ ] Relevant docs were checked.
- [ ] Change scope is clear.
- [ ] Existing behavior is preserved unless intentionally changed.
- [ ] No temporary patch is used for critical logic.
- [ ] TypeScript errors are fixed properly.
- [ ] No casual `any` is introduced.
- [ ] Input is validated.
- [ ] Auth is checked.
- [ ] Permission is checked.
- [ ] Tenant/business scope is checked.
- [ ] Business rules are enforced.
- [ ] Status transitions use transition map.
- [ ] Payment uses payment service.
- [ ] Stock mutation creates stock movement.
- [ ] Critical multi-record mutation uses transaction.
- [ ] Critical action creates audit log.
- [ ] API response format is standard.
- [ ] Error code is documented.
- [ ] Logs are safe.
- [ ] Sensitive fields are not returned.
- [ ] Tests are added or manual verification is documented.
- [ ] Typecheck/build/test commands are run when possible.
- [ ] No unrelated refactor is included.
- [ ] No fake placeholder feature is added.
- [ ] Remaining risks are documented honestly.

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
- appendices/anti-patterns.md