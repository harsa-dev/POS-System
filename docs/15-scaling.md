# Scaling

## 1. Purpose

This document defines the scaling strategy for POS System V3.

It explains how the system should grow from local MVP to real SaaS usage without prematurely adding unnecessary infrastructure complexity.

The goal is to make the system capable of handling more users, restaurants, orders, payments, inventory records, reports, files, and traffic while keeping the architecture maintainable.

Scaling must be based on measured bottlenecks, not anxiety.

---

## 2. Current Context

POS System V3 is currently a SaaS-style POS and business operating system.

The active mode is:

```txt
Restaurant
```

The current architecture direction is:

```txt
modular monolith first
single main application
single main PostgreSQL database
object storage for files
managed hosting
managed database
simple deployment
```

The system may later support multiple business modes:

```txt
Restaurant
Retail / Supermarket
Raw Material / Livestock / Kandang
Service / Custom Business
```

The system should be designed to grow, but it must not start with heavy infrastructure before the core product is stable.

Out of scope for MVP:

```txt
microservices
Kubernetes
Kafka
multi-region deployment
database sharding
separate database per tenant
complex event-driven architecture
dedicated search cluster
Redis cluster
service mesh
```

Scaling starts with:

```txt
good schema
good indexes
pagination
tenant-scoped queries
safe caching
reasonable polling
object storage
monitoring
rate limiting
clean backend services
```

Not with summoning Kubernetes because one query forgot an index. That would be very human, and therefore suspiciously inefficient.

---

## 3. Decisions

The following scaling decisions are locked:

1. POS System V3 starts as a modular monolith.
2. Scaling must be based on real bottlenecks.
3. PostgreSQL remains the primary source of truth.
4. Database design must support growth from the beginning.
5. Query optimization comes before adding infrastructure.
6. Pagination is mandatory for large lists.
7. Indexes must support common query patterns.
8. Static files must use object storage and CDN.
9. Active operational data must not use unsafe long cache.
10. Redis is future scope unless there is a proven need.
11. Queue/worker is future scope unless background jobs become heavy.
12. WebSocket/SSE is future scope unless polling becomes inefficient.
13. Analytics should not slow down order/payment operations.
14. Reports may need background jobs later.
15. Multi-tenant fairness must be considered.
16. One large tenant must not overload the system for all tenants.
17. Rate limiting protects system stability.
18. Monitoring must identify bottlenecks before scaling decisions.
19. Vertical scaling is acceptable early.
20. Horizontal scaling requires stateless app behavior.
21. App server must not store important state in local memory.
22. Database connection management is important in serverless environments.
23. Microservices are not allowed before modular monolith boundaries are stable.
24. Cost must be monitored as the system grows.
25. Scaling must not break correctness.

---

## 4. Rules

### 4.1 Scaling Mindset Rules

Scaling is not only about traffic.

Scaling includes:

```txt
more users
more staff
more restaurants
more orders
more payments
more inventory records
more files
more reports
more audit logs
more business modes
more developers
more integrations
```

Rules:

1. Build simple first.
2. Measure bottlenecks.
3. Scale the bottleneck.
4. Keep architecture understandable.
5. Do not scale imaginary traffic.
6. Do not add infrastructure just because it sounds enterprise.
7. Do not trade correctness for speed in payment/order/inventory flows.

### 4.2 Premature Scaling Rules

Avoid premature scaling.

Do not start with:

```txt
microservices
Kubernetes
Kafka
database sharding
multi-region
Redis cluster
complex event bus
custom API gateway
```

unless there is a real need.

Premature scaling causes:

```txt
slower development
harder debugging
higher cost
more deployment failure
more hidden complexity
more learning burden
```

For this project:

```txt
modular monolith first
optimize database
add cache only where safe
add worker only when needed
add realtime only when polling is not enough
```

### 4.3 Bottleneck Rules

Before scaling, identify bottleneck.

Possible bottlenecks:

```txt
slow database query
missing index
too much polling
large frontend bundle
large images
too many database connections
heavy analytics query
report export blocking request
unpaginated list
N+1 query
external payment provider latency
logging too noisy
```

Rules:

1. Do not guess bottleneck blindly.
2. Use logs and monitoring.
3. Check slowest endpoints.
4. Check database query patterns.
5. Check database connection usage.
6. Check frontend bundle and image size.
7. Check polling frequency.
8. Fix simple bottlenecks before adding new infrastructure.

