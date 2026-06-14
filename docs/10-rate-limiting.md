# Rate Limiting

## 1. Purpose

This document defines the rate limiting strategy for POS System V3.

It explains which endpoints must be limited, what identity should be used for limiting, what limits are recommended, how rate limit responses should look, and how rate limiting should be implemented safely during MVP and future production stages.

The goal is to protect authentication, payment, order, reporting, public customer ordering, and expensive API endpoints from brute force, spam, abuse, accidental loops, bot traffic, and cloud cost spikes.

This document does not replace security, backend API, monitoring, caching, or hosting documents. Rate limiting is one security and stability layer among many.

---

## 2. Current Context

POS System V3 is a SaaS-style business application.

The active mode is:

```txt
Restaurant
```

The system includes sensitive and high-impact endpoints:

```txt
login
register
password reset
create order
customer QR order
create payment
update order status
inventory mutation
settings mutation
report export
analytics query
payment webhook
```

Without rate limiting, one user, bot, broken script, or broken frontend loop can overload the system.

Examples:

```txt
brute force login
spam customer orders
duplicate payment attempts
expensive report generation spam
inventory mutation spam
API polling too frequently
```

Rate limiting must be implemented gradually.

MVP may start with simple application-level rate limiting.

Production may add:

```txt
edge / WAF rate limit
Redis-backed distributed rate limit
per-user and per-tenant limit
provider-level bot protection
```

Do not start with infrastructure drama before the API is stable. But also do not leave login wide open like a public karaoke room.

---

## 3. Decisions

The following rate limiting decisions are locked:

1. Rate limiting is required for sensitive endpoints.
2. Login must be rate-limited.
3. Register must be rate-limited.
4. Password reset must be rate-limited.
5. Public customer order creation must be rate-limited.
6. Payment creation must be rate-limited.
7. Report export must be rate-limited.
8. Expensive analytics endpoints should be rate-limited.
9. Webhook endpoints should have protection, but signature verification remains mandatory.
10. Rate limiting does not replace authentication.
11. Rate limiting does not replace authorization.
12. Rate limiting does not replace input validation.
13. Rate limiting does not replace idempotency.
14. Payment endpoint must still prevent duplicate payment.
15. Order endpoint must still validate business rules.
16. MVP may use simple application-level limiter.
17. Production should use Redis or provider-level distributed rate limiting.
18. Public endpoints should limit by IP and resource when possible.
19. Auth endpoints should limit by IP and email.
20. Authenticated endpoints should limit by userId and business scope.
21. Tenant-level limiting is future SaaS scope.
22. Rate limit responses must use HTTP `429 Too Many Requests`.
23. Rate limit errors must use consistent API response format.
24. Rate limiting events should be logged safely.
25. Rate limit configuration must be documented.

---

## 4. Rules

### 4.1 General Rules

Rate limiting must protect:

```txt
authentication
public customer APIs
payment APIs
expensive report APIs
mutation-heavy APIs
webhook endpoints
```

Rules:

1. Do not expose unlimited sensitive endpoints.
2. Do not rely only on frontend button disabling.
3. Do not use rate limiting as the only protection.
4. Do not reveal sensitive details in rate limit error.
5. Do not rate limit so aggressively that normal staff workflow breaks.
6. Do not use only in-memory limiter in multi-instance production.
7. Do not forget to log repeated abuse safely.

### 4.2 Identity Rules

Rate limit identity may use:

```txt
IP address
email
userId
restaurantId / businessId / tenantId
tableId
sessionId
orderId
API key
```

Use different identity depending on endpoint.

Unauthenticated endpoint:

```txt
IP
email
device/session
```

Authenticated endpoint:

```txt
userId
businessId
role
resource ID
```

Public customer order:

```txt
IP
tableId
customer session
restaurantId
```

Payment endpoint:

```txt
userId
orderId
businessId
```

Report endpoint:

```txt
userId
businessId
report type
```

### 4.3 Response Rules

Rate limited request must return:

```txt
429 Too Many Requests
```

Standard response:

```json
{
  "success": false,
  "message": "Too many requests. Please try again later.",
  "code": "RATE_LIMITED"
}
```

Optional headers:

```txt
Retry-After
X-RateLimit-Limit
X-RateLimit-Remaining
X-RateLimit-Reset
```

Rules:

1. Message must be clear.
2. Response must not expose internal limiter key.
3. UI should show human-friendly retry message.
4. API should not return stack trace.
5. Logs may include safe metadata.

### 4.4 Storage Rules

MVP may use:

```txt
in-memory limiter
```

Only for:

```txt
local development
single instance MVP testing
temporary early stage
```

Production should use:

```txt
Redis
Upstash Redis
Redis Cloud
provider firewall / WAF
database-backed limiter only if traffic is low
```

Rules:

1. In-memory limiter is not reliable across multiple server instances.
2. Serverless environments should use external store.
3. Redis keys must be scoped clearly.
4. Rate limit counters should expire automatically.
5. Do not store sensitive raw data in limiter keys if avoidable.

### 4.5 Key Naming Rules

Rate limit keys must be readable and scoped.

Examples:

```txt
rate:auth:login:ip:{ip}
rate:auth:login:email:{emailHash}
rate:auth:password-reset:email:{emailHash}
rate:customer-order:restaurant:{restaurantId}:table:{tableId}:ip:{ip}
rate:payment:user:{userId}
rate:payment:order:{orderId}
rate:report-export:user:{userId}
rate:report-export:business:{businessId}
```

Rules:

1. Avoid vague keys like `limit:data`.
2. Avoid storing raw email if privacy concern exists.
3. Hash email for rate limit key if needed.
4. Include business scope for tenant-related limits.
5. Include resource ID for resource-specific abuse.

### 4.6 Logging Rules

Rate limit events should be logged when useful.

Log safe metadata:

```txt
endpoint
method
ip hash if needed
userId if authenticated
businessId / restaurantId if available
rate limit key type
retryAfter
timestamp
```

Do not log:

```txt
password
session token
full reset token
payment secret
raw private API key
sensitive request body
```

Repeated rate limit events may indicate:

```txt
brute force
bot traffic
frontend bug
misconfigured polling
abusive user
too strict rate limit
```

---

## 5. Implementation Guide

### 5.1 Endpoint Priority

Rate limiting priority:

```txt
Priority 1:
auth, password reset, payment, public customer order

Priority 2:
report export, analytics, inventory mutation, settings mutation

Priority 3:
general read endpoints, polling endpoints, search endpoints
```

Start with Priority 1.

Do not try to rate limit everything perfectly on day one. That is how a simple feature becomes a tax form.

---

### 5.2 Recommended Limits for MVP

These values are starting points, not eternal law carved into stone tablets.

#### Login

Endpoint:

```txt
POST /api/auth/login
```

Recommended limits:

```txt
per IP:
10 attempts per minute

per email:
5 attempts per 5 minutes
```

Purpose:

```txt
prevent brute force
prevent credential stuffing
```

Response:

```txt
429 RATE_LIMITED
```

#### Register

Endpoint:

```txt
POST /api/auth/register
```

Recommended limits:

```txt
per IP:
3 attempts per hour
```

Purpose:

```txt
prevent spam tenant/user creation
```

#### Password Reset

Endpoint:

```txt
POST /api/auth/password-reset
```

Recommended limits:

```txt
per email:
3 requests per hour

per IP:
5 requests per hour
```

Purpose:

```txt
prevent email spam
prevent account enumeration abuse
```

Response must remain generic:

```txt
If the email exists, reset instructions will be sent.
```

#### Customer Order

Endpoint:

```txt
POST /api/customer/orders
```

Recommended limits:

```txt
per IP:
10 orders per 10 minutes

per table/session:
10 orders per 10 minutes

per restaurant:
configurable safety limit
```

Purpose:

```txt
prevent fake QR order spam
protect kitchen queue
protect database
```

#### Staff Create Order

Endpoint:

```txt
POST /api/restaurant/orders
```

Recommended limits:

```txt
per user:
30 orders per minute

per business:
100 orders per minute
```

Purpose:

```txt
prevent accidental loops
prevent script abuse
```

Normal cashier workflow should not hit this.

#### Payment

Endpoint:

```txt
POST /api/restaurant/payments
```

Recommended limits:

```txt
per user:
10 payment attempts per minute

per order:
3 payment attempts per minute
```

Purpose:

```txt
reduce duplicate payment spam
protect payment flow
```

Still required:

```txt
idempotency
unique constraint
status validation
transaction
```

Rate limiting alone is not payment safety. It is one lock on a door that should have several locks because money makes humans creative.

#### Report Export

Endpoint:

```txt
POST /api/reports/export
```

Recommended limits:

```txt
per user:
5 exports per hour

per business:
20 exports per hour
```

Purpose:

```txt
protect expensive queries
protect file generation
protect cloud cost
```

#### Analytics

Endpoint:

```txt
GET /api/analytics
```

Recommended limits:

```txt
per user:
60 requests per minute

per business:
300 requests per minute
```

Purpose:

