# API Response Format

## 1. Purpose

This appendix defines the standard API response format for POS System V3.

The goal is to make every API response consistent, predictable, easy to handle in frontend, easy to test, easy to log, and easy to debug.

Bad API response consistency:

```json
{
  "data": []
}
```

then another endpoint:

```json
{
  "success": true,
  "result": {}
}
```

then another endpoint:

```json
{
  "ok": false,
  "err": "Something went wrong"
}
```

That is not API design. That is a personality disorder with HTTP status codes.

All API routes must follow one response shape.

---

## 2. Current Context

POS System V3 uses API routes for:

```txt
auth
orders
payments
kitchen
serving
inventory
menu
tables
employees
settings
analytics
reports
audit logs
future billing
future customer app
```

Frontend needs to handle:

```txt
success response
error response
validation errors
pagination
empty data
unauthorized
forbidden
not found
rate limited
server error
```

Monitoring/logging needs:

```txt
status code
error code
requestId
duration
endpoint
business scope
```

Testing needs predictable response:

```txt
expect response.success to be true
expect response.data to exist
expect error response.code to be INVALID_STATE_TRANSITION
```

So the API must not improvise.

Improvisation is for jazz, not payment endpoints.

---

## 3. Decisions

The following API response decisions are locked:

1. Every API response must include `success`.
2. Successful response uses `success: true`.
3. Failed response uses `success: false`.
4. Successful response should use `data`.
5. Failed response must use `message` and `code`.
6. Error code must follow `appendices/error-codes.md`.
7. Response message must be safe for users.
8. Production error response must not expose stack trace.
9. Request ID should be included when available.
10. Pagination metadata must be standardized.
11. List response must use array inside `data`.
12. Empty list must return empty array, not null.
13. Empty optional object may return `null`.
14. Dates must use ISO 8601 string.
15. Money must be returned consistently.
16. Enum values must match backend enum names.
17. HTTP status code must match response meaning.
18. Frontend must not rely only on response message.
19. Frontend should rely on `success` and `code`.
20. Validation error details must be structured.
21. Sensitive fields must not be returned.
22. Password hash must never be returned.
23. Tokens/secrets must not be returned unless intentionally designed.
24. API response shape must be tested for critical routes.
25. Response helpers should be centralized.

---

## 4. Rules

### 4.1 Standard Success Response

Basic success response:

```json
{
  "success": true,
  "message": "Order created successfully.",
  "data": {
    "id": "order_123",
    "status": "WAITING_PAYMENT"
  },
  "requestId": "req_abc123"
}
```

Rules:

1. `success` must be `true`.
2. `message` is optional but recommended for mutations.
3. `data` contains response payload.
4. `requestId` is optional but recommended.
5. Do not include `error` in success response.
6. Do not return sensitive fields.

For read endpoints, message may be omitted:

```json
{
  "success": true,
  "data": {
    "id": "order_123",
    "status": "PAID"
  },
  "requestId": "req_abc123"
}
```

### 4.2 Standard Error Response

Basic error response:

```json
{
  "success": false,
  "message": "Invalid order status transition.",
  "code": "INVALID_STATE_TRANSITION",
  "requestId": "req_abc123"
}
```

Rules:

1. `success` must be `false`.
2. `message` must be safe and human-readable.
3. `code` must be machine-readable.
4. `code` must use documented error code.
5. `requestId` should be included when available.
6. Do not expose stack trace.
7. Do not expose database details.
8. Do not expose secrets.

### 4.3 Validation Error Response

Validation error response:

```json
{
  "success": false,
  "message": "Validation failed.",
  "code": "VALIDATION_ERROR",
  "details": {
    "fieldErrors": {
      "email": ["Invalid email address."],
      "password": ["Password must be at least 8 characters."]
    },
    "formErrors": []
  },
  "requestId": "req_abc123"
}
```

Rules:

1. Validation errors use `VALIDATION_ERROR`.
2. Field errors must be grouped by field name.
3. Form-level errors go to `formErrors`.
4. Do not expose internal schema implementation.
5. Frontend should render field errors near related fields.
6. Validation response should use HTTP `400`.

### 4.4 List Response

List response:

```json
{
  "success": true,
  "data": [
    {
      "id": "order_1",
      "status": "PAID"
    },
    {
      "id": "order_2",
      "status": "PREPARING"
    }
  ],
  "requestId": "req_abc123"
}
```

Rules:

1. List data must be array.
2. Empty list must be `[]`.
3. Do not return `null` for empty list.
4. Pagination metadata must be included if endpoint is paginated.

