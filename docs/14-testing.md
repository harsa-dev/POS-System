# Testing

## 1. Purpose

This document defines the testing strategy for POS System V3.

It explains what must be tested, which test types should be used, what business flows are critical, how role and permission behavior should be verified, how database and API logic should be tested, and how testing should integrate with CI/CD.

The goal is to reduce regressions, protect critical business workflows, and make refactoring safer.

Testing does not guarantee that the system has no bugs.

Testing reduces the chance that a small code change destroys order, payment, inventory, or permissions while everyone pretends the green button means “production ready.”

---

## 2. Current Context

POS System V3 is a SaaS-style POS and business operating system.

The active mode is:

```txt
Restaurant / F&B
```

The system includes critical workflows:

```txt
auth
role permission
tenant isolation
order creation
cashier approval
payment creation
kitchen queue
serving queue
inventory stock movement
settings
audit logs
analytics
reports
```

Important current stack:

```txt
Next.js
TypeScript
Prisma
PostgreSQL
Zod
React
pnpm
```

Recommended testing stack:

```txt
TypeScript typecheck
ESLint
Prisma validate
Vitest for unit/integration tests
Playwright for E2E tests
manual QA checklist
CI checks through GitHub Actions
```

Testing should focus first on backend/business logic.

Frontend UI testing is useful, but the highest risk lives in:

```txt
order status transition
payment consistency
stock movement
permission enforcement
tenant isolation
database transaction
```

A pretty page with broken payment logic is not a product. It is a decorated failure.

---

## 3. Decisions

The following testing decisions are locked:

1. TypeScript typecheck is mandatory before production deploy.
2. Build check is mandatory before production deploy.
3. Prisma schema validation should run before deployment.
4. Unit tests should prioritize business logic.
5. Integration tests should prioritize service and database behavior.
6. E2E tests should prioritize critical user flows.
7. Manual testing is still required for UI/UX.
8. Backend permission tests are mandatory for critical actions.
9. Tenant isolation tests are mandatory before SaaS production.
10. Order status transition tests are mandatory.
11. Payment duplicate prevention must be tested.
12. Inventory stock movement behavior must be tested.
13. Audit log creation for critical mutations should be tested.
14. Validation schema should be tested for important inputs.
15. API response format should be tested for critical endpoints.
16. CI should run static checks and tests gradually.
17. Tests should be added incrementally, not all at once.
18. Testing should not block learning progress with fake perfection.
19. Critical workflows must have regression checklists.
20. Staging should be manually tested before production.
21. Production testing must not use destructive dummy data.
22. Seed data should exist for local/staging tests.
23. Tests must avoid real payment provider calls unless using sandbox.
24. Tests must not depend on production database.
25. Failing tests must be fixed properly, not ignored.

---

## 4. Rules

### 4.1 Testing Priority Rules

Test priority must follow business risk.

Highest priority:

```txt
auth
permission
tenant isolation
order status transition
payment creation
duplicate payment prevention
stock movement
database transaction
critical API validation
```

Medium priority:

```txt
analytics calculation
report generation
settings update
invoice generation
cashflow entry
table status
shift logic
```

Lower priority:

```txt
visual styling
animation
minor layout detail
non-critical UI copy
```

Rules:

1. Test business correctness first.
2. Test UI polish later.
3. Do not spend all effort snapshot-testing buttons while payment logic is untested.
4. Critical backend logic deserves tests before frontend decoration.

### 4.2 Static Check Rules

Static checks must run before deployment.

Static checks include:

```txt
TypeScript typecheck
ESLint
Prettier if used
Prisma validate
Zod schema correctness
build
```

Recommended scripts:

```json
{
  "scripts": {
    "typecheck": "tsc --noEmit",
    "lint": "next lint",
    "build": "next build",
    "test": "vitest",
    "prisma:validate": "prisma validate"
  }
}
```

Rules:

1. TypeScript errors must not be ignored.
2. Build errors must block deployment.
3. Prisma schema errors must block deployment.
4. Do not silence real errors using `any`.
5. Do not delete failing checks just to deploy.

### 4.3 Unit Test Rules

Unit tests should test small pure logic.

Good unit test targets:

```txt
calculate order total
calculate tax
calculate service charge
validate order status transition
check role permission
check plan feature access
generate order number
format currency
validate stock movement type
calculate report summary
```

Unit tests should avoid:

```txt
real database
real network
real payment provider
real file storage
```

Rules:

1. Unit tests should be fast.
2. Unit tests should be deterministic.
3. Unit tests should not depend on production data.
4. Unit tests should cover important edge cases.
5. Business logic should be written in testable functions.

