# Error Tracking & Logs

## 1. Purpose

This document defines the error tracking and logging strategy for POS System V3.

It explains what must be logged, what must not be logged, how errors should be tracked, how request IDs should work, how logs should be structured, how production errors should be handled, and how logs should support debugging, security, audit, and monitoring.

The goal is to make production issues traceable without leaking sensitive data.

This document does not replace monitoring, alerting, security, backend API, audit log, or testing documents. It supports them.

---

## 2. Current Context

POS System V3 is a SaaS-style business application.

The active mode is:

```txt
Restaurant
```

The system includes many connected workflows:

```txt
login
register
current user
order creation
payment
kitchen status
serving status
inventory
stock movement
settings
analytics
reports
audit log
```

If one part fails, the effect can spread.

Example:

```txt
Payment API fails
↓
Order does not become PAID
↓
Kitchen does not receive order
↓
Customer waits
↓
Cashier is confused
↓
Owner blames the system
↓
Developer stares at logs, assuming logs exist
```

Logs and error tracking must help answer:

```txt
what happened?
when did it happen?
which endpoint failed?
which user was affected?
which restaurant/business was affected?
which order/payment/inventory item was affected?
what error code happened?
which deployment introduced the issue?
```

Without logs, debugging production becomes guesswork with better font rendering. Lovely, if your hobby is suffering.

---

## 3. Decisions

The following error tracking and logging decisions are locked:

1. Production must have logs.
2. Production should have error tracking before serious user testing.
3. Logs must be structured.
4. Logs must include safe business context when useful.
5. Logs must not include secrets.
6. Logs must not include passwords.
7. Logs must not include password hashes.
8. Logs must not include session tokens.
9. Logs must not include reset tokens.
10. Logs must not include full database URLs.
11. Logs must not include private API keys.
12. Every important request should have a request ID.
13. Request ID should be included in related logs.
14. Backend errors must be captured with useful context.
15. Frontend errors should be captured when possible.
16. User-facing production errors must not expose stack traces.
17. Error responses must follow standard response format.
18. Security-related events should be logged safely.
19. Business-critical mutations should create audit logs.
20. Audit logs and application logs are related but not the same.
21. Error tracking should group repeated errors.
22. Error tracking should include environment and release version.
23. Logging volume must be controlled in production.
24. Debug logs should be limited in production.
25. Logs should support monitoring and alerts.

---

## 4. Rules

### 4.1 Log Category Rules

The system may produce different types of logs:

```txt
application logs
request logs
error logs
security logs
audit logs
infrastructure logs
deployment logs
```

#### Application Logs

Used for normal important application events.

Examples:

```txt
Order created
Payment created
Kitchen status updated
Inventory adjusted
Settings updated
```

#### Request Logs

Used for API request tracing.

Examples:

```txt
POST /api/restaurant/orders 201 245ms
POST /api/restaurant/payments 500 900ms
GET /api/restaurant/kitchen/orders 200 120ms
```

#### Error Logs

Used for unexpected failures.

Examples:

```txt
Failed to create payment
Prisma transaction failed
Webhook verification failed
Order status update failed
```

#### Security Logs

Used for security-related events.

Examples:

```txt
login failed
rate limit triggered
forbidden access attempt
tenant access denied
invalid webhook signature
```

#### Audit Logs

Used for business-critical action history.

Examples:

```txt
ORDER_STATUS_UPDATED
PAYMENT_CREATED
PAYMENT_REFUNDED
STOCK_ADJUSTED
SETTING_UPDATED
ROLE_CHANGED
```

Audit logs should usually be stored in database.

Application logs may go to stdout/log provider.

### 4.2 Log Level Rules

Use consistent log levels:

```txt
debug
info
warn
error
fatal
```

#### debug

Use for development-only detail.

Examples:

```txt
calculated order total
parsed filter input
internal branch decision
```

Debug logs should be limited or disabled in production.

#### info

Use for normal important events.

Examples:

```txt
order created
payment created
user logged in
status updated
```

#### warn

Use for unusual but handled cases.

Examples:

```txt
invalid status transition attempted
rate limit triggered
forbidden access attempt
low stock threshold reached
```

#### error

Use for failed operations that require attention.

Examples:

```txt
payment transaction failed
database query failed
report export failed
```

#### fatal

Use for system-breaking failures.

Examples:

```txt
database unavailable
required environment variable missing
application cannot start
```

Do not log everything as `error`.

If everything is urgent, nothing is urgent. A stunning discovery civilization keeps ignoring.

### 4.3 Structured Logging Rules

Logs must be structured when possible.