### 4.4 Source of Truth Rules

Scaling must not corrupt source of truth.

Source of truth:

```txt
PostgreSQL
```

Cache may improve speed.

Queue may delay work.

CDN may serve static files.

But final business truth remains:

```txt
database + backend business logic
```

Rules:

1. Cache must not decide final payment state.
2. Cache must not decide final stock quantity.
3. Cache must not decide final permission.
4. Queue must not make critical payment state inconsistent.
5. Analytics may be eventually consistent, but payment/order workflow must remain correct.

### 4.5 Stateless App Rules

To scale horizontally, app servers should be stateless.

Do not store important state in app memory:

```txt
session
cart
rate limit counter
uploaded file
job queue
tenant config as permanent truth
```

Use shared storage:

```txt
session:
database or Redis

files:
object storage

rate limit:
Redis or provider-level limiter

jobs:
queue

business data:
PostgreSQL
```

Rules:

1. App instance should be disposable.
2. Restarting app must not lose business data.
3. Multiple app instances must behave consistently.
4. Local memory cache must be treated as temporary optimization only.

### 4.6 Database Scaling Rules

Database is usually the first serious bottleneck.

Before advanced scaling, fix basics:

```txt
schema design
indexes
pagination
select only needed fields
avoid N+1 queries
short transactions
connection pooling
query optimization
summary tables when needed
archival strategy
```

Rules:

1. Do not fetch unlimited rows.
2. Do not do analytics by scanning all history repeatedly.
3. Do not run long transactions unnecessarily.
4. Do not add read replica before fixing bad query.
5. Do not shard before normal indexing and pagination.
6. Monitor connection usage.
7. Monitor slow queries.

### 4.7 Multi-Tenant Scaling Rules

The system must support multiple tenants/businesses.

Current MVP scope:

```txt
restaurantId
```

Future scope:

```txt
businessId / tenantId
```

Rules:

1. Every business-owned query must include scope.
2. Indexes must support tenant-scoped queries.
3. Tenant-heavy activity must not degrade all tenants badly.
4. Future plan-based limits may control resource usage.
5. Tenant data must not leak through cache, logs, or reports.
6. Large tenant behavior must be monitored.

### 4.8 Frontend Scaling Rules

Frontend scaling means the app remains fast as UI/data grows.

Rules:

1. Do not render huge lists without pagination or virtualization.
2. Do not load huge bundles on first page.
3. Do not load all dashboard modules for every role.
4. Do not load full analytics data on cashier page.
5. Optimize images.
6. Lazy load heavy components.
7. Use query caching carefully.
8. Avoid duplicate fetches.

Frontend can become a bottleneck too.

A browser freezing with 50,000 rows is not a backend problem. It is a frontend politely collapsing under bad decisions.

### 4.9 API Scaling Rules

API scaling requires:

```txt
pagination
filtering
efficient query
rate limiting
short transactions
consistent response format
good error handling
monitoring
```

Rules:

1. API must not return unlimited data.
2. API must not expose expensive endpoints without limits.
3. API must validate query params.
4. API must support pagination for large resources.
5. API must protect expensive reports.
6. API must be monitored by latency and error rate.

### 4.10 Realtime Scaling Rules

Restaurant operations may need fresh data.

MVP strategy:

```txt
polling
```

Recommended polling:

```txt
kitchen queue:
3-5 seconds

serving queue:
3-5 seconds

analytics:
30-60 seconds or manual refresh

reports:
manual refresh
```

Future options:

```txt
Server-Sent Events
WebSocket
database realtime provider
pub/sub
```

Rules:

1. Do not poll every few milliseconds.
2. Stop polling when page is inactive if possible.
3. Avoid duplicate polling in multiple components.
4. Move to realtime only when polling becomes inefficient.
5. Realtime must still use backend permission and tenant scope.

### 4.11 Cache Scaling Rules

Cache may help with read-heavy data.

Good cache candidates:

```txt
public menu
categories
public business profile
settings with short TTL
analytics summary
report result
static assets
public images
```

Bad cache candidates:

```txt
payment status
active order status with long TTL
inventory quantity with long TTL
session validity without invalidation
permission forever
private dashboard response in public cache
```

Rules:

1. Cache keys must include tenant scope.
2. Cache invalidation must be planned.
3. TTL must match business risk.
4. Cache must not replace database correctness.
5. Redis should be added only when useful.

### 4.12 Queue and Worker Rules

