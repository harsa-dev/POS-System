# Status Transitions

## 1. Purpose

This appendix defines valid status transitions for POS System V3.

Status transitions are used to control how business workflows move from one state to another.

The goal is to prevent invalid workflow changes such as:

```txt
WAITING_PAYMENT → READY
PAID → COMPLETED
COMPLETED → PREPARING
CANCELLED → PAID
```

A POS system must not allow random status updates.

Status is not decoration.

Status is business truth.

If status can change freely, the system becomes a haunted spreadsheet with buttons.

---

## 2. Current Context

POS System V3 currently focuses on Restaurant / F&B mode.

The main order flow is:

```txt
WAITING_CASHIER_APPROVAL
→ WAITING_PAYMENT
→ PAID
→ PREPARING
→ READY
→ SERVED
→ COMPLETED
```

Failure or terminal states:

```txt
CANCELLED
REJECTED
REFUNDED
```

Main operational roles:

```txt
OWNER
MANAGER
CASHIER
KITCHEN
SERVER
```

Core workflow:

```txt
Customer or staff creates order
↓
Cashier approves order
↓
Payment is processed
↓
Kitchen prepares order
↓
Kitchen marks order ready
↓
Server serves order
↓
Order is completed
```

Backend must enforce this workflow.

Frontend may show buttons, but backend decides what is valid.

As always, the frontend is a polite suggestion. The backend is the law.

---

## 3. Decisions

The following transition decisions are locked:

1. Status transitions must be validated in backend.
2. Frontend must not directly decide final status validity.
3. Order status must follow a state machine.
4. Payment status must be separate from order status.
5. Table status must be separate from order status.
6. Shift status must be separate from order status.
7. Terminal statuses cannot change casually.
8. `COMPLETED` is terminal.
9. `CANCELLED` is terminal unless explicit recovery flow exists.
10. `REJECTED` is terminal.
11. `REFUNDED` is terminal for normal order flow.
12. `PAID` should usually be reached through payment creation.
13. Kitchen can only process paid/preparing orders.
14. Serving can only process ready/served orders.
15. Payment mutation must update payment/order status in transaction.
16. Status transition must check current status.
17. Status transition must check next status.
18. Status transition must check role/permission.
19. Status transition must check business/tenant scope.
20. Status transition must create audit log.
21. Invalid transition must return controlled error.
22. Status update must not silently skip side effects.
23. Stock restore/deduction behavior must be explicit.
24. Completed/cancelled/refunded orders must not be edited without special rule.
25. All critical transitions must be tested.

---

## 4. Rules

### 4.1 General Transition Rules

Every status transition must check:

```txt
current status
next status
allowed transition map
actor role/permission
business scope
resource ownership
business side effects
terminal state rules
```

Backend flow:

```txt
requireAuth()
↓
requireBusinessScope()
↓
requirePermission()
↓
load current record
↓
validate transition
↓
execute transition in transaction
↓
create audit log
↓
return response
```

Rules:

1. Never update status blindly.
2. Never trust `currentStatus` from frontend.
3. Load current status from database.
4. Validate before mutation.
5. Use transaction if transition affects multiple records.
6. Create audit log for critical transitions.
7. Return consistent error for invalid transition.

Bad:

```ts
await prisma.order.update({
  where: { id },
  data: { status: input.status },
});
```

Good:

```ts
await orderService.transitionStatus({
  user,
  orderId,
  nextStatus: input.status,
});
```

Tiny difference. One is a state machine. The other is a vending machine for bugs.

---

### 4.2 Order Status Definitions

Order statuses:

```txt
WAITING_CASHIER_APPROVAL
WAITING_PAYMENT
PAID
PREPARING
READY
SERVED
COMPLETED
CANCELLED
REJECTED
REFUNDED
```

#### WAITING_CASHIER_APPROVAL

Order has been created but needs cashier approval.

Common source:

```txt
customer QR order
server-created order requiring cashier confirmation
```

Allowed next:

```txt
WAITING_PAYMENT
REJECTED
CANCELLED
```

#### WAITING_PAYMENT

Order has been approved and is waiting for payment.

Allowed next:

```txt
PAID
CANCELLED
```

#### PAID

Payment has been completed or recorded.

