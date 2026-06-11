# Error Codes

## 1. Purpose

This appendix defines the standard error codes for POS System V3.

Error codes are machine-readable identifiers used by backend, frontend, logs, error tracking, monitoring, support tools, and tests.

The goal is to make API failures consistent, searchable, debuggable, and safe to show to users.

Bad error response:

```json
{
  "message": "Something went wrong"
}
```

Better error response:

```json
{
  "success": false,
  "message": "Invalid order status transition.",
  "code": "INVALID_STATE_TRANSITION",
  "requestId": "req_abc123"
}
```

A good error code tells the frontend what happened without exposing sensitive internal details.

Because apparently “server exploded somewhere” is not a debugging strategy. Tragic.

---

## 2. Current Context

POS System V3 includes many business-critical areas:

```txt
auth
permissions
tenant isolation
orders
payments
kitchen
serving
tables
inventory
stock movements
settings
analytics
reports
billing future
files/storage
rate limiting
webhooks future
```

Each area can fail in different ways.

Examples:

```txt
user is not logged in
user lacks permission
request body is invalid
tenant data is not found
order status transition is invalid
payment already exists
stock is insufficient
report export is too large
rate limit is triggered
database is unavailable
external provider fails
```

Without standardized error codes, frontend and support logic becomes messy.

The system must avoid random errors like:

```txt
BAD_REQUEST
ERROR
FAILED
NOPE
NOT_ALLOWED_BRO
```

The last one is emotionally honest, but still not architecture.

---

## 3. Decisions

The following error code decisions are locked:

1. Error codes must be uppercase snake case.
2. Error codes must be stable.
3. Error codes must be documented.
4. Error codes must be safe to expose to frontend.
5. Error messages must be human-readable.
6. Error codes must be machine-readable.
7. Error response format must be consistent.
8. Expected business errors must not be treated as unknown crashes.
9. Unexpected system errors must use `INTERNAL_SERVER_ERROR`.
10. Auth errors must distinguish unauthenticated and forbidden access.
11. Tenant isolation failures must not leak private data.
12. Validation errors must use `VALIDATION_ERROR` or specific validation codes.
13. Invalid business transitions must use specific business error codes.
14. Payment errors must not expose provider secrets.
15. Rate limit errors must use `RATE_LIMITED`.
16. Duplicate operations should use conflict codes.
17. Not found errors should use resource-specific codes when useful.
18. Frontend must not depend on raw error message for logic.
19. Tests may assert error codes.
20. Logs should include error code.
21. Error tracking should include error code.
22. Monitoring may group by error code.
23. Support tools may search by error code.
24. Error code changes must be treated carefully.
25. Error codes must not reveal sensitive implementation details.

---

## 4. Rules

### 4.1 Naming Rules

Error code format:

```txt
UPPERCASE_SNAKE_CASE
```

Examples:

```txt
UNAUTHORIZED
FORBIDDEN
VALIDATION_ERROR
ORDER_NOT_FOUND
INVALID_STATE_TRANSITION
DUPLICATE_PAYMENT
INSUFFICIENT_STOCK
RATE_LIMITED
INTERNAL_SERVER_ERROR
```

Rules:

1. Use uppercase letters.
2. Use underscores.
3. Keep names clear.
4. Avoid vague codes.
5. Avoid jokes in actual error code.
6. Avoid leaking internal technology names when not needed.
7. Do not rename existing error codes casually.

Bad:

```txt
error
failed
badThing
prisma_failed_lol
userDidBad
```

Good:

```txt
DATABASE_ERROR
ORDER_NOT_FOUND
PAYMENT_AMOUNT_MISMATCH
TENANT_ACCESS_DENIED
```

### 4.2 HTTP Status Mapping Rules

Error codes must map to appropriate HTTP status.

Common mapping:

```txt
400 Bad Request:
request is invalid or business rule rejected

401 Unauthorized:
user is not authenticated or session is invalid

403 Forbidden:
user is authenticated but not allowed

404 Not Found:
resource does not exist or is hidden by tenant scope

409 Conflict:
request conflicts with current state

422 Unprocessable Entity:
optional for semantic validation errors

429 Too Many Requests:
rate limit triggered

500 Internal Server Error:
unexpected server error

502 Bad Gateway:
external provider/service error

503 Service Unavailable:
system dependency temporarily unavailable
```

Rules:

1. Use `401` for unauthenticated.
2. Use `403` for authenticated but not allowed.
3. Use `404` for missing or tenant-hidden resources.
4. Use `409` for duplicate/conflict state.
5. Use `429` for rate limit.
6. Use `500` only for unexpected server failures.
7. Do not return `200` for failed operation.
8. Do not expose stack traces in production response.

### 4.3 Standard Error Response Rules

Standard error response:

```json
{
  "success": false,
  "message": "Human-readable safe message.",
  "code": "ERROR_CODE",
  "requestId": "req_abc123"
}
```

Optional safe details:

```json
{
  "success": false,
  "message": "Validation failed.",
  "code": "VALIDATION_ERROR",
  "details": {
    "fieldErrors": {
      "email": ["Invalid email address."]
    }
  },
  "requestId": "req_abc123"
}
```

Rules:

1. `success` must be `false`.
2. `message` must be safe for user.
3. `code` must be stable and documented.
4. `requestId` should be included when available.
5. `details` must not contain secrets.
6. `details` should be optional.
7. Frontend logic should use `code`, not message.

### 4.4 Message Safety Rules

Messages shown to user must not expose:

```txt
stack trace
database query
database URL
server file path
provider secret
environment variable
raw SQL error
session token
password hash
private system details
```

Bad:

```json
{
  "success": false,
  "message": "PrismaClientKnownRequestError: relation users does not exist at /var/task/src/app/api/auth/login/route.ts:48",
  "code": "DATABASE_ERROR"
}
```

Good:

```json
{
  "success": false,
  "message": "Unable to process request.",
  "code": "DATABASE_ERROR"
}
```

Internal details belong in logs and error tracking.

Not in the browser, where chaos enthusiasts can read them.

### 4.5 Expected vs Unexpected Error Rules

Expected errors:

```txt
validation failed
not authenticated
forbidden
resource not found
invalid transition
duplicate payment
insufficient stock
rate limited
```

Unexpected errors:

```txt
unhandled exception
database unavailable
unknown runtime error
external provider timeout
storage provider failure
```

Rules:

1. Expected errors use specific error codes.
2. Unexpected errors use safe generic response.
3. Unexpected errors are logged as `error`.
4. Expected business errors may be logged as `warn` or not logged depending on context.
5. Validation errors should not flood Sentry as critical errors.

---

## 5. Implementation Guide

### 5.1 Error Categories

Main categories:

```txt
general
auth
authorization
tenant/scope
validation
resource
order
payment
inventory
table
shift
settings
reports
rate limiting
file/storage
webhook
external provider
database/system
billing future
```

Each category should have clear codes.

---

### 5.2 General Error Codes

```txt
BAD_REQUEST
VALIDATION_ERROR
NOT_FOUND
CONFLICT
INTERNAL_SERVER_ERROR
SERVICE_UNAVAILABLE
METHOD_NOT_ALLOWED
```

#### BAD_REQUEST

HTTP:

```txt
400
```

Use when:

```txt
request is malformed or invalid generally
```

Example:

```json
{
  "success": false,
  "message": "Bad request.",
  "code": "BAD_REQUEST"
}
```

#### VALIDATION_ERROR

HTTP:

```txt
400
```

Use when:

```txt
request body, query, or params fail validation
```

Example:

```json
{
  "success": false,
  "message": "Validation failed.",
  "code": "VALIDATION_ERROR"
}
```

#### NOT_FOUND

HTTP:

```txt
404
```

Use when:

```txt
generic resource is not found
```

Prefer resource-specific code when useful.

#### CONFLICT

HTTP:

```txt
409
```

Use when:

```txt
request conflicts with current state
```

#### INTERNAL_SERVER_ERROR

HTTP:

```txt
500
```

Use when:

```txt
unexpected server error occurs
```

#### SERVICE_UNAVAILABLE

HTTP:

```txt
503
```

Use when:

```txt
service dependency is temporarily unavailable
```

#### METHOD_NOT_ALLOWED

HTTP:

```txt
405
```

Use when:

```txt
HTTP method is not supported by route
```

---

### 5.3 Auth Error Codes

```txt
UNAUTHORIZED
INVALID_CREDENTIALS
SESSION_EXPIRED
SESSION_INVALID
USER_INACTIVE
EMAIL_ALREADY_EXISTS
PASSWORD_TOO_WEAK
PASSWORD_RESET_TOKEN_INVALID
PASSWORD_RESET_TOKEN_EXPIRED
```

#### UNAUTHORIZED

