# Caching & CDN

## 1. Purpose

This document defines the caching and CDN strategy for POS System V3.

It explains what data may be cached, what data must not be cached, how cache invalidation should work, how CDN should be used, how browser/server/API cache should be handled, and how to avoid stale business-critical data.

The goal is to improve performance without breaking correctness.

Caching must make the system faster, not more confidently wrong.

---

## 2. Current Context

POS System V3 is a web-based SaaS-style POS and business operating system.

The active mode is:

```txt
Restaurant / F&B
```

The system handles data with different freshness requirements:

```txt
highly dynamic:
orders
kitchen queue
serving queue
payments
inventory quantity
stock movements
cashier cart
sessions

moderately dynamic:
menu items
categories
settings
employees
tables
analytics summary

mostly static:
public images
logo
icons
landing page assets
documentation assets
compiled frontend assets
```

The current MVP may not need advanced Redis caching.

Recommended MVP strategy:

```txt
use simple browser/CDN cache for static assets
use frontend query caching for server state
avoid caching critical mutations
use polling carefully for kitchen/serving
add Redis only when needed
```

---

## 3. Decisions

The following caching and CDN decisions are locked:

1. Database remains the final source of truth.
2. Backend remains the business decision maker.
3. Cache must not become the source of truth.
4. Critical business data must be treated carefully.
5. Payment status must not rely on stale cache.
6. Inventory quantity must not rely on stale cache.
7. Order workflow status must not rely on stale cache.
8. Auth/session data must not be publicly cached.
9. Tenant/business data must never leak through shared cache.
10. Static assets should use CDN caching.
11. Public images may use CDN caching.
12. Private files must not be publicly cached.
13. Frontend server state may use query caching.
14. Cache keys must include business scope when data is tenant-owned.
15. Cache invalidation must be planned before caching dynamic data.
16. Redis is future scope unless a real bottleneck exists.
17. Realtime features should not be replaced by unsafe long-lived cache.
18. Analytics may use caching when data is expensive to compute.
19. Reports may use generated file cache when safe.
20. Caching must be observable and debuggable.

---

## 4. Rules

### 4.1 Source of Truth Rules

Cache is not source of truth.

Source of truth:

```txt
PostgreSQL
```

Business decision maker:

```txt
Backend service layer
```

Cache may store:

```txt
temporary copy
derived data
static assets
public images
query result snapshots
analytics summaries
```

Cache must not decide:

```txt
payment is final
stock is final
order status is final
permission is final
session is valid forever
tenant access is valid forever
```

### 4.2 Cache Safety Rules

Safe to cache:

```txt
static frontend assets
public menu images
business logo if public
public landing page content
compiled JS/CSS chunks
icons
documentation
mostly-read menu list with short TTL
analytics summary with clear timestamp
```

Use caution:

```txt
menu items
categories
business settings
employee list
table list
invoice list
reports
```

Avoid or keep very short cache:

```txt
active orders
kitchen queue
serving queue
payment status
inventory quantity
stock movement
current user permission
session state
cashier shift state
```

Never publicly cache:

```txt
auth session
user profile
private business data
audit logs
payment details
private invoices
report exports
customer personal data
internal dashboard API response
```

### 4.3 Tenant Cache Rules

Every tenant-owned cache key must include business scope.

Current MVP:

```txt
restaurantId
```

Future V3:

```txt
businessId
tenantId
```

Bad cache key:

```txt
orders:list
menu:list
analytics:summary
```

Good cache key:

```txt
restaurant:{restaurantId}:menu:list
restaurant:{restaurantId}:orders:status:{status}
restaurant:{restaurantId}:analytics:summary:{dateRange}
```

Rules:

1. Cache key must include business scope.
2. Cache key must include filters when response depends on filters.
3. Cache key must include role/permission if response depends on user access.
4. Never share tenant data across tenants.
5. Do not cache scoped data in a global public cache.

### 4.4 Invalidation Rules

Any cached dynamic data must have invalidation rules.

Examples:

```txt
menu updated:
invalidate menu list cache

order created:
invalidate active order list
invalidate kitchen queue if status is PAID
invalidate table status if table used

payment created:
invalidate order detail
invalidate payment list
invalidate kitchen queue
invalidate analytics summary

stock adjusted:
invalidate inventory list
invalidate stock movement list
invalidate low-stock alert

settings updated:
invalidate settings cache
invalidate pricing/tax config cache
```

Rules:

1. Do not cache dynamic data without invalidation plan.
2. Mutation must invalidate affected cache.
3. TTL alone is not enough for critical workflows.
4. Cache invalidation should happen after successful database mutation.
5. Failed mutation must not invalidate as if successful.