The order can enter kitchen workflow.

Allowed next:

```txt
PREPARING
CANCELLED
REFUNDED
```

#### PREPARING

Kitchen has started preparing the order.

Allowed next:

```txt
READY
CANCELLED
```

#### READY

Kitchen has finished preparing the order.

Order is ready to be served.

Allowed next:

```txt
SERVED
```

#### SERVED

Server has delivered the order.

Allowed next:

```txt
COMPLETED
```

#### COMPLETED

Order is fully completed.

Allowed next:

```txt
none
```

#### CANCELLED

Order is cancelled.

Allowed next:

```txt
none by default
```

#### REJECTED

Cashier rejected the order.

Allowed next:

```txt
none
```

#### REFUNDED

Order payment was refunded.

Allowed next:

```txt
none by default
```

---

### 4.3 Order Transition Map

Canonical order transition map:

```ts
export const allowedOrderTransitions = {
  WAITING_CASHIER_APPROVAL: [
    "WAITING_PAYMENT",
    "REJECTED",
    "CANCELLED",
  ],

  WAITING_PAYMENT: [
    "PAID",
    "CANCELLED",
  ],

  PAID: [
    "PREPARING",
    "CANCELLED",
    "REFUNDED",
  ],

  PREPARING: [
    "READY",
    "CANCELLED",
  ],

  READY: [
    "SERVED",
  ],

  SERVED: [
    "COMPLETED",
  ],

  COMPLETED: [],
  CANCELLED: [],
  REJECTED: [],
  REFUNDED: [],
} as const;
```

Rules:

1. Only transitions in this map are valid.
2. Any missing transition is invalid.
3. Terminal statuses have empty transition arrays.
4. Special recovery flow must be documented separately.
5. Map changes require tests and docs update.

---

### 4.4 Order Transition Permission Rules

Transition permission map:

```ts
export const orderTransitionPermissions = {
  WAITING_PAYMENT: [
    "restaurant.orders.approve",
  ],

  REJECTED: [
    "restaurant.orders.reject",
  ],

  PAID: [
    "restaurant.payments.create",
  ],

  PREPARING: [
    "restaurant.kitchen.update",
  ],

  READY: [
    "restaurant.kitchen.update",
  ],

  SERVED: [
    "restaurant.serving.update",
  ],

  COMPLETED: [
    "restaurant.serving.update",
  ],

  CANCELLED: [
    "restaurant.orders.cancel",
  ],

  REFUNDED: [
    "restaurant.payments.refund",
  ],
} as const;
```

Role examples:

```txt
OWNER:
can perform most restaurant operations

MANAGER:
can perform operational transitions

CASHIER:
can approve, cancel, and process payment

KITCHEN:
can move PAID → PREPARING → READY

SERVER:
can move READY → SERVED → COMPLETED
```

Rules:

1. Permission must be checked in backend.
2. Permission does not replace transition validation.
3. Permission does not replace tenant scope check.
4. Permission does not replace payment/stock/business rules.
5. Invalid permission returns `403 Forbidden`.
6. Invalid transition returns `INVALID_STATE_TRANSITION`.

---

### 4.5 Order Transition Side Effects

Some transitions have side effects.

#### WAITING_CASHIER_APPROVAL → WAITING_PAYMENT

Side effects:

```txt
order approved
audit log created
possibly table status updated to OCCUPIED
```

Actor:

```txt
OWNER
MANAGER
CASHIER
```

#### WAITING_CASHIER_APPROVAL → REJECTED

Side effects:

```txt
order rejected
audit log created
table may stay AVAILABLE if not occupied
stock should not be deducted if not deducted yet
```

Actor:

```txt
OWNER
MANAGER
CASHIER
```

#### WAITING_PAYMENT → PAID

This should usually happen through payment creation.

Side effects:

```txt
payment created
paymentStatus becomes PAID
order status becomes PAID
audit log created
kitchen can now see order
```

Actor:

```txt
OWNER
MANAGER
CASHIER
```

Rules:

1. Do not set order to `PAID` without payment rule.
2. Payment amount must be validated.
3. Duplicate payment must be blocked.
4. Payment/order update must use transaction.

#### PAID → PREPARING

Side effects:

```txt
kitchen starts cooking
audit log created
startedAt may be recorded
```