Empty list:

```json
{
  "success": true,
  "data": [],
  "requestId": "req_abc123"
}
```

### 4.5 Paginated Response

Paginated response:

```json
{
  "success": true,
  "data": [
    {
      "id": "order_1",
      "status": "PAID"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalItems": 125,
      "totalPages": 7,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  },
  "requestId": "req_abc123"
}
```

Rules:

1. Paginated list must use `data` array.
2. Pagination info must go inside `meta.pagination`.
3. `page` starts from 1.
4. `limit` must respect max limit.
5. `totalItems` may be omitted for cursor pagination.
6. `hasNextPage` should be included when possible.
7. Frontend must not guess pagination state from array length only.

Cursor pagination response:

```json
{
  "success": true,
  "data": [
    {
      "id": "order_123",
      "status": "PAID"
    }
  ],
  "meta": {
    "pagination": {
      "limit": 20,
      "nextCursor": "order_123",
      "hasNextPage": true
    }
  },
  "requestId": "req_abc123"
}
```

### 4.6 Single Resource Response

Single resource response:

```json
{
  "success": true,
  "data": {
    "id": "order_123",
    "orderNumber": "ORD-001",
    "status": "PAID",
    "paymentStatus": "PAID"
  },
  "requestId": "req_abc123"
}
```

Rules:

1. Single resource must be object.
2. Missing resource must return error, not `data: null`, unless endpoint intentionally allows optional result.
3. Use resource-specific not found code when useful.

Not found:

```json
{
  "success": false,
  "message": "Order not found.",
  "code": "ORDER_NOT_FOUND",
  "requestId": "req_abc123"
}
```

### 4.7 Mutation Response

Mutation response should include updated/created resource or useful summary.

Create response:

```json
{
  "success": true,
  "message": "Order created successfully.",
  "data": {
    "id": "order_123",
    "orderNumber": "ORD-001",
    "status": "WAITING_PAYMENT"
  },
  "requestId": "req_abc123"
}
```

Update response:

```json
{
  "success": true,
  "message": "Order status updated successfully.",
  "data": {
    "id": "order_123",
    "fromStatus": "PAID",
    "toStatus": "PREPARING"
  },
  "requestId": "req_abc123"
}
```

Delete/archive response:

```json
{
  "success": true,
  "message": "Menu item archived successfully.",
  "data": {
    "id": "menu_123",
    "archived": true
  },
  "requestId": "req_abc123"
}
```

Rules:

1. Mutations should include message.
2. Mutation response should include enough data to update UI.
3. Avoid returning huge payload after mutation.
4. Sensitive fields must be excluded.
5. Audit log creation does not need to be returned unless useful.

### 4.8 Auth Response

Login success:

```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "user": {
      "id": "user_123",
      "name": "Cashier A",
      "email": "cashier@example.com",
      "role": "CASHIER",
      "restaurantId": "resto_123"
    }
  },
  "requestId": "req_abc123"
}
```

Login failure:

```json
{
  "success": false,
  "message": "Invalid email or password.",
  "code": "INVALID_CREDENTIALS",
  "requestId": "req_abc123"
}
```

Current user:

```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "name": "Cashier A",
    "email": "cashier@example.com",
    "role": "CASHIER",
    "restaurantId": "resto_123",
    "permissions": [
      "restaurant.orders.create",
      "restaurant.payments.create"
    ]
  },
  "requestId": "req_abc123"
}
```

Rules:

1. Never return `password`.
2. Never return `passwordHash`.
3. Prefer HttpOnly cookie for session.
4. Do not return session token if cookie-based auth is used.
5. Login error message must not reveal whether email exists.
6. Inactive user must be handled safely.

### 4.9 Permission Error Response

Unauthenticated:

```json
{
  "success": false,
  "message": "Unauthorized.",
  "code": "UNAUTHORIZED",
  "requestId": "req_abc123"
}
```

Authenticated but forbidden:

```json
{
  "success": false,
  "message": "You do not have permission to perform this action.",
  "code": "FORBIDDEN",
  "requestId": "req_abc123"
}
```

Missing specific permission:

```json
{
  "success": false,
  "message": "You do not have permission to perform this action.",
  "code": "MISSING_PERMISSION",
  "requestId": "req_abc123"
}
```

Rules:

1. Use `401` when user is not authenticated.
2. Use `403` when user is authenticated but not allowed.
3. Do not expose internal permission map unless needed.
4. Frontend may use code to redirect or show access denied.