### 4.5 TTL Rules

TTL means time-to-live.

Suggested MVP TTL:

```txt
static assets:
long cache, hashed filenames

public images:
long cache, versioned URL if updated

menu list:
30 seconds to 5 minutes depending on usage

settings:
30 seconds to 5 minutes

analytics summary:
1 minute to 15 minutes depending on freshness need

reports:
cache generated file if inputs are identical and access is safe

active orders:
no cache or very short cache

kitchen queue:
no cache or polling-based fresh query

payment status:
no cache or very short cache

inventory quantity:
no cache or very short cache
```

Rules:

1. Short TTL for operational data.
2. Long TTL only for static/versioned assets.
3. Do not cache sensitive data in browser storage casually.
4. TTL must match business risk.
5. A stale menu image is fine. A stale payment status is not.

### 4.6 Browser Cache Rules

Browser cache may be used for:

```txt
static assets
images
fonts
public files
compiled frontend chunks
```

Browser cache must not be used for:

```txt
auth response
payment detail
audit logs
private dashboard API
private report export
session token
sensitive user data
```

For sensitive API responses, use headers like:

```txt
Cache-Control: no-store
```

For static assets:

```txt
Cache-Control: public, max-age=31536000, immutable
```

Only use long cache for versioned or hashed assets.

### 4.7 CDN Rules

CDN is good for:

```txt
static assets
public images
landing page
public menu images
business logo
downloadable public files
```

CDN is not for:

```txt
private dashboard API
tenant financial data
auth/session routes
payment routes
audit logs
private reports
```

Rules:

1. CDN must not cache private API responses.
2. CDN must not expose private files.
3. CDN cache should use versioned file names when assets change.
4. Private files should use signed URLs or backend proxy.
5. Public assets may use aggressive cache.

### 4.8 Frontend Query Cache Rules

Frontend query cache may use:

```txt
TanStack Query
SWR
Next.js fetch cache when appropriate
```

Frontend query cache is useful for:

```txt
menu list
orders list
kitchen queue polling
serving queue polling
inventory list
settings
analytics
```

Rules:

1. Query keys must be specific.
2. Query keys must include filters and scope if available.
3. Mutations must invalidate related query keys.
4. Do not keep critical data stale for too long.
5. Do not use optimistic update for critical payment/stock/status unless carefully controlled.

Bad query key:

```ts
["data"]
```

Good query key:

```ts
["restaurant-orders", restaurantId, { status, page, limit }]
```

Humanity has suffered enough from `["data"]`.

### 4.9 Server Cache Rules

Server cache may be used for:

```txt
expensive analytics
configuration that rarely changes
public menu rendering
feature flags
permission maps if invalidation exists
```

Server cache must be careful with:

```txt
current user
permissions
business settings
tenant-scoped records
```

Rules:

1. Server cache key must include business scope.
2. Server cache key must include user/role if response depends on permission.
3. Do not cache personalized response globally.
4. Do not cache private response as public.
5. Server cache must be invalidated on mutation.

### 4.10 Redis Rules

Redis is future scope unless needed.

Redis may be useful for:

```txt
rate limiting
session store
distributed cache
job queue
realtime pub/sub
frequently accessed settings
analytics summary cache
```

Redis should not be added just because it sounds “enterprise.”

Add Redis when:

```txt
rate limiting needs external store
serverless instances need shared counters
database reads become expensive
cache invalidation strategy exists
background jobs need queue
```

Rules:

1. Redis must not replace PostgreSQL as source of truth.
2. Redis cache keys must include tenant scope.
3. Redis values must not store unnecessary secrets.
4. Redis TTL must be configured.
5. Redis failure should not corrupt business data.

---

## 5. Implementation Guide

### 5.1 Caching Layers

Possible caching layers:

```txt
Browser cache
Frontend query cache
Next.js route/data cache
Server memory cache
Redis cache
CDN cache
Database query optimization
```

Recommended MVP usage:

```txt
Browser/CDN cache:
static assets and public images

Frontend query cache:
dashboard data fetching

Server cache:
minimal, only if needed

Redis:
not required at first

Database:
proper indexes and pagination first
```

Do not use cache to hide bad queries before checking indexes and pagination.

---

### 5.2 Static Asset Caching

Static assets should use long cache when filenames are versioned.

Examples:

```txt
JS chunks
CSS chunks
icons
public static images
```

Recommended header:

```txt
Cache-Control: public, max-age=31536000, immutable
```

Rules:

1. Use long cache for hashed assets.
2. Do not use long cache for assets that change without filename change.
3. Use CDN for public static assets.
4. Optimize image size before serving.

---