Actor:

```txt
OWNER
MANAGER
KITCHEN
```

#### PREPARING → READY

Side effects:

```txt
kitchen marks order ready
serving queue can now see order
audit log created
readyAt may be recorded
```

Actor:

```txt
OWNER
MANAGER
KITCHEN
```

#### READY → SERVED

Side effects:

```txt
server marks order served
audit log created
servedAt may be recorded
```

Actor:

```txt
OWNER
MANAGER
SERVER
```

#### SERVED → COMPLETED

Side effects:

```txt
order completed
table may move to CLEANING or AVAILABLE depending on table policy
analytics can count completed order
audit log created
completedAt may be recorded
```

Actor:

```txt
OWNER
MANAGER
SERVER
```

#### Any Active State → CANCELLED

Allowed from:

```txt
WAITING_CASHIER_APPROVAL
WAITING_PAYMENT
PAID
PREPARING
```

Side effects depend on current status.

Rules:

1. Cancellation reason should be required.
2. Audit log must be created.
3. Payment refund may be required if already paid.
4. Stock restore may be required if stock was deducted.
5. Table status may need update.
6. Completed order should not be cancelled without special flow.

#### PAID → REFUNDED

Side effects:

```txt
refund recorded
paymentStatus becomes REFUNDED
order status becomes REFUNDED
audit log created
stock/table side effects must be handled explicitly
```

Rules:

1. Refund requires permission.
2. Refund requires reason.
3. Refund must be audited.
4. Refund should not be a plain status update.
5. Refund must involve payment logic.

---

### 4.6 Payment Status Rules

Payment status is separate from order status.

Possible payment statuses:

```txt
UNPAID
PENDING
PAID
PARTIALLY_PAID
FAILED
REFUNDED
VOID
```

Recommended MVP statuses:

```txt
UNPAID
PAID
FAILED
REFUNDED
```

Payment transition map:

```ts
export const allowedPaymentTransitions = {
  UNPAID: [
    "PENDING",
    "PAID",
    "FAILED",
  ],

  PENDING: [
    "PAID",
    "FAILED",
  ],

  PAID: [
    "REFUNDED",
    "VOID",
  ],

  FAILED: [
    "PENDING",
    "PAID",
  ],

  REFUNDED: [],
  VOID: [],
  PARTIALLY_PAID: [
    "PAID",
    "REFUNDED",
  ],
} as const;
```

Rules:

1. Payment status must not be updated casually.
2. Payment mutation must be transaction-safe.
3. Payment provider webhook must be verified if provider exists.
4. `PAID` payment should update order to `PAID` when valid.
5. `REFUNDED` payment should update order refund state when valid.
6. Duplicate payment must be blocked.

Order status and payment status relationship:

```txt
Order WAITING_PAYMENT usually has PaymentStatus UNPAID.
Order PAID usually has PaymentStatus PAID.
Order REFUNDED usually has PaymentStatus REFUNDED.
```

But do not assume blindly.

Use backend service logic.

Because “usually” is where bugs breed quietly.

---

### 4.7 Table Status Rules

Table status is separate from order status.

Possible table statuses:

```txt
AVAILABLE
OCCUPIED
RESERVED
CLEANING
DISABLED
```

Recommended table transition map:

```ts
export const allowedTableTransitions = {
  AVAILABLE: [
    "OCCUPIED",
    "RESERVED",
    "DISABLED",
  ],

  RESERVED: [
    "OCCUPIED",
    "AVAILABLE",
    "DISABLED",
  ],

  OCCUPIED: [
    "CLEANING",
    "AVAILABLE",
  ],

  CLEANING: [
    "AVAILABLE",
    "DISABLED",
  ],

  DISABLED: [
    "AVAILABLE",
  ],
} as const;
```

Order-related table side effects:

```txt
order created/approved for dine-in:
AVAILABLE → OCCUPIED

order completed:
OCCUPIED → CLEANING or AVAILABLE

table cleaned:
CLEANING → AVAILABLE

order cancelled before paid:
may return OCCUPIED → AVAILABLE depending on table policy
```

Rules:

1. Table status update must be scoped by restaurant/business.
2. Table status update must be audited when important.
3. Table status must not be controlled by frontend only.
4. Table cannot be assigned to two active dine-in orders unless policy allows it.
5. Table policy must be explicit.

---

### 4.8 Shift Status Rules

Cashier shift status should be controlled.

Possible shift statuses:

```txt
OPEN
CLOSED
CANCELLED
```

Transition map:

```ts
export const allowedShiftTransitions = {
  OPEN: [
    "CLOSED",
    "CANCELLED",
  ],

  CLOSED: [],
  CANCELLED: [],
} as const;
```

Rules:

1. Cashier cannot open multiple active shifts unless policy allows it.
2. Payment should usually require open shift for cashier.
3. Closing shift should record expected cash and actual cash.
4. Closed shift must not be edited casually.
5. Shift close must create audit log.

Shift side effects:

```txt
OPEN:
cashier can process cash payment

CLOSED:
cashier can no longer add transactions to that shift

CANCELLED:
shift invalidated with reason
```

---

### 4.9 Inventory Movement Rules

Inventory movement is not exactly a status transition, but it controls stock state.

Movement types may include:

```txt
RESTOCK
SALE
WASTE
CORRECTION
RETURN
CANCEL_RESTORE
TRANSFER_IN
TRANSFER_OUT
```

Rules:

1. Stock quantity must not change without stock movement.
2. Movement type must be valid.
3. Movement quantity must be validated.
4. Movement actor must come from backend current user.
5. Movement must be scoped by business.
6. Critical movement must be audited.
7. Negative stock policy must be explicit.

Stock mutation flow:

```txt
validate permission
↓
load inventory item with scope
↓
validate quantity and movement type
↓
create stock movement
↓
update stock quantity
↓
create audit log
```

Do not do this:

```ts
await prisma.inventoryItem.update({
  where: { id },
  data: { quantity: newQuantity },
});
```

without movement record.

That is not inventory tracking. That is pretending.

---

### 4.10 Terminal State Rules

Terminal states:

```txt
COMPLETED
CANCELLED
REJECTED
REFUNDED
CLOSED
VOID
```

Rules:

1. Terminal states cannot transition by default.
2. Editing terminal records requires explicit special flow.
3. Special flow must require high permission.
4. Special flow must require reason.
5. Special flow must create audit log.
6. Special flow must not silently rewrite history.

Examples of special flow:

```txt
refund completed order
void invoice
correct inventory after mistake
reopen shift by owner
```

Do not make terminal states editable from normal update form.

That is how history becomes fan fiction.

---

### 4.11 Error Rules

Invalid transition should return:

```json
{
  "success": false,
  "message": "Invalid status transition.",
  "code": "INVALID_STATE_TRANSITION"
}
```

Forbidden transition should return:

```json
{
  "success": false,
  "message": "You do not have permission to perform this action.",
  "code": "FORBIDDEN"
}
```

Unauthorized transition should return:

```json
{
  "success": false,
  "message": "Unauthorized.",
  "code": "UNAUTHORIZED"
}
```

Conflict example:

```json
{
  "success": false,
  "message": "Order has already been paid.",
  "code": "DUPLICATE_PAYMENT"
}
```

Rules:

1. Use `400` for invalid transition if request is structurally valid but business-invalid.
2. Use `401` for unauthenticated.
3. Use `403` for authenticated but forbidden.
4. Use `404` when scoped resource is not found.
5. Use `409` for conflict such as duplicate payment.
6. Keep error code consistent.

---

## 5. Implementation Guide

### 5.1 Transition Validator

Example generic validator:

```ts
type TransitionMap<TStatus extends string> = Record<TStatus, readonly TStatus[]>;

export function canTransition<TStatus extends string>({
  transitionMap,
  currentStatus,
  nextStatus,
}: {
  transitionMap: TransitionMap<TStatus>;
  currentStatus: TStatus;
  nextStatus: TStatus;
}) {
  return transitionMap[currentStatus]?.includes(nextStatus) ?? false;
}
```

Usage:

```ts
const isAllowed = canTransition({
  transitionMap: allowedOrderTransitions,
  currentStatus: order.status,
  nextStatus: input.status,
});

if (!isAllowed) {
  throw new AppError({
    statusCode: 400,
    code: "INVALID_STATE_TRANSITION",
    message: `Invalid status transition: ${order.status} to ${input.status}`,
  });
}
```