### 4.10 Tenant Scope Response

When resource does not belong to user’s business, prefer safe not found:

```json
{
  "success": false,
  "message": "Order not found.",
  "code": "ORDER_NOT_FOUND",
  "requestId": "req_abc123"
}
```

Rules:

1. Do not reveal that another tenant’s resource exists.
2. Scope failure may return `404` instead of `403`.
3. Logs may include safe internal context.
4. User-facing response must be safe.

Bad:

```json
{
  "success": false,
  "message": "Order exists but belongs to another restaurant.",
  "code": "TENANT_ACCESS_DENIED"
}
```

Congratulations, now the attacker knows the ID is valid. Very generous. Too generous.

### 4.11 Rate Limit Response

Rate limit response:

```json
{
  "success": false,
  "message": "Too many requests. Please try again later.",
  "code": "RATE_LIMITED",
  "requestId": "req_abc123"
}
```

Headers when possible:

```txt
Retry-After: 60
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1760000000
```

Rules:

1. Use HTTP `429`.
2. Include safe message.
3. Do not expose limiter key.
4. Include retry header when possible.
5. Frontend must not auto-retry aggressively.

### 4.12 Error Details Rules

`details` may be used for safe structured context.

Allowed examples:

```json
{
  "fieldErrors": {
    "quantity": ["Quantity must be greater than 0."]
  }
}
```

```json
{
  "currentStatus": "WAITING_PAYMENT",
  "requestedStatus": "READY"
}
```

Avoid details for:

```txt
password
token
secret
raw SQL
provider secret payload
full stack trace
private tenant data
```

Rules:

1. `details` is optional.
2. `details` must be safe.
3. `details` must be structured.
4. `details` should be stable enough for frontend use only when documented.

### 4.13 Date Format Rules

Dates must use ISO 8601 strings.

Example:

```json
{
  "createdAt": "2026-06-12T00:00:00.000Z",
  "updatedAt": "2026-06-12T01:30:00.000Z"
}
```

Rules:

1. Return dates as ISO strings.
2. Store dates consistently in database.
3. Frontend handles local timezone display.
4. Do not return ambiguous date format like `12/06/2026`.
5. Do not mix timestamp formats randomly.

### 4.14 Money Format Rules

Money must be consistent.

Recommended response for IDR MVP:

```json
{
  "subtotal": 50000,
  "taxAmount": 5000,
  "serviceChargeAmount": 2500,
  "discountAmount": 0,
  "totalAmount": 57500,
  "currency": "IDR"
}
```

Rules:

1. Use integer minor unit when possible.
2. For IDR, integer rupiah is acceptable.
3. If using Decimal in database, convert consistently in response.
4. Always include currency when displaying financial amounts.
5. Do not use floating point casually for money.
6. Do not trust frontend amount for final calculation.

Bad:

```json
{
  "totalAmount": 57500.00000000001
}
```

Beautiful, if the goal is to make accounting cry.

### 4.15 Enum Format Rules

Enums must use stable uppercase values matching backend domain.

Example:

```json
{
  "status": "WAITING_PAYMENT",
  "paymentStatus": "UNPAID",
  "role": "CASHIER"
}
```

Rules:

1. Use backend enum values.
2. Do not translate enum in API response.
3. Frontend maps enum to display label.
4. Do not return random lowercase enum in one endpoint and uppercase in another.
5. Enum changes require frontend and tests update.

Frontend display map example:

```ts
const orderStatusLabel = {
  WAITING_PAYMENT: "Waiting Payment",
  PAID: "Paid",
  PREPARING: "Preparing",
};
```

### 4.16 Boolean Format Rules

Booleans must be actual booleans.

Good:

```json
{
  "isActive": true,
  "isAvailable": false
}
```

Bad:

```json
{
  "isActive": "yes",
  "isAvailable": "0"
}
```

Rules:

1. Use `true` or `false`.
2. Boolean names should usually start with `is`, `has`, `can`, or `should`.
3. Do not use string booleans.

### 4.17 Null and Undefined Rules

JSON does not support `undefined`.

Use:

```json
{
  "customerName": null
}
```

Rules:

1. Use `null` for intentionally empty optional value.
2. Omit field only when field is not part of response contract.
3. Empty list must be `[]`, not `null`.
4. Empty object should usually be `{}` only when meaningful.
5. Be consistent.

### 4.18 ID Format Rules

IDs should be strings.

Example:

```json
{
  "id": "order_123",
  "restaurantId": "resto_123",
  "createdById": "user_123"
}
```

Rules:

1. IDs must be strings in API response.
2. Do not expose internal sequential IDs if avoidable.
3. Use stable public IDs.
4. Tenant-owned resource IDs must still be scoped in backend.
5. Never trust frontend ID without scope check.

### 4.19 Metadata Rules

Use `meta` for response metadata.

Examples:

```json
{
  "success": true,
  "data": [],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20
    },
    "filters": {
      "status": "PAID"
    }
  }
}
```

Rules:

1. `meta` must not contain main data.
2. `meta.pagination` is for pagination.
3. `meta.filters` may echo safe applied filters.
4. `meta.timing` may be used in development only.
5. Do not expose sensitive internal metadata.

### 4.20 Request ID Rules

Every response should include request ID when available.

Example:

```json
{
  "success": false,
  "message": "Internal server error.",
  "code": "INTERNAL_SERVER_ERROR",
  "requestId": "req_abc123"
}
```

Rules:

1. Request ID helps support/debugging.
2. Request ID should match logs.
3. Request ID is not a secret.
4. Request ID must not be used for authorization.
5. Frontend may show request ID in error detail for support.

### 4.21 HTTP Status Rules

Use correct HTTP status.

```txt
200 OK:
successful read/update

201 Created:
resource created

204 No Content:
successful deletion with no body, optional

400 Bad Request:
validation/business input error

401 Unauthorized:
not logged in or invalid session

403 Forbidden:
logged in but not allowed

404 Not Found:
resource missing or hidden by scope

409 Conflict:
duplicate/conflicting operation

413 Payload Too Large:
file/body too large

422 Unprocessable Entity:
optional semantic validation

429 Too Many Requests:
rate limited

500 Internal Server Error:
unexpected server error

502 Bad Gateway:
external provider error

503 Service Unavailable:
temporary dependency issue
```

Rules:

1. Do not return `200` for errors.
2. Do not return `500` for normal validation errors.
3. Do not return `401` for role mismatch.
4. Do not return `403` for unauthenticated user.
5. Match HTTP status with error code.

### 4.22 API Versioning Rules

MVP may not need URL versioning yet.

Current API may use:

```txt
/api/...
```

Future public API may use:

```txt
/api/v1/...
```

Rules:

1. Internal app API can remain unversioned during MVP.
2. Public third-party API should be versioned.
3. Breaking changes must be documented.
4. Response format should remain stable.
5. Do not break frontend silently.

### 4.23 Webhook Response Rules

Webhook responses may differ depending on provider.

Successful webhook processing:

```json
{
  "success": true,
  "message": "Webhook processed."
}
```

Duplicate webhook event:

```json
{
  "success": true,
  "message": "Webhook event already processed."
}
```

Invalid webhook:

```json
{
  "success": false,
  "message": "Invalid webhook signature.",
  "code": "WEBHOOK_SIGNATURE_INVALID"
}
```

Rules:

1. Verify signature before processing.
2. Duplicate event may still return `200` depending on provider retry behavior.
3. Do not expose internal provider secrets.
4. Log webhook event safely.
5. Use idempotency.

### 4.24 File Upload Response Rules

Successful upload:

```json
{
  "success": true,
  "message": "File uploaded successfully.",
  "data": {
    "id": "file_123",
    "url": "https://cdn.example.com/menu/image.webp",
    "mimeType": "image/webp",
    "size": 245000
  },
  "requestId": "req_abc123"
}
```

Upload error:

```json
{
  "success": false,
  "message": "File type is not allowed.",
  "code": "FILE_TYPE_NOT_ALLOWED",
  "requestId": "req_abc123"
}
```

Rules:

1. Return public URL only for public files.
2. Private files should return signed URL or file ID depending on access model.
3. Validate file size.
4. Validate file type.
5. Do not expose storage secret or bucket internals.

### 4.25 Response Field Naming Rules

Use camelCase for JSON fields.

Good:

```json
{
  "orderNumber": "ORD-001",
  "createdAt": "2026-06-12T00:00:00.000Z",
  "totalAmount": 57500
}
```

Bad:

```json
{
  "order_number": "ORD-001",
  "created_at": "2026-06-12T00:00:00.000Z",
  "total_amount": 57500
}
```

Rules:

1. Use camelCase in API JSON.
2. Database may use different naming internally if needed.
3. Keep frontend type consistent.
4. Do not mix snake_case and camelCase randomly.

---

## 5. Implementation Guide