### 5.3 Public Image Caching

Public images:

```txt
menu image
business logo
landing page image
public category image
```

Recommended strategy:

```txt
store in object storage
serve through CDN
use long cache
change URL/file key when image changes
```

Example file key:

```txt
restaurants/{restaurantId}/menu/{menuItemId}/{fileVersion}.webp
```

Rules:

1. Public image URL may be cached.
2. Updated image should create new file key or version.
3. Do not overwrite same file path if CDN cache is long.
4. Compress images.
5. Prefer WebP/AVIF when possible.

---

### 5.4 Private File Caching

Private files:

```txt
invoice PDF
report export
payment proof
internal attachment
audit export
```

Rules:

1. Do not expose private files through public CDN URL.
2. Use signed URL with expiration or backend proxy.
3. Validate user permission before access.
4. Include business scope in file metadata.
5. Do not cache private file response publicly.

Recommended header:

```txt
Cache-Control: private, no-store
```

or carefully:

```txt
Cache-Control: private, max-age=60
```

depending on sensitivity.

---

### 5.5 API Cache Headers

Sensitive API routes should use:

```txt
Cache-Control: no-store
```

Examples:

```txt
/api/auth/me
/api/auth/login
/api/restaurant/payments
/api/restaurant/orders/:id
/api/audit-logs
/api/settings
```

Public static-ish API routes may use short cache:

```txt
/api/public/menu
/api/public/business-profile
```

Example:

```txt
Cache-Control: public, max-age=60, stale-while-revalidate=300
```

Only if the endpoint is truly public and safe.

---

### 5.6 Frontend Query Cache Example

Example query key strategy:

```ts
const queryKey = [
  "restaurant-orders",
  restaurantId,
  {
    status,
    page,
    limit,
  },
];
```

After creating order:

```ts
queryClient.invalidateQueries({
  queryKey: ["restaurant-orders", restaurantId],
});
```

After payment:

```ts
queryClient.invalidateQueries({
  queryKey: ["restaurant-orders", restaurantId],
});

queryClient.invalidateQueries({
  queryKey: ["restaurant-kitchen-orders", restaurantId],
});

queryClient.invalidateQueries({
  queryKey: ["restaurant-payments", restaurantId],
});
```

Rules:

1. Mutations must invalidate related queries.
2. Do not invalidate the entire app if only one feature changed.
3. Do not leave stale payment/order state after mutation.
4. Use clear query key naming.

---

### 5.7 Restaurant Operational Cache Strategy

#### Orders

Active orders:

```txt
no long cache
short frontend query stale time only
invalidate after mutation
```

Use:

```txt
polling
manual refresh
query invalidation
```

#### Kitchen Queue

Kitchen queue must stay fresh.

MVP strategy:

```txt
poll every 3-5 seconds
invalidate after payment/status update
no long server cache
```

Future:

```txt
SSE
WebSocket
realtime provider
```

#### Serving Queue

Serving queue must stay fresh.

MVP strategy:

```txt
poll every 3-5 seconds
invalidate after kitchen marks READY
invalidate after serving status update
```

#### Payments

Payment data must be fresh.

Strategy:

```txt
no long cache
invalidate after payment mutation
prevent duplicate payment in backend
```

#### Inventory

Inventory quantity is sensitive.

Strategy:

```txt
short query cache
invalidate after stock mutation
do not trust stale frontend quantity for backend decision
```

Backend must re-check stock before mutation.

---

### 5.8 Analytics Cache Strategy

Analytics can be expensive.

Analytics may use cache if:

```txt
query is expensive
data does not need second-level freshness
dashboard can show "last updated"
```

Recommended:

```txt
cache analytics summary 1-5 minutes
show last calculated timestamp
allow manual refresh
invalidate after major mutation if needed
```

Example cache key:

```txt
restaurant:{restaurantId}:analytics:{dateRange}:{filters}
```

Rules:

1. Analytics cache must include date range and filters.
2. Analytics cache must include business scope.
3. UI should show timestamp if data may be stale.
4. Financial report must be accurate when exported.

---

### 5.9 Report Cache Strategy

Reports can be cached if input is identical.

Report cache key may include:

```txt
businessId / restaurantId
report type
date range
filters
user permission context if needed
format
```

Example:

```txt
restaurant:{restaurantId}:report:sales:{from}:{to}:{format}
```

Rules:

1. Private report files must not be public.
2. Report access must check permission.
3. Cached report must not leak across tenants.
4. Regenerate report when source data changes if accuracy is required.
5. Show generated timestamp.

---

### 5.10 Settings Cache Strategy

Business settings affect behavior.

Examples:

```txt
tax rate
service charge
currency
enabled payment methods
receipt footer
mode access
```

Settings may be cached briefly, but must invalidate on update.

Rules:

1. Backend must fetch fresh settings for critical calculation if needed.
2. Settings update must invalidate settings cache.
3. Pricing/tax calculation must not use stale settings when correctness matters.
4. Settings response must be tenant-scoped.

---

### 5.11 Permission Cache Strategy

Permissions may be cached carefully.

Rules:

1. Permission cache must be user-scoped.
2. Permission cache must be invalidated when role/permission changes.
3. Permission cache must not override backend checks.
4. Do not keep stale permission too long.
5. Inactive user must be rejected even if permission cache says allowed.

Possible key:

```txt
user:{userId}:permissions
```

TTL:

```txt
short TTL
```

Important: backend still owns authorization.

---

### 5.12 Cache Invalidation Map

Recommended invalidation map:

```txt
Menu item create/update/delete:
- menu list
- public menu
- category menu cache

Order created:
- order list
- order detail
- table status
- analytics summary

Payment created:
- order detail
- payment list
- kitchen queue
- analytics summary
- cashflow summary

Kitchen status updated:
- kitchen queue
- serving queue if READY
- order detail
- order list

Serving status updated:
- serving queue
- order detail
- order list
- analytics summary if completed

Stock adjusted:
- inventory list
- stock movement list
- low-stock summary

Settings updated:
- settings
- pricing config
- receipt config

Role/permission updated:
- current user
- permission cache
- navigation data
```

---

### 5.13 CDN Configuration

CDN should handle:

```txt
static assets
public images
public downloads
landing page assets
```

CDN must not cache:

```txt
dashboard API
auth API
payment API
private file API
tenant financial data
audit logs
```

CDN rules:

```txt
public static:
cache long

private API:
no-store

public API:
short cache if safe
```

If using signed URLs:

```txt
short expiration
permission checked before creating URL
tenant scope checked
```

---

### 5.14 Cache Debugging

Cache bugs are annoying because stale data looks valid.

Debug by checking:

```txt
cache key
TTL
scope included or not
invalidated after mutation or not
browser cache
CDN cache
frontend query cache
server cache
Redis cache
```

Useful debug metadata in development:

```txt
X-Cache: HIT / MISS / BYPASS
X-Cache-Key: safe-debug-key
X-Data-Updated-At
```

Do not expose sensitive cache keys in production response.

---

## 6. Anti-Patterns

Do not:

- Treat cache as source of truth
- Cache payment status for too long
- Cache inventory quantity for too long
- Cache active order status for too long
- Cache tenant data without tenant scope
- Publicly cache private dashboard API
- Publicly cache audit logs
- Publicly cache private reports
- Use one global cache key for all tenants
- Use vague cache keys like `data`
- Cache personalized response globally
- Forget invalidation after mutation
- Use TTL as the only strategy for critical data
- Add Redis before there is a clear need
- Use CDN for private files without access control
- Keep old image URL with long CDN cache after update
- Use optimistic UI for payment/stock/status without backend confirmation
- Hide slow database queries behind cache without fixing indexes
- Ignore stale data bugs
- Cache permission forever
- Cache inactive user session as valid forever

---

## 7. Checklist

Caching and CDN strategy is acceptable when:

- [ ] Database remains source of truth.
- [ ] Cache is not used for final business decisions.
- [ ] Static assets use proper long cache.
- [ ] Public images can use CDN cache.
- [ ] Private files are not publicly cached.
- [ ] Sensitive API routes use `no-store`.
- [ ] Tenant-owned cache keys include business scope.
- [ ] Query keys are specific and not vague.
- [ ] Dynamic data has invalidation rules.
- [ ] Mutations invalidate related cache.
- [ ] Active order, payment, and inventory data do not use unsafe long cache.
- [ ] Kitchen and serving queues remain fresh.
- [ ] Analytics cache shows reasonable freshness behavior.
- [ ] Report cache is tenant-scoped and permission-safe.
- [ ] Permission cache is user-scoped and short-lived.
- [ ] CDN does not cache private dashboard/API data.
- [ ] Redis is only added when needed.
- [ ] Cache behavior is debuggable.

---

## 8. References

Related documents:

- 00-ai-context.md
- 01-system-design.md
- 02-system-architecture.md
- 03-frontend.md
- 04-backend-api.md
- 05-database-storage.md
- 07-hosting-cloud.md
- 09-security.md
- 10-rate-limiting.md
- 12-error-tracking-logs.md
- 13-monitoring-alerts.md
- 15-scaling.md
- appendices/api-response-format.md
- appendices/implementation-rules.md