HTTP:

```txt
401
```

Use when:

```txt
user is not authenticated
```

Response:

```json
{
  "success": false,
  "message": "Unauthorized.",
  "code": "UNAUTHORIZED"
}
```

#### INVALID_CREDENTIALS

HTTP:

```txt
401
```

Use when:

```txt
login email/password is invalid
```

Message should be generic:

```json
{
  "success": false,
  "message": "Invalid email or password.",
  "code": "INVALID_CREDENTIALS"
}
```

Do not reveal whether email exists.

#### SESSION_EXPIRED

HTTP:

```txt
401
```

Use when:

```txt
session existed but has expired
```

#### SESSION_INVALID

HTTP:

```txt
401
```

Use when:

```txt
session token is missing, malformed, revoked, or invalid
```

#### USER_INACTIVE

HTTP:

```txt
403
```

Use when:

```txt
user exists but is disabled/inactive
```

#### EMAIL_ALREADY_EXISTS

HTTP:

```txt
409
```

Use when:

```txt
registering with existing email
```

#### PASSWORD_TOO_WEAK

HTTP:

```txt
400
```

Use when:

```txt
new password does not meet password rules
```

#### PASSWORD_RESET_TOKEN_INVALID

HTTP:

```txt
400
```

Use when:

```txt
reset token is invalid
```

#### PASSWORD_RESET_TOKEN_EXPIRED

HTTP:

```txt
400
```

Use when:

```txt
reset token is expired
```

---

### 5.4 Authorization Error Codes

```txt
FORBIDDEN
MISSING_PERMISSION
MODE_ACCESS_DENIED
PLAN_UPGRADE_REQUIRED
QUOTA_EXCEEDED
PLATFORM_ACCESS_REQUIRED
```

#### FORBIDDEN

HTTP:

```txt
403
```

Use when:

```txt
authenticated user is not allowed to perform action
```

#### MISSING_PERMISSION

HTTP:

```txt
403
```

Use when:

```txt
specific permission is required
```

Example:

```json
{
  "success": false,
  "message": "You do not have permission to perform this action.",
  "code": "MISSING_PERMISSION"
}
```

#### MODE_ACCESS_DENIED

HTTP:

```txt
403
```

Use when:

```txt
user/business does not have access to requested business mode
```

#### PLAN_UPGRADE_REQUIRED

HTTP:

```txt
403
```

Use when:

```txt
user has role permission but subscription plan does not allow feature
```

#### QUOTA_EXCEEDED

HTTP:

```txt
403
```

or:

```txt
429
```

Use `403` when plan quota blocks feature.

Use `429` when request rate limit is exceeded.

#### PLATFORM_ACCESS_REQUIRED

HTTP:

```txt
403
```

Use when:

```txt
platform admin permission is required
```

---

### 5.5 Tenant and Scope Error Codes

```txt
TENANT_NOT_FOUND
TENANT_ACCESS_DENIED
BUSINESS_NOT_FOUND
BUSINESS_SCOPE_REQUIRED
RESTAURANT_NOT_FOUND
RESTAURANT_ACCESS_DENIED
```

#### TENANT_ACCESS_DENIED

HTTP:

```txt
404 or 403
```

Use when:

```txt
resource exists but belongs to another tenant
```

Recommended external response:

```txt
404
```

to avoid revealing resource existence.

#### BUSINESS_SCOPE_REQUIRED

HTTP:

```txt
400
```

Use when:

```txt
request cannot be processed because user/business scope is missing
```

#### RESTAURANT_NOT_FOUND

HTTP:

```txt
404
```

Use when:

```txt
restaurant/business does not exist or is unavailable
```

Rules:

1. Do not leak whether another tenant’s resource exists.
2. Scope must come from backend user/session.
3. Frontend-provided tenant ID must not be trusted.

---

### 5.6 Resource Error Codes

Generic resource codes:

```txt
RESOURCE_NOT_FOUND
RESOURCE_ALREADY_EXISTS
RESOURCE_ARCHIVED
RESOURCE_IN_USE
RESOURCE_LOCKED
```

#### RESOURCE_NOT_FOUND

HTTP:

```txt
404
```

Use for generic missing resource.

#### RESOURCE_ALREADY_EXISTS

HTTP:

```txt
409
```

Use for duplicate unique resource.

#### RESOURCE_ARCHIVED

HTTP:

```txt
409
```

Use when:

```txt
resource exists but cannot be modified because it is archived
```

#### RESOURCE_IN_USE

HTTP:

```txt
409
```

Use when:

```txt
resource cannot be deleted because it is referenced
```

Example:

```txt
category cannot be deleted because menu items still use it
```

#### RESOURCE_LOCKED

HTTP:

```txt
409
```

Use when:

```txt
resource is locked by workflow/state
```

---

### 5.7 Order Error Codes

```txt
ORDER_NOT_FOUND
ORDER_ITEM_NOT_FOUND
ORDER_EMPTY
ORDER_ALREADY_PAID
ORDER_ALREADY_CANCELLED
ORDER_ALREADY_COMPLETED
ORDER_NOT_PAYABLE
ORDER_NOT_CANCELLABLE
ORDER_NOT_REFUNDABLE
INVALID_ORDER_STATUS
INVALID_STATE_TRANSITION
INVALID_ORDER_TOTAL
ORDER_CREATE_FAILED
ORDER_UPDATE_FAILED
ORDER_STATUS_UPDATE_FAILED
```

#### ORDER_NOT_FOUND

HTTP:

```txt
404
```

Use when:

```txt
order does not exist or is outside business scope
```

#### ORDER_EMPTY

HTTP:

```txt
400
```

Use when:

```txt
order has no items
```

#### ORDER_ALREADY_PAID

HTTP:

```txt
409
```

Use when:

```txt
payment is attempted for already paid order
```

#### ORDER_ALREADY_CANCELLED

HTTP:

```txt
409
```

Use when:

```txt
mutation is attempted on cancelled order
```

#### ORDER_ALREADY_COMPLETED

HTTP:

```txt
409
```

Use when:

```txt
normal mutation is attempted on completed order
```

#### ORDER_NOT_PAYABLE

HTTP:

```txt
409
```

Use when:

```txt
order is not in payable state
```

#### ORDER_NOT_CANCELLABLE

HTTP:

```txt
409
```

Use when:

```txt
order cannot be cancelled from current status
```

#### ORDER_NOT_REFUNDABLE

HTTP:

```txt
409
```

Use when:

```txt
refund is not allowed for current order/payment state
```

#### INVALID_ORDER_STATUS

HTTP:

```txt
400
```

Use when:

```txt
provided order status is not valid enum value
```

#### INVALID_STATE_TRANSITION

HTTP:

```txt
400
```

Use when:

```txt
current order status cannot move to requested next status
```

#### INVALID_ORDER_TOTAL

HTTP:

```txt
400
```

Use when:

```txt
calculated total is invalid or mismatch is detected
```

---

### 5.8 Payment Error Codes

```txt
PAYMENT_NOT_FOUND
PAYMENT_ALREADY_EXISTS
DUPLICATE_PAYMENT
PAYMENT_AMOUNT_MISMATCH
PAYMENT_METHOD_DISABLED
PAYMENT_METHOD_INVALID
PAYMENT_NOT_ALLOWED
PAYMENT_FAILED
PAYMENT_PROVIDER_ERROR
PAYMENT_WEBHOOK_INVALID
PAYMENT_WEBHOOK_SIGNATURE_INVALID
PAYMENT_NOT_REFUNDABLE
REFUND_FAILED
REFUND_AMOUNT_INVALID
```

#### PAYMENT_NOT_FOUND

HTTP:

```txt
404
```

Use when:

```txt
payment does not exist or is outside business scope
```

#### PAYMENT_ALREADY_EXISTS

HTTP:

```txt
409
```

Use when:

```txt
order already has payment record
```

#### DUPLICATE_PAYMENT

HTTP:

```txt
409
```

Use when:

```txt
duplicate payment attempt is blocked
```

#### PAYMENT_AMOUNT_MISMATCH

HTTP:

```txt
400
```

Use when:

```txt
submitted amount does not match expected amount
```

#### PAYMENT_METHOD_DISABLED

HTTP:

```txt
403
```

Use when:

```txt
payment method is disabled in business settings
```

#### PAYMENT_METHOD_INVALID

HTTP:

```txt
400
```

Use when:

```txt
unknown or unsupported payment method is submitted
```

#### PAYMENT_NOT_ALLOWED

HTTP:

```txt
403 or 409
```

Use:

```txt
403:
user lacks permission

409:
order/payment state does not allow payment
```

#### PAYMENT_FAILED

HTTP:

```txt
400 or 502
```

Use when:

```txt
payment processing failed
```

Use `502` if external provider failed.

#### PAYMENT_PROVIDER_ERROR

HTTP:

```txt
502
```

Use when:

```txt
payment provider fails or returns unexpected response
```

#### PAYMENT_WEBHOOK_SIGNATURE_INVALID

HTTP:

```txt
401 or 400
```

Use when:

```txt
webhook signature verification fails
```

#### PAYMENT_NOT_REFUNDABLE

HTTP:

```txt
409
```

Use when:

```txt
payment cannot be refunded from current status
```

#### REFUND_FAILED

HTTP:

```txt
400 or 502
```

Use when:

```txt
refund fails locally or at provider
```

---

### 5.9 Inventory Error Codes

```txt
INVENTORY_ITEM_NOT_FOUND
INVENTORY_ITEM_INACTIVE
INSUFFICIENT_STOCK
INVALID_STOCK_QUANTITY
INVALID_STOCK_MOVEMENT_TYPE
STOCK_MOVEMENT_FAILED
STOCK_MOVEMENT_REQUIRED
NEGATIVE_STOCK_NOT_ALLOWED
RECIPE_NOT_FOUND
RECIPE_INVALID
```

#### INVENTORY_ITEM_NOT_FOUND

HTTP:

```txt
404
```

Use when:

```txt
inventory item does not exist or is outside business scope
```

#### INVENTORY_ITEM_INACTIVE

HTTP:

```txt
409
```

Use when:

```txt
item cannot be used because inactive
```

#### INSUFFICIENT_STOCK

HTTP:

```txt
409
```

Use when:

```txt
stock is not enough for requested operation
```

#### INVALID_STOCK_QUANTITY

HTTP:

```txt
400
```

Use when:

```txt
quantity is invalid, negative, zero when not allowed, or malformed
```

#### INVALID_STOCK_MOVEMENT_TYPE

HTTP:

```txt
400
```

Use when:

```txt
movement type is not supported
```

#### STOCK_MOVEMENT_REQUIRED

HTTP:

```txt
500 or 409
```

Use when:

```txt
stock change attempted without movement record
```

This should generally indicate backend bug.

#### NEGATIVE_STOCK_NOT_ALLOWED

HTTP:

```txt
409
```

Use when:

```txt
operation would make stock negative and policy forbids it
```

#### RECIPE_NOT_FOUND

HTTP:

```txt
404
```

Use when:

```txt
recipe required for menu item but not found
```

#### RECIPE_INVALID

HTTP:

```txt
400 or 409
```

Use when:

```txt
recipe configuration is invalid
```

---

### 5.10 Kitchen and Serving Error Codes

```txt
KITCHEN_ORDER_NOT_FOUND
KITCHEN_STATUS_INVALID
KITCHEN_UPDATE_NOT_ALLOWED
SERVING_ORDER_NOT_FOUND
SERVING_STATUS_INVALID
SERVING_UPDATE_NOT_ALLOWED
```

#### KITCHEN_ORDER_NOT_FOUND

HTTP:

```txt
404
```

Use when:

```txt
requested order is not available for kitchen workflow
```

#### KITCHEN_UPDATE_NOT_ALLOWED

HTTP:

```txt
403 or 409
```

Use:

```txt
403:
user lacks permission

409:
order state does not allow kitchen update
```

#### SERVING_ORDER_NOT_FOUND

HTTP:

```txt
404
```

Use when:

```txt
requested order is not available for serving workflow
```

#### SERVING_UPDATE_NOT_ALLOWED

HTTP:

```txt
403 or 409
```

Use:

```txt
403:
user lacks permission

409:
order state does not allow serving update
```

---

### 5.11 Table Error Codes

```txt
TABLE_NOT_FOUND
TABLE_NOT_AVAILABLE
TABLE_ALREADY_OCCUPIED
TABLE_STATUS_INVALID
TABLE_STATUS_UPDATE_FAILED
TABLE_IN_USE
```

#### TABLE_NOT_FOUND

HTTP:

```txt
404
```

Use when:

```txt
table does not exist or is outside business scope
```

#### TABLE_NOT_AVAILABLE

HTTP:

```txt
409
```

Use when:

```txt
table cannot be used for new order
```

#### TABLE_ALREADY_OCCUPIED

HTTP:

```txt
409
```

Use when:

```txt
table already has active order and policy does not allow another
```

#### TABLE_IN_USE

HTTP:

```txt
409
```