Bad:

```txt
payment error bro
```

Better:

```txt
Payment failed for order order_123
```

Best:

```json
{
  "level": "error",
  "message": "Payment failed",
  "requestId": "req_abc123",
  "orderId": "order_123",
  "paymentId": "payment_456",
  "userId": "user_789",
  "restaurantId": "resto_123",
  "errorCode": "PAYMENT_AMOUNT_INVALID",
  "timestamp": "2026-06-12T00:00:00.000Z"
}
```

Rules:

1. Prefer JSON structured logs.
2. Include consistent fields.
3. Include request ID when available.
4. Include business scope when safe.
5. Include entity IDs when useful.
6. Do not include secrets.
7. Do not log raw request body blindly.

### 4.4 Required Log Context Rules

Useful log context:

```txt
timestamp
level
message
requestId
method
path
statusCode
durationMs
userId
restaurantId / businessId / tenantId
role
entityType
entityId
errorCode
environment
release
```

Not every log needs every field.

But important backend events should include enough context to debug.

Example request log:

```json
{
  "level": "info",
  "message": "API request completed",
  "requestId": "req_abc123",
  "method": "POST",
  "path": "/api/restaurant/orders",
  "statusCode": 201,
  "durationMs": 246,
  "userId": "user_123",
  "restaurantId": "resto_123",
  "role": "CASHIER",
  "environment": "production"
}
```

### 4.5 Sensitive Data Rules

Never log:

```txt
password
passwordHash
session token
JWT
refresh token
reset password token
API key
payment secret
webhook secret
DATABASE_URL
storage secret key
private key
full credit card data
CVV
```

Avoid logging:

```txt
full email
full phone number
full address
private customer note
raw request body
raw payment payload
```

Safer alternatives:

```txt
userId instead of email
masked email
paymentId instead of full payment payload
errorCode instead of raw provider secret response
```

Bad:

```ts
console.log("login failed", { email, password });
```

Good:

```ts
logger.warn("Login failed", {
  emailHash,
  ipHash,
  errorCode: "INVALID_CREDENTIALS",
});
```

Logging secrets is not debugging. It is a leak wearing a developer hoodie.

### 4.6 Request ID Rules

Every API request should have a request ID.

Purpose:

```txt
trace one request across logs
connect request log with error log
help support investigate issue
help debugging production failure
```

Request ID format:

```txt
req_<uuid>
```

Example:

```txt
req_550e8400-e29b-41d4-a716-446655440000
```

Rules:

1. Generate request ID when request enters backend.
2. Attach request ID to logs.
3. Return request ID in response headers if useful.
4. Include request ID in error tracking context.
5. Do not use request ID as security token.

Optional response header:

```txt
X-Request-Id: req_abc123
```

### 4.7 Error Tracking Rules

Error tracking should capture:

```txt
error message
stack trace
environment
release version
route/path
request ID
user ID if safe
business scope if safe
browser/device info for frontend
frequency
first seen
last seen
```

Recommended tool:

```txt
Sentry
```

Alternative tools:

```txt
Rollbar
Bugsnag
Highlight
Axiom with logs
Better Stack
```

Rules:

1. Capture unexpected backend errors.
2. Capture important frontend runtime errors.
3. Group repeated errors.
4. Track release version.
5. Do not send secrets to error tracker.
6. Sanitize sensitive fields before sending.
7. Mark expected business errors differently from unexpected exceptions.

### 4.8 Expected vs Unexpected Error Rules

Expected errors are controlled business/API failures.

Examples:

```txt
UNAUTHORIZED
FORBIDDEN
VALIDATION_ERROR
NOT_FOUND
INVALID_STATE_TRANSITION
INSUFFICIENT_STOCK
DUPLICATE_PAYMENT
RATE_LIMITED
```

Unexpected errors are system failures.

Examples:

```txt
database connection failed
unhandled exception
Prisma transaction failed unexpectedly
provider timeout
null reference bug
runtime crash
```

Rules:

1. Expected errors may be logged as `warn` or not logged depending on severity.
2. Unexpected errors should be logged as `error`.
3. Unexpected errors should be sent to error tracking.
4. Validation errors should not spam error tracking.
5. Security abuse patterns should be logged safely.

### 4.9 Production Error Response Rules

Production error response must not expose internals.

Do not return:

```txt
stack trace
database query
database URL
server file path
environment variables
secret values
raw provider payload
```

Good production error:

```json
{
  "success": false,
  "message": "Internal server error",
  "code": "INTERNAL_SERVER_ERROR"
}
```

For expected error:

```json
{
  "success": false,
  "message": "Invalid order status transition",
  "code": "INVALID_STATE_TRANSITION"
}
```

Rules:

1. User-facing message must be safe.
2. Machine-readable code must be consistent.
3. Internal stack trace belongs in logs/error tracking.
4. Request ID may be returned to help support.

Optional:

```json
{
  "success": false,
  "message": "Internal server error",
  "code": "INTERNAL_SERVER_ERROR",
  "requestId": "req_abc123"
}
```

### 4.10 Audit Log Rules

Audit logs are not the same as application logs.

Application log:

```txt
helps developers debug system behavior
```

Audit log:

```txt
records important business/security actions for accountability
```

Audit logs should be stored in database.

Audit required for:

```txt
order status updated
payment created
payment refunded
stock adjusted
inventory corrected
settings updated
role changed
permission changed
user deactivated
invoice voided
platform admin accessed tenant
```

Audit log should include:

```txt
actorUserId
actorRole
restaurantId / businessId / tenantId
action
entityType
entityId
beforeValue when safe
afterValue when safe
metadata
createdAt
```

Rules:

1. Audit actor must come from backend current user.
2. Frontend must not provide final audit actor.
3. Audit logs must not store secrets.
4. Audit logs must be tenant-scoped.
5. Normal users must not edit audit logs.

### 4.11 Security Event Logging Rules

Security logs should record suspicious or important security events.

Examples:

```txt
login failed
login success
password reset requested
password reset completed
rate limit triggered
forbidden access attempt
tenant access denied
invalid webhook signature
session revoked
role changed
permission changed
```

Rules:

1. Log repeated failed login attempts safely.
2. Log forbidden access attempts with user ID if authenticated.
3. Log tenant access denial without leaking cross-tenant data.
4. Log invalid webhook signature.
5. Do not log password or token.
6. Security logs should help detect abuse.

### 4.12 Performance Logging Rules

Slow operations should be logged.

Examples:

```txt
slow API request
slow database query
slow report export
slow analytics calculation
slow payment provider response
```

Suggested thresholds:

```txt
API request > 1000ms:
warn

Payment request > 2000ms:
warn/error depending on result

Report export > 5000ms:
warn

Database query timeout:
error
```

Rules:

1. Log slow business-critical endpoints.
2. Include durationMs.
3. Include endpoint path.
4. Include business scope if safe.
5. Do not log raw sensitive payload.

---

## 5. Implementation Guide

### 5.1 Recommended Logging Stack

MVP:

```txt
structured console logs
hosting provider logs
Sentry for error tracking
```

Production-ready direction:

```txt
Pino / Winston logger
Sentry for error tracking
Better Stack / Axiom / Datadog / Grafana Loki for log storage
Uptime monitoring and alerts
```

Recommended for Node.js:

```txt
Pino
```

Alternative:

```txt
Winston
```

For MVP, `console.log(JSON.stringify(...))` can work temporarily.

But uncontrolled random `console.log("here")` everywhere is not logging. It is breadcrumb anxiety.

### 5.2 Logger Shape

Recommended logger interface:

```ts
type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

type LogContext = Record<string, unknown>;

export const logger = {
  debug(message: string, context?: LogContext) {},
  info(message: string, context?: LogContext) {},
  warn(message: string, context?: LogContext) {},
  error(message: string, context?: LogContext) {},
  fatal(message: string, context?: LogContext) {},
};
```

Recommended log entry shape:

```ts
type LogEntry = {
  level: LogLevel;
  message: string;
  timestamp: string;
  environment: string;
  requestId?: string;
  userId?: string;
  restaurantId?: string;
  path?: string;
  method?: string;
  statusCode?: number;
  durationMs?: number;
  errorCode?: string;
  entityType?: string;
  entityId?: string;
};
```

### 5.3 Basic Logger Example

Simple structured logger:

```ts
type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

type LogData = Record<string, unknown>;

function sanitizeLogData(data: LogData = {}) {
  const blockedKeys = [
    "password",
    "passwordHash",
    "token",
    "sessionToken",
    "jwt",
    "refreshToken",
    "resetToken",
    "apiKey",
    "secret",
    "DATABASE_URL",
  ];

  return Object.fromEntries(
    Object.entries(data).filter(([key]) => {
      return !blockedKeys.some((blockedKey) =>
        key.toLowerCase().includes(blockedKey.toLowerCase()),
      );
    }),
  );
}

function log(level: LogLevel, message: string, data: LogData = {}) {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    ...sanitizeLogData(data),
  };

  console.log(JSON.stringify(entry));
}

export const logger = {
  debug: (message: string, data?: LogData) => log("debug", message, data),
  info: (message: string, data?: LogData) => log("info", message, data),
  warn: (message: string, data?: LogData) => log("warn", message, data),
  error: (message: string, data?: LogData) => log("error", message, data),
  fatal: (message: string, data?: LogData) => log("fatal", message, data),
};
```