Queue/worker is useful for slow background tasks.

Good worker candidates:

```txt
report generation
email receipt
invoice PDF generation
large export
notification
analytics precomputation
billing webhook processing
image processing
```

Bad worker candidates for MVP critical sync path:

```txt
basic order creation
basic payment status update
required stock mutation
permission validation
```

Rules:

1. Critical user-facing transaction should complete reliably.
2. Slow non-critical side effects may move to queue later.
3. Queue jobs must be idempotent.
4. Failed jobs must be retryable.
5. Job failure must be logged and monitored.
6. Worker must not silently lose business-critical events.

### 4.13 Storage Scaling Rules

Files must scale outside app server.

Use:

```txt
object storage
CDN
image optimization
file metadata in database
```

Rules:

1. Do not store uploaded files permanently in app filesystem.
2. Do not store large files directly in PostgreSQL.
3. Use object storage for menu images, logos, reports, invoice PDFs.
4. Use CDN for public files.
5. Use signed URLs or backend proxy for private files.
6. Optimize images before serving.
7. Monitor storage usage and bandwidth.

### 4.14 Cost Scaling Rules

Scaling increases cost.

Cost sources:

```txt
hosting
database
storage
bandwidth
serverless invocation
logs
error tracking
monitoring
build minutes
queue
Redis
CDN
```

Rules:

1. Monitor cost.
2. Avoid unnecessary polling.
3. Avoid oversized logs.
4. Optimize images.
5. Limit expensive report generation.
6. Use rate limiting.
7. Match infrastructure to real usage.
8. Do not buy enterprise architecture for portfolio traffic.

Cloud bills do not care about your intentions. They only count usage, like a very boring villain.

---

## 5. Implementation Guide

### 5.1 Scaling Phases

#### Phase 1: Local / Portfolio MVP

Goal:

```txt
core features work
clean architecture
local testing
database schema stable
```

Focus:

```txt
modular folder structure
backend service layer
Prisma schema
basic pagination
basic auth
basic role permission
manual testing
```

Avoid:

```txt
microservices
Redis
queue
advanced monitoring
complex deployment
```

#### Phase 2: Online MVP

Goal:

```txt
app usable online by small test users
```

Focus:

```txt
managed hosting
managed PostgreSQL
object storage
GitHub deployment
environment separation
error tracking
basic monitoring
database backup
```

Add:

```txt
rate limiting for auth/payment/order
query indexes
reasonable polling
structured logs
```

#### Phase 3: Real User Testing

Goal:

```txt
small real businesses can test system
```

Focus:

```txt
staging environment
manual QA checklist
critical tests
monitoring alerts
tenant isolation hardening
backup restore test
performance baseline
```

Add if needed:

```txt
Redis for rate limit/session/cache
background worker for reports
better analytics summary
```

#### Phase 4: Early SaaS

Goal:

```txt
multiple tenants
real subscription/billing
stable operations
```

Focus:

```txt
tenant-level usage limits
plan feature gating
admin dashboard
support tools
strong audit logs
database optimization
cost monitoring
observability
```

Potential additions:

```txt
Redis
queue worker
SSE/WebSocket
summary tables
CDN optimization
```

#### Phase 5: Growth

Goal:

```txt
larger tenants, more data, more traffic
```

Focus:

```txt
read replicas
worker scaling
tenant usage controls
archival strategy
advanced monitoring
dedicated services only if needed
```

Possible future:

```txt
separate analytics service
separate billing worker
separate realtime service
database partitioning
multi-region read strategy
```

Only after actual pressure exists.

---

### 5.2 Frontend Scaling Strategy

Frontend risks:

```txt
large JS bundle
too many client components
heavy dashboard charts
too many rows rendered
unoptimized images
duplicate data fetching
expensive re-renders
```

Actions:

```txt
use route-based splitting
lazy load heavy charts
paginate tables
use virtualized lists for large tables
use image optimization
use TanStack Query/SWR carefully
avoid global state abuse
load role-specific navigation only
```

Examples:

```txt
Owner analytics:
can load charts lazily

Cashier checkout:
must load fast

Kitchen queue:
must be readable and refresh reliably

Inventory movement history:
must use pagination
```

Do not render thousands of rows at once.

The browser is not a warehouse. Stop filling it like one.

---

### 5.3 Backend API Scaling Strategy

API risks:

```txt
unpaginated endpoints
slow database query
fat response payload
too many includes
N+1 query
long transaction
expensive report in request cycle
polling overload
```