```txt
protect database from repeated heavy reads
```

Analytics should also use caching or summary tables if it becomes heavy.

#### Webhook

Endpoint:

```txt
POST /api/webhooks/payment
```

Recommended protection:

```txt
signature verification
idempotency by provider event ID
reasonable IP/provider protection if available
rate limit by source/IP as secondary layer
```

Webhook must not rely on rate limiting alone.

---

### 5.3 Algorithm Strategy

Common algorithms:

```txt
fixed window
sliding window
token bucket
leaky bucket
```

Recommended MVP:

```txt
fixed window or sliding window
```

Recommended production:

```txt
sliding window or token bucket with Redis
```

#### Fixed Window

Simple.

Example:

```txt
10 requests per minute
```

Pros:

```txt
easy to implement
easy to understand
```

Cons:

```txt
can allow burst at window boundary
```

#### Sliding Window

More accurate.

Example:

```txt
10 requests in the last 60 seconds
```

Pros:

```txt
better abuse control
less burst issue
```

Cons:

```txt
more complex
```

#### Token Bucket

Allows controlled burst.

Example:

```txt
capacity 30
refill 1 token per second
```

Pros:

```txt
good for APIs
allows normal burst
controls average rate
```

Cons:

```txt
more implementation complexity
```

For this project:

```txt
start simple
upgrade when needed
```

---

### 5.4 Application-Level Middleware

Create reusable rate limit helper.

Concept:

```ts
type RateLimitConfig = {
  key: string;
  limit: number;
  windowMs: number;
};

async function enforceRateLimit(config: RateLimitConfig) {
  // check counter
  // increment counter
  // throw RATE_LIMITED if exceeded
}
```

Usage:

```ts
await enforceRateLimit({
  key: `rate:auth:login:ip:${ip}`,
  limit: 10,
  windowMs: 60_000,
});
```

For login, combine:

```ts
await enforceRateLimit({
  key: `rate:auth:login:ip:${ip}`,
  limit: 10,
  windowMs: 60_000,
});

await enforceRateLimit({
  key: `rate:auth:login:email:${emailHash}`,
  limit: 5,
  windowMs: 5 * 60_000,
});
```

### 5.5 Backend Integration Pattern

Rate limiting should happen early.

Recommended flow:

```txt
Receive request
↓
Apply endpoint rate limit
↓
Parse and validate basic input if needed
↓
Auth / permission / scope
↓
Business validation
↓
Mutation/query
↓
Response
```

For auth endpoints:

```txt
Receive login request
↓
Rate limit by IP
↓
Validate email/password shape
↓
Rate limit by email
↓
Check credentials
↓
Create session
```

For authenticated endpoints:

```txt
Receive request
↓
Require auth
↓
Rate limit by userId/businessId/resource
↓
Permission check
↓
Validation
↓
Service logic
```

Order matters. Jangan rate limit by `userId` sebelum user-nya diketahui. Ini bukan tebak-tebakan.

---

### 5.6 Rate Limit Error Helper

Use standard error helper.

Example:

```ts
throw new AppError({
  statusCode: 429,
  code: "RATE_LIMITED",
  message: "Too many requests. Please try again later.",
});
```

Response:

```json
{
  "success": false,
  "message": "Too many requests. Please try again later.",
  "code": "RATE_LIMITED"
}
```

Optional:

```ts
headers.set("Retry-After", String(retryAfterSeconds));
```

---

### 5.7 UI Handling

Frontend should handle rate limit response.

Examples:

```txt
Too many login attempts. Try again later.
Too many password reset requests. Try again later.
Too many report exports. Please wait before exporting again.
Too many order attempts from this table. Please call staff.
```

Rules:

1. UI must not show raw internal key.
2. UI should disable retry temporarily if retry time is known.
3. UI should not endlessly retry rate-limited request.
4. Query tools should not refetch aggressively after 429.

---

### 5.8 Polling Rate Control

Kitchen and serving pages may use polling during MVP.

Rules:

1. Do not poll every 100ms.
2. Use reasonable interval.
3. Use different interval by page criticality.
4. Stop polling when tab is inactive if possible.
5. Avoid duplicate polling from multiple components.

Recommended MVP polling:

```txt
Kitchen orders:
3-5 seconds

Serving orders:
3-5 seconds

Analytics:
30-60 seconds or manual refresh

Reports:
manual refresh
```

If polling becomes heavy, consider:

```txt
SSE
WebSocket
cache
query optimization
```

Do not jump to WebSocket just because polling feels “not enterprise.” Enterprise is not measured by how many ways you can overcomplicate a queue.