Use when:

```txt
table cannot be deleted because active orders reference it
```

---

### 5.12 Shift Error Codes

```txt
SHIFT_NOT_FOUND
SHIFT_ALREADY_OPEN
SHIFT_NOT_OPEN
SHIFT_ALREADY_CLOSED
SHIFT_CLOSE_FAILED
SHIFT_CASH_MISMATCH
```

#### SHIFT_ALREADY_OPEN

HTTP:

```txt
409
```

Use when:

```txt
cashier already has open shift and policy allows only one
```

#### SHIFT_NOT_OPEN

HTTP:

```txt
409
```

Use when:

```txt
operation requires open shift
```

Example:

```txt
cash payment requires open cashier shift
```

#### SHIFT_ALREADY_CLOSED

HTTP:

```txt
409
```

Use when:

```txt
mutation is attempted on closed shift
```

#### SHIFT_CASH_MISMATCH

HTTP:

```txt
409 or 400
```

Use when:

```txt
cash closing amount does not match expected value and policy requires confirmation
```

---

### 5.13 Menu and Product Error Codes

```txt
MENU_ITEM_NOT_FOUND
MENU_ITEM_UNAVAILABLE
MENU_ITEM_IN_USE
MENU_CATEGORY_NOT_FOUND
MENU_CATEGORY_IN_USE
PRICE_INVALID
```

#### MENU_ITEM_NOT_FOUND

HTTP:

```txt
404
```

Use when:

```txt
menu item does not exist or is outside business scope
```

#### MENU_ITEM_UNAVAILABLE

HTTP:

```txt
409
```

Use when:

```txt
menu item cannot be ordered because unavailable
```

#### MENU_ITEM_IN_USE

HTTP:

```txt
409
```

Use when:

```txt
menu item cannot be deleted because historical orders reference it
```

#### PRICE_INVALID

HTTP:

```txt
400
```

Use when:

```txt
price is negative, zero when not allowed, or invalid format
```

---

### 5.14 Settings Error Codes

```txt
SETTINGS_NOT_FOUND
SETTINGS_UPDATE_FAILED
INVALID_TAX_RATE
INVALID_SERVICE_CHARGE_RATE
INVALID_CURRENCY
PAYMENT_METHOD_CONFIG_INVALID
```

#### SETTINGS_NOT_FOUND

HTTP:

```txt
404
```

Use when:

```txt
business settings do not exist
```

#### INVALID_TAX_RATE

HTTP:

```txt
400
```

Use when:

```txt
tax rate is outside allowed range
```

#### INVALID_SERVICE_CHARGE_RATE

HTTP:

```txt
400
```

Use when:

```txt
service charge rate is outside allowed range
```

#### INVALID_CURRENCY

HTTP:

```txt
400
```

Use when:

```txt
currency code is unsupported
```

---

### 5.15 Reports and Analytics Error Codes

```txt
REPORT_NOT_FOUND
REPORT_EXPORT_FAILED
REPORT_DATE_RANGE_INVALID
REPORT_TOO_LARGE
ANALYTICS_QUERY_FAILED
ANALYTICS_DATE_RANGE_INVALID
```

#### REPORT_EXPORT_FAILED

HTTP:

```txt
500
```

Use when:

```txt
report generation/export fails unexpectedly
```

#### REPORT_DATE_RANGE_INVALID

HTTP:

```txt
400
```

Use when:

```txt
from/to date range is invalid
```

#### REPORT_TOO_LARGE

HTTP:

```txt
400 or 413
```

Use when:

```txt
requested export is too large
```

#### ANALYTICS_QUERY_FAILED

HTTP:

```txt
500
```

Use when:

```txt
analytics calculation fails unexpectedly
```

---

### 5.16 Rate Limiting Error Codes

```txt
RATE_LIMITED
TOO_MANY_LOGIN_ATTEMPTS
TOO_MANY_PASSWORD_RESET_REQUESTS
TOO_MANY_ORDER_REQUESTS
TOO_MANY_PAYMENT_ATTEMPTS
TOO_MANY_REPORT_EXPORTS
```

#### RATE_LIMITED

HTTP:

```txt
429
```

Generic rate limit response:

```json
{
  "success": false,
  "message": "Too many requests. Please try again later.",
  "code": "RATE_LIMITED"
}
```

Use specific codes when frontend needs specific UI.

Example:

```json
{
  "success": false,
  "message": "Too many login attempts. Please try again later.",
  "code": "TOO_MANY_LOGIN_ATTEMPTS"
}
```

Rules:

1. Do not reveal internal limiter key.
2. Include `Retry-After` header when possible.
3. Do not alert on every single 429.
4. Monitor spikes.

---

### 5.17 File and Storage Error Codes

```txt
FILE_NOT_FOUND
FILE_TOO_LARGE
FILE_TYPE_NOT_ALLOWED
FILE_UPLOAD_FAILED
FILE_DELETE_FAILED
FILE_ACCESS_DENIED
STORAGE_PROVIDER_ERROR
SIGNED_URL_FAILED
```

#### FILE_TOO_LARGE

HTTP:

```txt
413
```

Use when:

```txt
uploaded file exceeds allowed size
```

#### FILE_TYPE_NOT_ALLOWED

HTTP:

```txt
400
```

Use when:

```txt
uploaded file type is not allowed
```

#### FILE_ACCESS_DENIED

HTTP:

```txt
403 or 404
```

Use when:

```txt
user cannot access private file
```

#### STORAGE_PROVIDER_ERROR

HTTP:

```txt
502 or 500
```

Use when:

```txt
external storage provider fails
```

---

### 5.18 Webhook Error Codes

```txt
WEBHOOK_SIGNATURE_INVALID
WEBHOOK_PAYLOAD_INVALID
WEBHOOK_EVENT_DUPLICATE
WEBHOOK_EVENT_UNSUPPORTED
WEBHOOK_PROCESSING_FAILED
```

#### WEBHOOK_SIGNATURE_INVALID

HTTP:

```txt
401 or 400
```

Use when:

```txt
webhook signature verification fails
```

#### WEBHOOK_PAYLOAD_INVALID

HTTP:

```txt
400
```

Use when:

```txt
webhook payload fails validation
```

#### WEBHOOK_EVENT_DUPLICATE

HTTP:

```txt
200 or 409
```

Use depends on provider expectation.

Often return `200` after ignoring duplicate event to prevent provider retries.

Document provider-specific behavior.

#### WEBHOOK_EVENT_UNSUPPORTED

HTTP:

```txt
200 or 400
```

Use depends on provider expectation.

#### WEBHOOK_PROCESSING_FAILED

HTTP:

```txt
500
```

Use when:

```txt
valid webhook cannot be processed
```

---

### 5.19 External Provider Error Codes

```txt
EXTERNAL_SERVICE_ERROR
PAYMENT_PROVIDER_ERROR
EMAIL_PROVIDER_ERROR
STORAGE_PROVIDER_ERROR
SMS_PROVIDER_ERROR
```

HTTP:

```txt
502
```

or:

```txt
503
```

Use when:

```txt
external dependency fails
```

Rules:

1. Do not expose provider secret.
2. Do not expose raw provider payload if sensitive.
3. Log safe provider error metadata.
4. Retry when safe.
5. Use idempotency for payment/webhook flows.

---

### 5.20 Database and System Error Codes

```txt
DATABASE_ERROR
DATABASE_TIMEOUT
DATABASE_CONSTRAINT_FAILED
DATABASE_CONNECTION_FAILED
TRANSACTION_FAILED
MIGRATION_FAILED
INTERNAL_SERVER_ERROR
SERVICE_UNAVAILABLE
ENVIRONMENT_MISCONFIGURED
```

#### DATABASE_ERROR

HTTP:

```txt
500
```

Use when:

```txt
generic database error occurs
```

#### DATABASE_TIMEOUT

HTTP:

```txt
503 or 500
```

Use when:

```txt
database query times out
```

#### DATABASE_CONSTRAINT_FAILED

HTTP:

```txt
409 or 500
```

Use `409` when expected conflict:

```txt
duplicate email
duplicate payment
```

Use `500` when unexpected internal constraint failure.

#### DATABASE_CONNECTION_FAILED

HTTP:

```txt
503
```

Use when:

```txt
database is unavailable
```

#### TRANSACTION_FAILED

HTTP:

```txt
500
```

Use when:

```txt
database transaction fails unexpectedly
```

#### ENVIRONMENT_MISCONFIGURED

HTTP:

```txt
500
```

Use when:

```txt
required environment variable or config is missing
```

Do not expose actual secret/config value.

---

### 5.21 Future Billing Error Codes