This is a simple MVP concept.

Production logger should be stricter and better tested.

### 5.4 Request ID Helper

Request ID helper:

```ts
import crypto from "crypto";

export function createRequestId() {
  return `req_${crypto.randomUUID()}`;
}
```

Usage concept:

```ts
const requestId = createRequestId();

logger.info("API request started", {
  requestId,
  method: req.method,
  path: new URL(req.url).pathname,
});
```

### 5.5 API Request Logging Pattern

Recommended API logging flow:

```txt
request starts
↓
create requestId
↓
log request started
↓
run auth/permission/validation/service
↓
log request completed with statusCode and durationMs
↓
if error, log error with requestId
```

Example concept:

```ts
export async function withRequestLogging<T>({
  request,
  handler,
}: {
  request: Request;
  handler: (context: { requestId: string }) => Promise<T>;
}) {
  const requestId = createRequestId();
  const startedAt = Date.now();
  const url = new URL(request.url);

  logger.info("API request started", {
    requestId,
    method: request.method,
    path: url.pathname,
  });

  try {
    const result = await handler({ requestId });

    logger.info("API request completed", {
      requestId,
      method: request.method,
      path: url.pathname,
      durationMs: Date.now() - startedAt,
    });

    return result;
  } catch (error) {
    logger.error("API request failed", {
      requestId,
      method: request.method,
      path: url.pathname,
      durationMs: Date.now() - startedAt,
      errorName: error instanceof Error ? error.name : "UnknownError",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });

    throw error;
  }
}
```

### 5.6 Error Handler Pattern

Centralized error handler should:

```txt
detect known AppError
detect validation error
detect unexpected error
log unexpected error
send unexpected error to error tracking
return safe response
```

Example concept:

```ts
export class AppError extends Error {
  code: string;
  statusCode: number;

  constructor({
    message,
    code,
    statusCode,
  }: {
    message: string;
    code: string;
    statusCode: number;
  }) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}
```

Handler concept:

```ts
export function handleApiError(error: unknown, requestId?: string) {
  if (error instanceof AppError) {
    logger.warn("Handled application error", {
      requestId,
      code: error.code,
      statusCode: error.statusCode,
      message: error.message,
    });

    return Response.json(
      {
        success: false,
        message: error.message,
        code: error.code,
        requestId,
      },
      { status: error.statusCode },
    );
  }

  logger.error("Unhandled application error", {
    requestId,
    errorName: error instanceof Error ? error.name : "UnknownError",
    errorMessage: error instanceof Error ? error.message : "Unknown error",
  });

  return Response.json(
    {
      success: false,
      message: "Internal server error",
      code: "INTERNAL_SERVER_ERROR",
      requestId,
    },
    { status: 500 },
  );
}
```

### 5.7 Sentry Integration Strategy

Sentry may capture:

```txt
frontend runtime errors
backend route handler errors
server component errors
unhandled exceptions
release-specific error frequency
```

Recommended context:

```txt
requestId
userId
restaurantId / businessId
role
environment
release
endpoint
```

Do not send:

```txt
password
token
secret
full request body
payment secret payload
```

Sentry should be configured with scrubbing rules when possible.

### 5.8 What to Log in POS Flows

#### Auth

Log:

```txt
login success
login failed
logout
session expired
inactive user login attempt
password reset requested
```

Do not log:

```txt
password
session token
reset token
```

#### Orders

Log:

```txt
order created
order creation failed
order status update attempted
order status updated
invalid order transition attempted
order cancelled
```

Useful context:

```txt
orderId
orderNumber
currentStatus
nextStatus
userId
restaurantId
role
requestId
```

#### Payments

Log:

```txt
payment created
payment failed
duplicate payment blocked
payment amount invalid
refund created
payment provider webhook received
payment webhook rejected
```

Useful context:

```txt
paymentId
orderId
amount
method
status
userId
restaurantId
requestId
```

Do not log:

```txt
card number
CVV
provider secret
raw sensitive payment payload
```

#### Kitchen

Log:

```txt
kitchen orders fetched if needed
order marked PREPARING
order marked READY
invalid kitchen transition blocked
```

Useful context:

```txt
orderId
currentStatus
nextStatus
userId
restaurantId
requestId
```