### 5.2 Order Transition Service

Example service concept:

```ts
export async function transitionOrderStatus({
  user,
  orderId,
  nextStatus,
  reason,
}: {
  user: CurrentUser;
  orderId: string;
  nextStatus: OrderStatus;
  reason?: string;
}) {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      restaurantId: user.restaurantId,
    },
  });

  if (!order) {
    throw new AppError({
      statusCode: 404,
      code: "ORDER_NOT_FOUND",
      message: "Order not found.",
    });
  }

  validateOrderTransition({
    user,
    order,
    nextStatus,
  });

  return prisma.$transaction(async (tx) => {
    const updatedOrder = await tx.order.update({
      where: {
        id: order.id,
      },
      data: {
        status: nextStatus,
      },
    });

    await tx.auditLog.create({
      data: {
        restaurantId: user.restaurantId,
        actorUserId: user.id,
        action: "ORDER_STATUS_UPDATED",
        entityType: "Order",
        entityId: order.id,
        metadata: {
          from: order.status,
          to: nextStatus,
          reason,
        },
      },
    });

    return updatedOrder;
  });
}
```

Important:

```txt
Use findFirst with scope.
Do not use findUnique by id only for tenant-owned resource.
```

### 5.3 Order Transition Validation

Example:

```ts
export function validateOrderTransition({
  user,
  order,
  nextStatus,
}: {
  user: CurrentUser;
  order: Order;
  nextStatus: OrderStatus;
}) {
  const allowedNextStatuses = allowedOrderTransitions[order.status];

  if (!allowedNextStatuses.includes(nextStatus)) {
    throw new AppError({
      statusCode: 400,
      code: "INVALID_STATE_TRANSITION",
      message: "Invalid status transition.",
    });
  }

  const requiredPermissions = orderTransitionPermissions[nextStatus] ?? [];

  const hasRequiredPermission = requiredPermissions.some((permission) =>
    hasPermission(user, permission),
  );

  if (!hasRequiredPermission) {
    throw new AppError({
      statusCode: 403,
      code: "FORBIDDEN",
      message: "You do not have permission to perform this action.",
    });
  }
}
```

### 5.4 Payment-Driven Order Transition

Payment should not be plain status update.

Payment flow:

```txt
require payment permission
↓
load order with scope
↓
validate order is WAITING_PAYMENT
↓
validate amount
↓
prevent duplicate payment
↓
transaction:
  create payment
  update order paymentStatus to PAID
  update order status to PAID
  create audit log
```

Concept:

```ts
await prisma.$transaction(async (tx) => {
  const payment = await tx.payment.create({
    data: {
      orderId: order.id,
      restaurantId: user.restaurantId,
      amount: order.totalAmount,
      method: input.method,
      status: "PAID",
      createdById: user.id,
    },
  });

  const updatedOrder = await tx.order.update({
    where: {
      id: order.id,
    },
    data: {
      paymentStatus: "PAID",
      status: "PAID",
    },
  });

  await tx.auditLog.create({
    data: {
      restaurantId: user.restaurantId,
      actorUserId: user.id,
      action: "PAYMENT_CREATED",
      entityType: "Payment",
      entityId: payment.id,
      metadata: {
        orderId: order.id,
        amount: order.totalAmount,
      },
    },
  });

  return { payment, order: updatedOrder };
});
```

### 5.5 Cancellation Flow

Cancellation should require:

```txt
permission
reason
current status check
stock/payment/table side effect handling
audit log
```

Cancellation behavior by current status:

```txt
WAITING_CASHIER_APPROVAL:
reject/cancel without payment effect

WAITING_PAYMENT:
cancel without refund

PAID:
cancel may require refund or manager approval

PREPARING:
cancel may require stock/waste handling

READY:
usually should not cancel without manager/owner reason

SERVED:
should not cancel; use refund/adjustment flow

COMPLETED:
should not cancel; use refund/adjustment flow
```

Rules:

1. Do not use one simple cancel button for every status.
2. Cancellation after payment is not the same as cancellation before payment.
3. Cancellation after kitchen starts may affect stock/waste.
4. Cancellation must be audited.