Actions:

```txt
pagination
filters
select only needed fields
indexes
query optimization
short transactions
rate limiting
cache safe read-heavy data
background jobs for heavy work
```

Example good endpoint:

```txt
GET /api/orders?status=PAID&page=1&limit=20
```

Bad endpoint:

```txt
GET /api/orders/all
```

Especially if it returns 200,000 rows because apparently the browser needed a life crisis.

---

### 5.4 Database Index Strategy

Common POS queries:

```txt
orders by restaurantId
orders by restaurantId + status
orders by restaurantId + createdAt
orders by restaurantId + status + createdAt
payments by restaurantId + createdAt
inventory by restaurantId
stock movement by inventoryItemId
audit logs by restaurantId + createdAt
```

Recommended indexes:

```prisma
model Order {
  id           String      @id @default(cuid())
  restaurantId String
  orderNumber  String
  status       OrderStatus
  createdAt    DateTime    @default(now())

  @@unique([restaurantId, orderNumber])
  @@index([restaurantId])
  @@index([restaurantId, status])
  @@index([restaurantId, createdAt])
  @@index([restaurantId, status, createdAt])
}
```

Kitchen query:

```ts
await prisma.order.findMany({
  where: {
    restaurantId,
    status: {
      in: ["PAID", "PREPARING"],
    },
  },
  orderBy: {
    createdAt: "asc",
  },
  take: 50,
});
```

Useful index:

```prisma
@@index([restaurantId, status, createdAt])
```

Rules:

1. Index based on query pattern.
2. Do not add random indexes.
3. Monitor slow queries.
4. Use compound indexes for common filter/sort combinations.
5. Add indexes before blaming the cloud provider.

### 5.5 Pagination Strategy

Pagination is mandatory for:

```txt
orders
payments
stock movements
audit logs
inventory items
customers
suppliers
employees
reports
cashflow entries
```

Basic pagination:

```ts
const page = Math.max(Number(searchParams.get("page") ?? 1), 1);
const limit = Math.min(Number(searchParams.get("limit") ?? 20), 100);

const data = await prisma.order.findMany({
  where: {
    restaurantId: user.restaurantId,
  },
  orderBy: {
    createdAt: "desc",
  },
  take: limit,
  skip: (page - 1) * limit,
});
```

For very large data, use cursor pagination:

```ts
await prisma.order.findMany({
  where: {
    restaurantId: user.restaurantId,
  },
  take: limit,
  cursor: cursor ? { id: cursor } : undefined,
  skip: cursor ? 1 : 0,
  orderBy: {
    createdAt: "desc",
  },
});
```

Rules:

1. Default limit should be reasonable.
2. Max limit must be enforced.
3. Do not let frontend request unlimited data.
4. API response should include pagination metadata.

### 5.6 Avoid N+1 Queries

Bad:

```ts
const orders = await prisma.order.findMany();

for (const order of orders) {
  const items = await prisma.orderItem.findMany({
    where: {
      orderId: order.id,
    },
  });
}
```

Better:

```ts
const orders = await prisma.order.findMany({
  include: {
    items: true,
  },
});
```

Or select only needed fields:

```ts
const orders = await prisma.order.findMany({
  select: {
    id: true,
    orderNumber: true,
    status: true,
    totalAmount: true,
    items: {
      select: {
        id: true,
        itemNameSnapshot: true,
        quantity: true,
      },
    },
  },
});
```

Rules:

1. Avoid query inside loop when possible.
2. Use include/select carefully.
3. Do not include huge relations unnecessarily.
4. Monitor query count and duration.

### 5.7 Database Connection Strategy

Serverless platforms may create many database connections.

Risks:

```txt
connection exhaustion
slow queries
Prisma connection pressure
database timeout
```

Actions:

```txt
use provider-recommended pooling
reuse Prisma client in development
avoid creating PrismaClient per request
monitor connection usage
use pooled DATABASE_URL if provider recommends it
```

Rules:

1. Do not instantiate PrismaClient repeatedly.
2. Monitor database connection usage.
3. Use connection pooling when needed.
4. Keep transactions short.

### 5.8 Analytics Scaling Strategy

Analytics can become expensive.

Bad:

```txt
every dashboard load scans all orders forever
```

Better:

```txt
filter by date range
use indexes
cache summary briefly
use daily summary table later
generate heavy reports in background
```