```txt
SUBSCRIPTION_NOT_FOUND
SUBSCRIPTION_INACTIVE
SUBSCRIPTION_EXPIRED
SUBSCRIPTION_PAST_DUE
SUBSCRIPTION_SUSPENDED
PLAN_NOT_FOUND
PLAN_UPGRADE_REQUIRED
QUOTA_EXCEEDED
BILLING_PROVIDER_ERROR
INVOICE_NOT_FOUND
INVOICE_ALREADY_PAID
INVOICE_PAYMENT_FAILED
```

#### SUBSCRIPTION_INACTIVE

HTTP:

```txt
403
```

Use when:

```txt
business subscription is not active
```

#### SUBSCRIPTION_SUSPENDED

HTTP:

```txt
403
```

Use when:

```txt
business is suspended
```

#### INVOICE_ALREADY_PAID

HTTP:

```txt
409
```

Use when:

```txt
attempting to pay already paid invoice
```

---

### 5.22 AppError Class Example

Recommended error class:

```ts
export class AppError extends Error {
  code: string;
  statusCode: number;
  details?: unknown;

  constructor({
    message,
    code,
    statusCode,
    details,
  }: {
    message: string;
    code: string;
    statusCode: number;
    details?: unknown;
  }) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}
```

Example usage:

```ts
throw new AppError({
  statusCode: 409,
  code: "DUPLICATE_PAYMENT",
  message: "Payment already exists for this order.",
});
```

### 5.23 Error Response Helper

Example helper:

```ts
export function errorResponse({
  message,
  code,
  statusCode,
  details,
  requestId,
}: {
  message: string;
  code: string;
  statusCode: number;
  details?: unknown;
  requestId?: string;
}) {
  return Response.json(
    {
      success: false,
      message,
      code,
      details,
      requestId,
    },
    {
      status: statusCode,
    },
  );
}
```

For production, only include `details` when safe.

### 5.24 Error Handler Example

```ts
export function handleApiError(error: unknown, requestId?: string) {
  if (error instanceof AppError) {
    return errorResponse({
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
      requestId,
    });
  }

  logger.error("Unhandled API error", {
    requestId,
    errorName: error instanceof Error ? error.name : "UnknownError",
    errorMessage: error instanceof Error ? error.message : "Unknown error",
  });

  return errorResponse({
    message: "Internal server error.",
    code: "INTERNAL_SERVER_ERROR",
    statusCode: 500,
    requestId,
  });
}
```

---

## 6. Anti-Patterns

Do not:

- Return only `Something went wrong`
- Return raw stack trace in production
- Return Prisma/database internals to frontend
- Return provider secret error payload
- Use random error code names
- Use lowercase mixed with uppercase error codes
- Use message text for frontend logic
- Return `200` for failed business operation
- Use `500` for validation error
- Use `401` when user is logged in but forbidden
- Use `403` when user is not logged in
- Reveal whether cross-tenant resource exists
- Leak session token in error details
- Leak reset token in error details
- Leak payment provider secret in error details
- Rename error codes without migration plan
- Create duplicate error codes with same meaning
- Use one generic code for every business failure
- Log expected validation errors as fatal
- Ignore request ID in errors
- Make frontend parse English messages to decide behavior

---

## 7. Checklist

Error code system is acceptable when:

- [ ] Error codes use uppercase snake case.
- [ ] Error codes are documented.
- [ ] Error response format is consistent.
- [ ] Frontend can rely on `code`.
- [ ] Messages are safe for users.
- [ ] Sensitive details are not exposed.
- [ ] Auth errors use correct codes.
- [ ] Permission errors use correct codes.
- [ ] Tenant/scope errors do not leak data.
- [ ] Validation errors are clear.
- [ ] Order errors are specific.
- [ ] Payment errors are specific.
- [ ] Inventory errors are specific.
- [ ] Rate limit uses `RATE_LIMITED` or specific 429 code.
- [ ] Unexpected errors use `INTERNAL_SERVER_ERROR`.
- [ ] Logs include error code.
- [ ] Error tracking includes error code.
- [ ] Tests assert critical error codes.
- [ ] Error code changes are treated carefully.

---

## 8. References

Related documents:

- 04-backend-api.md
- 06-auth-permissions.md
- 09-security.md
- 10-rate-limiting.md
- 12-error-tracking-logs.md
- 13-monitoring-alerts.md
- 14-testing.md
- appendices/permission-keys.md
- appendices/status-transitions.md
- appendices/api-response-format.md
- appendices/implementation-rules.md