### 5.1 TypeScript Response Types

Recommended response types:

```ts
export type ApiSuccessResponse<TData> = {
  success: true;
  message?: string;
  data: TData;
  meta?: ApiMeta;
  requestId?: string;
};

export type ApiErrorResponse = {
  success: false;
  message: string;
  code: string;
  details?: unknown;
  requestId?: string;
};

export type ApiResponse<TData> =
  | ApiSuccessResponse<TData>
  | ApiErrorResponse;

export type ApiMeta = {
  pagination?: {
    page?: number;
    limit: number;
    totalItems?: number;
    totalPages?: number;
    hasNextPage?: boolean;
    hasPreviousPage?: boolean;
    nextCursor?: string | null;
  };
  filters?: Record<string, unknown>;
};
```

### 5.2 Success Response Helper

```ts
export function successResponse<TData>({
  data,
  message,
  meta,
  requestId,
  status = 200,
}: {
  data: TData;
  message?: string;
  meta?: ApiMeta;
  requestId?: string;
  status?: number;
}) {
  return Response.json(
    {
      success: true,
      message,
      data,
      meta,
      requestId,
    },
    {
      status,
    },
  );
}
```

Create response:

```ts
return successResponse({
  message: "Order created successfully.",
  data: order,
  requestId,
  status: 201,
});
```

### 5.3 Error Response Helper

```ts
export function errorResponse({
  message,
  code,
  details,
  requestId,
  status = 400,
}: {
  message: string;
  code: string;
  details?: unknown;
  requestId?: string;
  status?: number;
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
      status,
    },
  );
}
```

Usage:

```ts
return errorResponse({
  message: "Invalid order status transition.",
  code: "INVALID_STATE_TRANSITION",
  requestId,
  status: 400,
});
```

### 5.4 Paginated Response Helper

```ts
export function paginatedResponse<TData>({
  data,
  pagination,
  requestId,
}: {
  data: TData[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  requestId?: string;
}) {
  return successResponse({
    data,
    meta: {
      pagination,
    },
    requestId,
  });
}
```

### 5.5 AppError Integration

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

Usage:

```ts
throw new AppError({
  statusCode: 409,
  code: "DUPLICATE_PAYMENT",
  message: "Payment already exists for this order.",
});
```

### 5.6 API Error Handler

```ts
export function handleApiError(error: unknown, requestId?: string) {
  if (error instanceof AppError) {
    return errorResponse({
      message: error.message,
      code: error.code,
      details: error.details,
      status: error.statusCode,
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
    status: 500,
    requestId,
  });
}
```

### 5.7 Zod Validation Error Mapping

Example:

```ts
import { ZodError } from "zod";

export function formatZodError(error: ZodError) {
  const flattened = error.flatten();

  return {
    fieldErrors: flattened.fieldErrors,
    formErrors: flattened.formErrors,
  };
}
```

Usage:

```ts
const parsed = createOrderSchema.safeParse(body);

if (!parsed.success) {
  return errorResponse({
    message: "Validation failed.",
    code: "VALIDATION_ERROR",
    details: formatZodError(parsed.error),
    status: 400,
    requestId,
  });
}
```

### 5.8 Route Handler Pattern

Recommended route pattern:

```ts
export async function POST(req: Request) {
  const requestId = createRequestId();

  try {
    const user = await requireAuth();

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

Rules:

1. Create request ID early.
2. Use centralized helpers.
3. Avoid custom response shape inside each route.
4. Convert known errors to AppError.
5. Let unexpected errors become safe `INTERNAL_SERVER_ERROR`.

### 5.9 Frontend Handling Pattern

Frontend should handle response by `success`.

```ts
async function apiFetch<TData>(url: string, options?: RequestInit) {
  const response = await fetch(url, options);
  const body = await response.json();

  if (!body.success) {
    throw body;
  }

  return body.data as TData;
}
```

Error handling:

```ts
try {
  await apiFetch("/api/restaurant/payments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
} catch (error) {
  if (error.code === "DUPLICATE_PAYMENT") {
    showToast("Payment already exists for this order.");
  }

  if (error.code === "RATE_LIMITED") {
    showToast("Too many requests. Please try again later.");
  }
}
```

Frontend must not parse English message for logic.

That is how applications become haunted by copywriting changes.

### 5.10 Example: Create Order

Success:

```json
{
  "success": true,
  "message": "Order created successfully.",
  "data": {
    "id": "order_123",
    "orderNumber": "ORD-001",
    "status": "WAITING_PAYMENT",
    "paymentStatus": "UNPAID",
    "subtotal": 50000,
    "taxAmount": 5000,
    "serviceChargeAmount": 2500,
    "discountAmount": 0,
    "totalAmount": 57500,
    "currency": "IDR",
    "createdAt": "2026-06-12T00:00:00.000Z"
  },
  "requestId": "req_abc123"
}
```

Validation error:

```json
{
  "success": false,
  "message": "Validation failed.",
  "code": "VALIDATION_ERROR",
  "details": {
    "fieldErrors": {
      "items": ["Order must have at least one item."]
    },
    "formErrors": []
  },
  "requestId": "req_abc123"
}
```

Business error:

```json
{
  "success": false,
  "message": "Insufficient stock.",
  "code": "INSUFFICIENT_STOCK",
  "requestId": "req_abc123"
}
```

### 5.11 Example: Payment

Success:

```json
{
  "success": true,
  "message": "Payment created successfully.",
  "data": {
    "id": "payment_123",
    "orderId": "order_123",
    "amount": 57500,
    "currency": "IDR",
    "method": "CASH",
    "status": "PAID",
    "paidAt": "2026-06-12T00:10:00.000Z"
  },
  "requestId": "req_abc123"
}
```

Duplicate payment:

```json
{
  "success": false,
  "message": "Payment already exists for this order.",
  "code": "DUPLICATE_PAYMENT",
  "requestId": "req_abc123"
}
```

Amount mismatch:

```json
{
  "success": false,
  "message": "Payment amount does not match order total.",
  "code": "PAYMENT_AMOUNT_MISMATCH",
  "requestId": "req_abc123"
}
```

### 5.12 Example: Kitchen Queue

Success:

```json
{
  "success": true,
  "data": [
    {
      "id": "order_123",
      "orderNumber": "ORD-001",
      "status": "PAID",
      "items": [
        {
          "id": "item_1",
          "name": "Nasi Goreng",
          "quantity": 2,
          "notes": "No spicy"
        }
      ],
      "createdAt": "2026-06-12T00:00:00.000Z"
    }
  ],
  "requestId": "req_abc123"
}
```

No orders:

```json
{
  "success": true,
  "data": [],
  "requestId": "req_abc123"
}
```

Forbidden:

```json
{
  "success": false,
  "message": "You do not have permission to perform this action.",
  "code": "FORBIDDEN",
  "requestId": "req_abc123"
}
```

---

## 6. Anti-Patterns

Do not:

- Return different response shape per endpoint
- Use `ok`, `result`, `payload`, and `data` randomly
- Return `200` with `success: false`
- Return stack trace in production
- Return raw Prisma error to frontend
- Return passwordHash
- Return session token accidentally
- Return another tenant’s data in error details
- Return `null` for empty list
- Return money sometimes as string, sometimes as number
- Return enum sometimes lowercase, sometimes uppercase
- Make frontend parse English messages for logic
- Put pagination fields at random top-level names
- Use vague error messages only
- Skip requestId in production errors
- Put internal debug data in `meta`
- Return full object after mutation when UI only needs small summary
- Let every route manually invent response format
- Ignore HTTP status meaning
- Hide business failure inside `INTERNAL_SERVER_ERROR`

---

## 7. Checklist

API response format is acceptable when:

- [ ] Success response uses `success: true`.
- [ ] Error response uses `success: false`.
- [ ] Success payload uses `data`.
- [ ] Error response uses `message` and `code`.
- [ ] Error codes follow documented list.
- [ ] Validation errors use structured `details`.
- [ ] List response returns array.
- [ ] Empty list returns `[]`.
- [ ] Pagination uses `meta.pagination`.
- [ ] Request ID is included when available.
- [ ] HTTP status matches response meaning.
- [ ] Dates use ISO 8601.
- [ ] Money format is consistent.
- [ ] Enums use backend enum values.
- [ ] Sensitive fields are excluded.
- [ ] Password hash is never returned.
- [ ] Stack trace is never returned in production.
- [ ] Response helpers are centralized.
- [ ] Frontend checks `success` and `code`.
- [ ] Critical route response shapes are tested.

---

## 8. References

Related documents:

- 04-backend-api.md
- 05-database-storage.md
- 06-auth-permissions.md
- 09-security.md
- 10-rate-limiting.md
- 12-error-tracking-logs.md
- 14-testing.md
- appendices/error-codes.md
- appendices/permission-keys.md
- appendices/status-transitions.md
- appendices/implementation-rules.md