Potential summary tables:

```txt
daily_sales_summary
product_sales_summary
cashier_shift_summary
payment_method_summary
inventory_daily_summary
```

Rules:

1. Analytics must not slow payment/order operations.
2. Date range must be limited.
3. Heavy reports should be rate-limited.
4. Generated reports may use worker later.
5. Dashboard should show last updated timestamp when cached.

### 5.9 Polling to Realtime Evolution

MVP:

```txt
polling
```

Kitchen:

```txt
GET /api/kitchen/orders every 3-5 seconds
```

Serving:

```txt
GET /api/serving/orders every 3-5 seconds
```

When polling becomes too heavy:

```txt
increase interval
reduce payload
stop polling inactive tabs
use query invalidation after mutations
add SSE
add WebSocket
add pub/sub
```

Realtime evolution:

```txt
Polling
↓
Polling optimized
↓
SSE for server-to-client updates
↓
WebSocket if two-way realtime is needed
↓
Dedicated realtime service if scale requires it
```

Rules:

1. Do not start with WebSocket unless needed.
2. Realtime must preserve auth and tenant scope.
3. Realtime events must not leak data between tenants.
4. Realtime failure should degrade gracefully.

### 5.10 Queue and Worker Evolution

Start without worker unless needed.

Add worker when:

```txt
report export blocks request too long
invoice PDF generation is slow
email sending slows API
image processing is heavy
analytics precompute is needed
webhook processing needs retry
```

Potential queue tools:

```txt
BullMQ + Redis
Cloudflare Queues
AWS SQS
RabbitMQ
Upstash QStash
```

Worker job examples:

```txt
generateSalesReport
sendReceiptEmail
generateInvoicePdf
processUploadedImage
recalculateDailySummary
syncPaymentWebhook
```

Rules:

1. Jobs must be idempotent.
2. Jobs must have retry policy.
3. Failed jobs must be logged.
4. Job queue must be monitored.
5. Critical state change should not depend on invisible unreliable background work.

### 5.11 Cache Evolution

No cache first for critical flows.

Add cache gradually:

```txt
static assets via CDN
public images via CDN
frontend query cache
menu short cache
settings short cache
analytics summary cache
Redis for shared cache if needed
```

Redis use cases:

```txt
rate limiting
session store
distributed cache
queue
pub/sub
```

Rules:

1. Use cache for read-heavy safe data.
2. Invalidate cache after mutation.
3. Include tenant scope in cache key.
4. Do not cache private data publicly.
5. Monitor cache hit rate if cache becomes important.

### 5.12 Storage Scaling Strategy

Use object storage from the beginning for files.

File types:

```txt
menu images
restaurant logo
user avatar
invoice PDF
report export
payment proof
attachments
```

Good architecture:

```txt
Browser
↓
CDN
↓
Object Storage
```

Not:

```txt
Browser
↓
App Server
↓
Local File System
```

Rules:

1. Store file metadata in database.
2. Store file itself in object storage.
3. Use CDN for public images.
4. Use signed URL/private access for private files.
5. Optimize image format and size.
6. Monitor storage and bandwidth cost.

### 5.13 Tenant Growth Strategy

Tenant growth stages:

```txt
1 tenant:
simple MVP

10 tenants:
tenant isolation must be reliable

100 tenants:
monitor resource usage, backups, support tools

1000 tenants:
plan limits, admin tools, stronger observability, query optimization
```

Tenant scaling needs:

```txt
tenant-scoped indexes
tenant-aware cache keys
tenant-aware logs
tenant-aware metrics
tenant usage tracking
tenant plan/quota later
```

Possible future tenant quotas:

```txt
orders per month
staff count
report exports
storage usage
API usage
outlet count
```

Rules:

1. Do not implement complex quota before billing exists.
2. Design data model so quota can be added later.
3. Track usage where business value exists.
4. Protect system from one tenant overusing resources.

### 5.14 Scaling by Business Mode

Future modes may have different scaling pressure.

#### Restaurant

Pressure:

```txt
active orders
kitchen queue
serving queue
payment speed
short operational latency
```

#### Retail / Supermarket

Pressure:

```txt
large product catalog
barcode scanning
stock movement
checkout speed
receipt generation
```

#### Raw Material / Livestock / Kandang

Pressure:

```txt
batch records
weighing records
lot tracking
production history
stock transformation
large operational logs
```

#### Service / Custom Business

Pressure:

```txt
job tracking
assignment
scheduling
client records
invoice lifecycle
```

Rules:

1. Shared core should scale independently of mode-specific complexity.
2. Do not force one mode’s scaling problem into all modes.
3. Add mode-specific indexes and summaries when the mode is implemented.
4. Keep mode-specific workflows isolated.

### 5.15 Vertical Scaling Strategy

Vertical scaling means upgrading resources.

Examples:

```txt
larger database plan
more CPU/RAM
higher hosting plan
larger storage
higher connection limit
```

Use vertical scaling when:

```txt
system is early
architecture is still simple
bottleneck is resource capacity
cost is acceptable
```

Benefits:

```txt
fast
simple
less architecture change
```

Limits:

```txt
can become expensive
has maximum size
does not fix bad queries
does not solve all availability issues
```

Vertical scaling is often enough early.

Elegant, boring, and therefore useful.

### 5.16 Horizontal Scaling Strategy

Horizontal scaling means adding instances.

Requires:

```txt
stateless app
shared database
shared file storage
shared session/rate limit if needed
load balancer or platform routing
safe deployment strategy
```

Use horizontal scaling when:

```txt
app CPU/memory is bottleneck
traffic exceeds one instance capacity
availability needs improve
hosting platform supports it
```

Risks:

```txt
database connection explosion
in-memory session breaks
local file upload breaks
cache inconsistency
more complex debugging
```

Rules:

1. Make app stateless before horizontal scaling.
2. Move shared state out of app memory.
3. Monitor database connections.
4. Use provider autoscaling carefully.

### 5.17 When to Consider Microservices

Microservices may be considered only when:

```txt
modular monolith boundaries are stable
team size grows
deployment conflicts become real
one module needs independent scaling
one module has very different runtime needs
business needs justify complexity
```

Possible future services:

```txt
billing service
reporting/analytics service
realtime service
notification service
file processing service
integration service
```

Do not split:

```txt
orders
payments
inventory
auth
```

too early if they still require strong consistency and are maintained by one person.

Microservices too early are not architecture. They are fragmentation with a logo.

---

## 6. Anti-Patterns

Do not:

- Start with Kubernetes for MVP
- Start with microservices before modular monolith is stable
- Add Kafka before simple events exist
- Add Redis without a clear use case
- Add WebSocket before polling is proven insufficient
- Add queue for critical payment state without strong consistency plan
- Fetch all orders without pagination
- Render thousands of rows in frontend
- Serve uploaded files from app server filesystem
- Store large files in PostgreSQL
- Cache payment status with long TTL
- Cache inventory quantity with long TTL
- Cache tenant data without tenant scope
- Ignore database indexes
- Ignore N+1 queries
- Ignore database connection limits
- Let analytics slow down payment/order flow
- Scale app server when database query is the real bottleneck
- Add read replica before fixing bad queries
- Shard database before needing it
- Build all business modes before Restaurant mode is stable
- Optimize for imaginary millions of users
- Ignore cloud cost
- Treat scaling as more important than correctness

---

## 7. Checklist

Scaling strategy is acceptable when:

- [ ] Modular monolith is the default architecture.
- [ ] Scaling decisions are based on measured bottlenecks.
- [ ] Database queries are tenant-scoped.
- [ ] Large list endpoints use pagination.
- [ ] Common queries have indexes.
- [ ] API responses avoid unnecessary large payloads.
- [ ] N+1 queries are avoided.
- [ ] Prisma client is not recreated per request unnecessarily.
- [ ] Database connection usage is monitored.
- [ ] Static files use object storage.
- [ ] Public assets use CDN when appropriate.
- [ ] Private files are protected.
- [ ] Kitchen/serving polling interval is reasonable.
- [ ] Heavy reports are rate-limited.
- [ ] Analytics does not slow critical order/payment flow.
- [ ] Cache is used only where safe.
- [ ] Cache keys include tenant scope.
- [ ] Redis is added only when needed.
- [ ] Queue/worker is added only when needed.
- [ ] App can become stateless for horizontal scaling.
- [ ] Cost is monitored.
- [ ] Microservices are delayed until justified.
- [ ] Correctness is not sacrificed for speed.

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
- 10-rate-limiting.md
- 11-caching-cdn.md
- 12-error-tracking-logs.md
- 13-monitoring-alerts.md
- 14-testing.md
- 16-and-more.md
- appendices/status-transitions.md
- appendices/implementation-rules.md