#### Serving

Log:

```txt
order marked SERVED
order marked COMPLETED
invalid serving transition blocked
```

#### Inventory

Log:

```txt
stock adjusted
stock movement created
insufficient stock blocked
inventory correction created
waste recorded
```

Useful context:

```txt
inventoryItemId
stockMovementId
quantity
movementType
reason
userId
restaurantId
requestId
```

#### Settings

Log:

```txt
settings updated
payment method enabled/disabled
tax/service charge updated
```

Do not log secrets.

#### Reports

Log:

```txt
report generated
report export failed
slow report query
```

Useful context:

```txt
reportType
dateRange
format
userId
restaurantId
durationMs
```

### 5.9 Log Retention

Logs should not be kept forever without reason.

Suggested retention:

```txt
development logs:
short-lived

production application logs:
7-30 days for MVP

security logs:
30-90 days or longer depending on need

audit logs:
longer retention, often 1 year or more depending on product/legal need
```

Rules:

1. Define retention period.
2. Avoid storing sensitive data.
3. Keep audit logs longer than debug logs.
4. Consider storage cost.
5. Consider legal/privacy requirements when SaaS becomes real.

### 5.10 Local vs Production Logging

Local:

```txt
more verbose
developer-friendly
console output allowed
debug logs allowed
```

Production:

```txt
structured
safe
less noisy
error tracking enabled
no secrets
no raw payload spam
```

Rules:

1. Debug logs should not flood production.
2. Production logs should be searchable.
3. Production logs should include environment and release.
4. Production logs should support support/debugging workflow.

### 5.11 Deployment and Release Context

Logs and error tracking should include release info.

Example:

```txt
release: "v0.3.0"
commitSha: "abc123"
environment: "production"
```

Why?

Because when errors spike after deployment, you need to know which version started the fire.

Without release context, debugging becomes “something changed somewhere.” A technical sentence with the nutritional value of cardboard.

### 5.12 Support Debugging Workflow

When user reports issue:

```txt
user says payment failed
↓
support asks approximate time/order number
↓
developer searches by restaurantId/orderId/requestId
↓
logs show payment endpoint error
↓
Sentry shows stack trace
↓
fix is traced to commit/release
```

Useful searchable fields:

```txt
restaurantId
userId
orderId
paymentId
requestId
errorCode
timestamp
endpoint
```

---

## 6. Anti-Patterns

Do not:

- Debug production with no logs
- Log passwords
- Log password hashes
- Log session tokens
- Log reset tokens
- Log full database URLs
- Log private API keys
- Log raw sensitive payment payloads
- Return stack traces to users in production
- Use random `console.log("here")` everywhere
- Use unstructured logs for important events
- Log everything as `error`
- Ignore request IDs
- Ignore business context in logs
- Store audit logs only in console
- Treat application logs and audit logs as the same thing
- Send validation errors to Sentry as critical errors
- Hide unexpected errors silently
- Catch errors and return success
- Swallow errors without logging
- Log raw request body by default
- Keep debug logs extremely noisy in production
- Store logs forever without retention policy
- Include tenant data in global/shared logs without scope
- Forget release/version context
- Treat user screenshots as your only error tracking system

---

## 7. Checklist

Error tracking and logs are acceptable when:

- [ ] Logs are structured.
- [ ] Important API requests have request ID.
- [ ] Logs include safe context.
- [ ] Logs include business scope when useful.
- [ ] Logs do not include secrets.
- [ ] Logs do not include passwords.
- [ ] Logs do not include tokens.
- [ ] Production errors do not expose stack traces to users.
- [ ] Unexpected backend errors are logged.
- [ ] Unexpected backend errors are sent to error tracking.
- [ ] Frontend runtime errors are captured when possible.
- [ ] Error tracking includes environment and release.
- [ ] Expected business errors are handled cleanly.
- [ ] Security events are logged safely.
- [ ] Business-critical actions create audit logs.
- [ ] Audit logs are stored in database.
- [ ] Slow critical operations are logged.
- [ ] Log levels are used consistently.
- [ ] Logging volume is controlled in production.
- [ ] Logs support support/debugging workflow.
- [ ] Log retention is defined.

---

## 8. References

Related documents:

- 00-ai-context.md
- 01-system-design.md
- 02-system-architecture.md
- 04-backend-api.md
- 05-database-storage.md
- 06-auth-permissions.md
- 09-security.md
- 10-rate-limiting.md
- 13-monitoring-alerts.md
- 14-testing.md
- appendices/api-response-format.md
- appendices/error-codes.md
- appendices/implementation-rules.md