---

### 5.9 Tenant-Level Rate Limiting

Future SaaS may need tenant-level limiting.

Examples:

```txt
Starter plan:
100 requests per minute

Pro plan:
500 requests per minute

Enterprise:
custom limit
```

Tenant-level limit protects system fairness.

Possible keys:

```txt
rate:tenant:{tenantId}:api
rate:tenant:{tenantId}:orders
rate:tenant:{tenantId}:reports
```

Do not implement complex plan-based rate limit before subscription/billing actually exists.

Document first.

Implement when needed.

---

### 5.10 Provider / Edge Rate Limiting

Production may add edge-level protection.

Possible tools:

```txt
Cloudflare WAF
Vercel Firewall
AWS WAF
Nginx
API Gateway
```

Edge rate limit is good for:

```txt
blocking abusive IPs before app
protecting login endpoint
blocking bot traffic
basic DDoS mitigation
public endpoint protection
```

Application rate limit is good for:

```txt
userId-based limits
businessId-based limits
role-aware limits
resource-specific limits
```

Use both when production needs it.

---

### 5.11 Rate Limit Configuration

Keep rate limit config centralized.

Example:

```ts
export const rateLimitConfig = {
  authLoginIp: {
    limit: 10,
    windowMs: 60_000,
  },
  authLoginEmail: {
    limit: 5,
    windowMs: 5 * 60_000,
  },
  passwordResetEmail: {
    limit: 3,
    windowMs: 60 * 60_000,
  },
  customerOrder: {
    limit: 10,
    windowMs: 10 * 60_000,
  },
  paymentByUser: {
    limit: 10,
    windowMs: 60_000,
  },
  paymentByOrder: {
    limit: 3,
    windowMs: 60_000,
  },
  reportExport: {
    limit: 5,
    windowMs: 60 * 60_000,
  },
} as const;
```

Rules:

1. Do not scatter magic numbers across route handlers.
2. Document why limits exist.
3. Adjust limits based on real usage.
4. Monitor 429 rate after deployment.

---

## 6. Anti-Patterns

Do not:

- Leave login unlimited
- Leave password reset unlimited
- Leave public customer order unlimited
- Leave payment endpoint unlimited
- Use rate limiting as replacement for permission
- Use rate limiting as replacement for payment idempotency
- Use rate limiting as replacement for validation
- Use only frontend disabled button to prevent spam
- Use only in-memory limiter in multi-instance production
- Store sensitive raw data in limiter keys unnecessarily
- Return internal rate limit key to user
- Poll kitchen endpoint every few milliseconds
- Retry 429 responses endlessly
- Rate limit so aggressively that normal cashier flow breaks
- Apply one global limit to every endpoint blindly
- Forget per-resource payment limit
- Forget per-email login/password reset limit
- Use wildcard WAF rules without testing normal users
- Add complex plan-based rate limit before billing exists
- Ignore a sudden spike in 429 responses
- Treat rate limiting as DDoS protection by itself

---

## 7. Checklist

Rate limiting is acceptable when:

- [ ] Login endpoint is rate-limited.
- [ ] Register endpoint is rate-limited.
- [ ] Password reset endpoint is rate-limited.
- [ ] Public customer order endpoint is rate-limited.
- [ ] Payment endpoint is rate-limited.
- [ ] Report export endpoint is rate-limited.
- [ ] Expensive analytics endpoints have reasonable protection.
- [ ] Rate limit response uses HTTP 429.
- [ ] Response format is consistent.
- [ ] Retry message is safe and clear.
- [ ] Auth endpoints use IP and email-based limit.
- [ ] Authenticated endpoints can use userId-based limit.
- [ ] Payment uses userId and orderId/resource-based limit.
- [ ] Rate limit config is centralized.
- [ ] Rate limit events are logged safely.
- [ ] Sensitive data is not stored in raw limiter keys unnecessarily.
- [ ] Production strategy does not rely only on local memory when multi-instance/serverless.
- [ ] Rate limiting does not replace validation, permission, transaction, or idempotency.
- [ ] Polling intervals are reasonable.
- [ ] 429 rate is monitored after deployment.

---

## 8. References

Related documents:

- 00-ai-context.md
- 01-system-design.md
- 04-backend-api.md
- 05-database-storage.md
- 06-auth-permissions.md
- 07-hosting-cloud.md
- 09-security.md
- 11-caching-cdn.md
- 12-error-tracking-logs.md
- 13-monitoring-alerts.md
- 14-testing.md
- appendices/error-codes.md
- appendices/api-response-format.md
- appendices/implementation-rules.md