### 4.4 Integration Test Rules

Integration tests verify multiple parts working together.

Examples:

```txt
service + repository + database
API route + auth + validation + service
order creation + stock movement transaction
payment creation + order status update
settings update + audit log
```

Rules:

1. Integration tests may use test database.
2. Integration tests must isolate test data.
3. Integration tests must not use production database.
4. Integration tests should clean up data or use transaction rollback.
5. Critical service/database behavior should have integration tests.

### 4.5 E2E Test Rules

E2E tests simulate real user workflows.

Recommended tool:

```txt
Playwright
```

Critical E2E flows:

```txt
login as cashier
create order
process payment
kitchen sees paid order
kitchen marks preparing
kitchen marks ready
server sees ready order
server marks served/completed
owner sees completed order in report
```

Rules:

1. E2E tests should be limited but meaningful.
2. E2E tests should not cover every tiny UI detail.
3. E2E tests must use test/staging data.
4. E2E tests must avoid real payment provider production calls.
5. E2E tests must be stable enough for CI before being required.

### 4.6 Manual Testing Rules

Manual testing is still required.

Manual testing is useful for:

```txt
UI/UX
responsive layout
loading state
error state
empty state
real device behavior
cashier speed
kitchen readability
serving workflow clarity
```

Manual testing should use checklist.

Do not rely on memory.

Human memory is a cache with terrible invalidation.

### 4.7 Test Data Rules

Testing requires predictable test data.

Recommended seed users:

```txt
owner@test.local
manager@test.local
cashier@test.local
kitchen@test.local
server@test.local
```

Recommended test business:

```txt
Demo Restaurant
```

Recommended test data:

```txt
categories
menu items
inventory items
recipes
tables
orders in different statuses
payment methods
settings
```

Rules:

1. Local seed data must be safe.
2. Staging seed data must not be real customer data.
3. Production must not be seeded with random demo data.
4. Tests must not depend on one fragile manually-created record.
5. Test data should be resettable.

### 4.8 Tenant Isolation Test Rules

Tenant isolation must be tested.

Test cases:

```txt
user from Restaurant A cannot see Restaurant B orders
user from Restaurant A cannot update Restaurant B order
user from Restaurant A cannot access Restaurant B inventory
user from Restaurant A cannot see Restaurant B payments
user from Restaurant A cannot view Restaurant B reports
```

Rules:

1. Business-owned queries must be scoped.
2. Cross-tenant access must return safe error.
3. Tests should verify ID-only access is blocked.
4. Tenant isolation tests are mandatory before production SaaS use.

### 4.9 Permission Test Rules

Permission tests must verify that each role can only do allowed actions.

Test cases:

```txt
CASHIER can create order
CASHIER can create payment
CASHIER cannot update kitchen status unless allowed

KITCHEN can view kitchen queue
KITCHEN can update PAID → PREPARING
KITCHEN can update PREPARING → READY
KITCHEN cannot create payment

SERVER can view serving queue
SERVER can update READY → SERVED
SERVER cannot create payment

OWNER can manage settings
MANAGER can access operational reports
```

Rules:

1. UI permission is not enough.
2. Backend API permission must be tested.
3. Forbidden action should return `403`.
4. Unauthenticated action should return `401`.
5. Wrong tenant action should return safe `404` or `403`.

### 4.10 Regression Test Rules

Regression tests prevent old bugs from returning.

When a bug is fixed:

```txt
write a test that fails before the fix
make the fix
test passes
```

Examples:

```txt
duplicate payment bug
invalid order status transition bug
missing restaurantId scope bug
stock movement not created bug
audit log missing bug
```

Rules:

1. Critical bug fix should add regression test.
2. Do not fix only the symptom.
3. Test the business rule that failed.
4. Keep regression tests focused.

---

## 5. Implementation Guide

### 5.1 Testing Pyramid

Recommended testing pyramid:

```txt
       E2E Tests
   Integration Tests
      Unit Tests
   Static Checks
```

For this project:

```txt
Many:
static checks and unit tests

Some:
integration tests for services/API/database

Few:
E2E tests for critical workflows
```

Do not test everything with E2E.

E2E tests are powerful but slower and more fragile.

Testing every button click with E2E is how test suites become a second broken application.

---

### 5.2 Testing Trophy

Recommended modern web testing model:

```txt
Static checks
Unit tests
Integration tests
E2E tests
```

Static checks catch many issues early:

```txt
TypeScript
ESLint
Prisma validate
Build
```

Unit and integration tests protect business logic.

E2E tests protect full workflows.