### 5.6 Refund Flow

Refund should not be simple order status update.

Refund flow:

```txt
require refund permission
↓
load payment/order with scope
↓
validate refundable state
↓
validate amount
↓
provider refund if applicable
↓
transaction:
  create refund record or update payment
  update payment status
  update order status if full refund
  create audit log
```

Rules:

1. Refund requires reason.
2. Refund requires audit.
3. Refund may be full or partial later.
4. MVP may support only full refund.
5. Payment provider result must be verified.

### 5.7 Status Transition Test Examples

Unit tests:

```ts
import { describe, expect, it } from "vitest";
import { canTransition } from "./status-transition";
import { allowedOrderTransitions } from "./order-status";

describe("order status transitions", () => {
  it("allows WAITING_PAYMENT to PAID", () => {
    expect(
      canTransition({
        transitionMap: allowedOrderTransitions,
        currentStatus: "WAITING_PAYMENT",
        nextStatus: "PAID",
      }),
    ).toBe(true);
  });

  it("blocks WAITING_PAYMENT to READY", () => {
    expect(
      canTransition({
        transitionMap: allowedOrderTransitions,
        currentStatus: "WAITING_PAYMENT",
        nextStatus: "READY",
      }),
    ).toBe(false);
  });

  it("blocks COMPLETED to PAID", () => {
    expect(
      canTransition({
        transitionMap: allowedOrderTransitions,
        currentStatus: "COMPLETED",
        nextStatus: "PAID",
      }),
    ).toBe(false);
  });

  it("blocks CANCELLED to PAID", () => {
    expect(
      canTransition({
        transitionMap: allowedOrderTransitions,
        currentStatus: "CANCELLED",
        nextStatus: "PAID",
      }),
    ).toBe(false);
  });
});
```

Integration tests:

```txt
KITCHEN can move PAID → PREPARING
KITCHEN can move PREPARING → READY
KITCHEN cannot move WAITING_PAYMENT → PAID
SERVER can move READY → SERVED
SERVER cannot move PAID → READY
CASHIER can move WAITING_PAYMENT → PAID through payment flow
CASHIER cannot move PAID → READY
COMPLETED cannot be changed
CANCELLED cannot be changed
```

---

## 6. Anti-Patterns

Do not:

- Update status directly from request body
- Trust frontend current status
- Trust frontend role
- Skip tenant scope check
- Skip permission check
- Skip transition map validation
- Put transition logic inside random UI component
- Let every role update every status
- Let kitchen process payment
- Let cashier mark order READY
- Let server mark unpaid order SERVED
- Let completed order move backward
- Let cancelled order become paid again
- Treat refund as plain order status update
- Treat payment as plain order status update
- Cancel paid order without refund logic
- Change stock without stock movement
- Change table status without policy
- Hide invalid buttons in frontend and call it secure
- Forget audit logs
- Forget tests for transitions
- Add new status without updating transition map
- Add new transition without updating tests
- Add new status without checking analytics/report impact

---

## 7. Checklist

Status transition system is acceptable when:

- [ ] Order status transition map exists.
- [ ] Payment status transition map exists.
- [ ] Table status transition map exists if tables are used.
- [ ] Shift status transition map exists if shifts are used.
- [ ] Backend validates current status.
- [ ] Backend validates next status.
- [ ] Backend validates permission.
- [ ] Backend validates business scope.
- [ ] Backend handles transition side effects.
- [ ] Payment-driven `PAID` transition uses payment service.
- [ ] Refund flow is separate from plain status update.
- [ ] Cancellation flow handles current status differences.
- [ ] Terminal statuses are protected.
- [ ] Invalid transition returns consistent error.
- [ ] Critical transitions create audit logs.
- [ ] Transition logic is centralized.
- [ ] Transition tests exist.
- [ ] UI only shows valid actions but backend still enforces rules.
- [ ] New statuses require docs, tests, and service update.

---

## 8. References

Related documents:

- 01-system-design.md
- 02-system-architecture.md
- 04-backend-api.md
- 05-database-storage.md
- 06-auth-permissions.md
- 09-security.md
- 14-testing.md
- appendices/permission-keys.md
- appendices/error-codes.md
- appendices/api-response-format.md
- appendices/implementation-rules.md