Manual QA protects human usability.

---

### 5.3 Recommended Tooling

Recommended tools:

```txt
TypeScript:
static typing

ESLint:
code quality

Prisma validate:
schema validation

Vitest:
unit and integration tests

React Testing Library:
component behavior tests if needed

Playwright:
E2E tests

GitHub Actions:
CI checks
```

Install Vitest:

```bash
pnpm add -D vitest
```

Install Playwright:

```bash
pnpm add -D @playwright/test
pnpm exec playwright install
```

Package scripts:

```json
{
  "scripts": {
    "typecheck": "tsc --noEmit",
    "lint": "next lint",
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:e2e": "playwright test",
    "prisma:validate": "prisma validate",
    "build": "next build"
  }
}
```

Adjust script names to match actual project setup.

---

### 5.4 Unit Test: Order Status Transition

Order status transition is critical.

Flow:

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
CANCELLED
REJECTED
REFUNDED
```

Example transition map:

```ts
export const allowedOrderTransitions = {
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

Example test:

```ts
import { describe, expect, it } from "vitest";
import { canTransitionOrderStatus } from "./order-status";

describe("canTransitionOrderStatus", () => {
  it("allows WAITING_PAYMENT to PAID", () => {
    expect(
      canTransitionOrderStatus({
        currentStatus: "WAITING_PAYMENT",
        nextStatus: "PAID",
      }),
    ).toBe(true);
  });

  it("blocks WAITING_PAYMENT to READY", () => {
    expect(
      canTransitionOrderStatus({
        currentStatus: "WAITING_PAYMENT",
        nextStatus: "READY",
      }),
    ).toBe(false);
  });

  it("blocks changes from COMPLETED", () => {
    expect(
      canTransitionOrderStatus({
        currentStatus: "COMPLETED",
        nextStatus: "READY",
      }),
    ).toBe(false);
  });
});
```

This test is small but valuable.

Order status is the backbone of POS.

If order status can jump randomly, the system becomes interpretive dance with database rows.

---

### 5.5 Unit Test: Role Permission

Example permission map:

```ts
export const rolePermissions = {
  OWNER: ["*"],
  MANAGER: [
    "restaurant.orders.view",
    "restaurant.orders.update-status",
    "restaurant.payments.create",
    "restaurant.kitchen.update",
    "restaurant.serving.update",
    "shared.reports.view",
  ],
  CASHIER: [
    "restaurant.orders.create",
    "restaurant.orders.view",
    "restaurant.orders.approve",
    "restaurant.payments.create",
  ],
  KITCHEN: [
    "restaurant.kitchen.view",
    "restaurant.kitchen.update",
  ],
  SERVER: [
    "restaurant.serving.view",
    "restaurant.serving.update",
  ],
} as const;
```

Test:

```ts
import { describe, expect, it } from "vitest";
import { hasPermission } from "./permissions";

describe("hasPermission", () => {
  it("allows cashier to create payment", () => {
    expect(
      hasPermission("CASHIER", "restaurant.payments.create"),
    ).toBe(true);
  });

  it("blocks kitchen from creating payment", () => {
    expect(
      hasPermission("KITCHEN", "restaurant.payments.create"),
    ).toBe(false);
  });

  it("allows kitchen to update kitchen status", () => {
    expect(
      hasPermission("KITCHEN", "restaurant.kitchen.update"),
    ).toBe(true);
  });

  it("blocks server from kitchen update", () => {
    expect(
      hasPermission("SERVER", "restaurant.kitchen.update"),
    ).toBe(false);
  });
});
```

Permission tests prevent “staff role accidentally became admin” problems.

Which is generally frowned upon, unless your product roadmap includes chaos.

---

### 5.6 Unit Test: Order Total Calculation

Backend must calculate totals.

Example:

```ts
export function calculateOrderTotal({
  items,
  taxRate,
  serviceChargeRate,
  discountAmount = 0,
}: {
  items: { price: number; quantity: number }[];
  taxRate: number;
  serviceChargeRate: number;
  discountAmount?: number;
}) {
  const subtotal = items.reduce((sum, item) => {
    return sum + item.price * item.quantity;
  }, 0);

  const taxAmount = subtotal * taxRate;
  const serviceChargeAmount = subtotal * serviceChargeRate;
  const totalAmount =
    subtotal + taxAmount + serviceChargeAmount - discountAmount;

  return {
    subtotal,
    taxAmount,
    serviceChargeAmount,
    discountAmount,
    totalAmount,
  };
}
```

Test:

```ts
import { describe, expect, it } from "vitest";
import { calculateOrderTotal } from "./calculate-order-total";

describe("calculateOrderTotal", () => {
  it("calculates subtotal, tax, service charge, and total", () => {
    const result = calculateOrderTotal({
      items: [
        { price: 20000, quantity: 2 },
        { price: 10000, quantity: 1 },
      ],
      taxRate: 0.1,
      serviceChargeRate: 0.05,
    });

    expect(result.subtotal).toBe(50000);
    expect(result.taxAmount).toBe(5000);
    expect(result.serviceChargeAmount).toBe(2500);
    expect(result.totalAmount).toBe(57500);
  });

  it("applies discount", () => {
    const result = calculateOrderTotal({
      items: [{ price: 50000, quantity: 1 }],
      taxRate: 0,
      serviceChargeRate: 0,
      discountAmount: 10000,
    });

    expect(result.totalAmount).toBe(40000);
  });
});
```

Production money handling should use Decimal or integer minor units.

The test concept is still useful.

---

### 5.7 Unit Test: Validation Schema

Validation schema should reject bad input.

Example with Zod:

```ts
import { describe, expect, it } from "vitest";
import { createOrderSchema } from "./create-order.schema";

describe("createOrderSchema", () => {
  it("accepts valid order input", () => {
    const result = createOrderSchema.safeParse({
      tableId: "table_123",
      items: [
        {
          menuItemId: "menu_123",
          quantity: 2,
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("rejects empty items", () => {
    const result = createOrderSchema.safeParse({
      tableId: "table_123",
      items: [],
    });

    expect(result.success).toBe(false);
  });

  it("rejects negative quantity", () => {
    const result = createOrderSchema.safeParse({
      items: [
        {
          menuItemId: "menu_123",
          quantity: -1,
        },
      ],
    });

    expect(result.success).toBe(false);
  });
});
```

Schema tests are not needed for every tiny schema.

Test schemas that protect critical actions.

---

### 5.8 Integration Test: Create Order

Create order integration test should verify:

```txt
user is authenticated
user has permission
menu items are loaded from database
prices are calculated from database
order is created
order items are created
snapshots are stored
stock movement is created if inventory is enabled
audit log is created
```

Test scenario:

```txt
given cashier user
given restaurant
given menu item
given inventory item and recipe
when create order
then order exists
then order item snapshot exists
then total matches database price
then stock movement exists
then audit log exists
```

Important assertions:

```txt
frontend price is ignored
restaurant scope is enforced
empty order is rejected
invalid menu item is rejected
insufficient stock is rejected
```

### 5.9 Integration Test: Payment

Payment integration test should verify:

```txt
order exists
order belongs to same business
payment amount is valid
payment is created
order paymentStatus becomes PAID
order status becomes PAID when valid
audit log is created
duplicate payment is blocked
```

Test cases:

```txt
cashier can create payment
kitchen cannot create payment
duplicate payment returns conflict
payment for other tenant order is rejected
payment amount mismatch is rejected
```

Payment testing is not optional.

Money has a charming habit of turning small bugs into large arguments.

### 5.10 Integration Test: Inventory Stock Movement

Inventory test should verify:

```txt
stock adjustment creates stock movement
stock quantity updates correctly
movement has actor
movement has reason
movement is scoped
audit log is created
negative stock is blocked if policy forbids it
```

Test cases:

```txt
manager can adjust stock
cashier cannot adjust stock
stock movement missing should never happen
tenant A cannot mutate tenant B inventory
```

### 5.11 Integration Test: Tenant Isolation

Create two businesses:

```txt
Restaurant A
Restaurant B
```

Create users:

```txt
cashier A
cashier B
```

Create data:

```txt
order A
order B
inventory A
inventory B
payment A
payment B
```

Test:

```txt
cashier A cannot get order B
cashier A cannot update order B
cashier A cannot pay order B
cashier A cannot access inventory B
cashier A cannot view report B
```

Expected result:

```txt
404 Not Found
```

or:

```txt
403 Forbidden
```

depending on endpoint policy.

The important part:

```txt
data must not leak
```

### 5.12 E2E Test: Restaurant Main Flow

Critical E2E flow:

```txt
login as cashier
create order
process payment
logout or switch user
login as kitchen
see paid order
mark preparing
mark ready
login as server
see ready order
mark served
mark completed
login as owner
see completed order in orders/report
```

This is the most important full workflow.

If this breaks, POS core is broken.

No amount of pretty dashboard cards can compensate.

### 5.13 E2E Test: Permission Blocking

E2E permission tests:

```txt
login as kitchen
try opening payment page
expect access denied or redirect

login as server
try opening settings page
expect access denied or redirect

login as cashier
try opening owner analytics if restricted
expect access denied or limited view
```

Backend API tests must still exist.

Frontend E2E only verifies user experience.

Security remains backend’s job.

### 5.14 Manual QA Checklist

Manual QA before important deploy:

```txt
Auth:
- login works
- logout works
- invalid login rejected
- inactive user rejected

Cashier:
- create order works
- empty cart rejected
- payment works
- duplicate payment blocked
- order appears as PAID

Kitchen:
- PAID order appears
- mark PREPARING works
- mark READY works
- unpaid order does not appear

Serving:
- READY order appears
- mark SERVED works
- mark COMPLETED works

Inventory:
- stock movement created
- stock quantity updates
- insufficient stock handled

Permissions:
- kitchen cannot process payment
- server cannot update payment
- cashier cannot access forbidden settings

Tenant:
- user only sees own restaurant data

UI:
- loading state appears
- error state is readable
- empty state is clear
- mobile/tablet layout usable
```

Manual QA is boring.

So is brushing teeth.

Both prevent unpleasant future events.

### 5.15 CI Testing Strategy

CI should start simple.

Minimum CI:

```txt
install dependencies
prisma validate
typecheck
build
```

Better CI:

```txt
install dependencies
prisma validate
typecheck
lint
unit tests
build
```

Later CI:

```txt
integration tests
E2E tests on staging/preview
```

Example GitHub Actions idea:

```yaml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  checks:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Prisma validate
        run: pnpm prisma validate

      - name: Typecheck
        run: pnpm typecheck

      - name: Test
        run: pnpm test

      - name: Build
        run: pnpm build
```

Adjust commands to actual project scripts.

### 5.16 Testing Roadmap

Recommended testing roadmap:

#### Phase 1: Static Safety

```txt
typecheck
build
Prisma validate
lint if configured
```

#### Phase 2: Business Unit Tests

```txt
order status transition
permission map
order total calculation
stock calculation
validation schema
```

#### Phase 3: Service Integration Tests

```txt
create order
create payment
stock movement
tenant isolation
audit log
```

#### Phase 4: E2E Critical Flow

```txt
cashier → payment → kitchen → serving → completed
```

#### Phase 5: Production Readiness

```txt
CI required
staging smoke test
monitoring connected
error tracking connected
manual release checklist
```

Do this gradually.

Trying to write every test at once is how testing becomes another abandoned folder. Very inspirational, in the worst way.

---

## 6. Anti-Patterns

Do not:

- Deploy with TypeScript errors
- Deploy with failing build
- Ignore Prisma validation errors
- Test only happy path
- Test only UI while backend business logic is untested
- Skip tenant isolation testing
- Skip permission testing
- Skip payment duplicate testing
- Trust frontend tests as security proof
- Use production database for tests
- Use production payment provider in tests
- Depend on fragile manual data
- Write tests that pass only on your laptop
- Mock everything until test proves nothing
- Test implementation details instead of behavior
- Delete failing tests instead of fixing bug
- Mark broken tests as skipped forever
- Add `any` to silence type errors
- Rely only on manual testing
- Run huge E2E suite for every tiny docs change
- Ignore flaky tests
- Let CI fail and merge anyway
- Use tests as decoration for portfolio without real coverage of risky logic

---

## 7. Checklist

Testing is acceptable when:

- [ ] TypeScript typecheck exists.
- [ ] Production build check exists.
- [ ] Prisma validate exists.
- [ ] Critical business logic has unit tests.
- [ ] Order status transition is tested.
- [ ] Permission behavior is tested.
- [ ] Order total calculation is tested.
- [ ] Validation schema is tested for critical endpoints.
- [ ] Create order flow is tested.
- [ ] Payment flow is tested.
- [ ] Duplicate payment is blocked and tested.
- [ ] Stock movement behavior is tested.
- [ ] Tenant isolation is tested.
- [ ] Audit log creation is tested for critical mutations.
- [ ] Critical API responses use expected format.
- [ ] Manual QA checklist exists.
- [ ] Main restaurant flow has E2E test or manual release checklist.
- [ ] CI runs important checks.
- [ ] Tests do not use production database.
- [ ] Tests do not use production payment provider.
- [ ] Test data is predictable.
- [ ] Failing tests block risky deployment.

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
- 12-error-tracking-logs.md
- 13-monitoring-alerts.md
- 15-scaling.md
- appendices/status-transitions.md
- appendices/permission-keys.md
- appendices/api-response-format.md
- appendices/implementation-rules.md