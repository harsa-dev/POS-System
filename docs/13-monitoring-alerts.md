# Monitoring & Alerts

## 1. Purpose

This document defines the monitoring and alerting strategy for POS System V3.

It explains what must be monitored, which metrics matter, what alerts should exist, what thresholds are recommended, how incidents should be handled, and how monitoring supports reliability, debugging, security, and business operations.

The goal is to detect problems before users report them.

This document does not replace error tracking, logs, security, backend API, database, testing, or scaling documents. Monitoring works together with them.

---

## 2. Current Context

POS System V3 is a SaaS-style business application.

The active mode is:

```txt
Restaurant / F&B
```

The system includes business-critical workflows:

```txt
auth
order creation
payment
kitchen queue
serving queue
inventory
stock movement
analytics
reports
settings
audit logs
```

If these workflows fail, real business operations may be affected.

Examples:

```txt
cashier cannot create order
payment does not update order to PAID
kitchen does not receive paid order
serving queue does not show READY order
inventory stock mutation fails
owner analytics becomes extremely slow
database connection pool is exhausted
```

Monitoring must help answer:

```txt
is the app online?
is the API healthy?
is the database healthy?
are critical endpoints slow?
are errors increasing?
are orders getting stuck?
are payments failing?
are kitchen/serving flows delayed?
is traffic abnormal?
is rate limiting triggered too often?
is cloud cost rising unexpectedly?
```

Without monitoring, user complaints become your alert system. Very efficient, if your business model is public embarrassment.

---

## 3. Decisions

The following monitoring and alerting decisions are locked:

1. Production must have uptime monitoring.
2. Production should have a health check endpoint.
3. API latency must be monitored.
4. API error rate must be monitored.
5. Database health must be monitored.
6. Auth health must be monitored.
7. Order flow must be monitored.
8. Payment flow must be monitored.
9. Kitchen and serving flow should be monitored.
10. Inventory mutation failures should be monitored.
11. Report/export failures should be monitored.
12. Rate limit spikes should be monitored.
13. Error tracking must be connected to monitoring when possible.
14. Logs must support monitoring investigation.
15. Alerts must be actionable.
16. Alerts must not be too noisy.
17. Critical alerts must notify the developer/operator.
18. Warning alerts should identify early risk.
19. Monitoring must include environment context.
20. Production and staging monitoring must be separated.
21. Business metrics may be monitored separately from system metrics.
22. Monitoring must not expose sensitive data.
23. Monitoring must not log secrets.
24. Monitoring must help incident response.
25. Monitoring should evolve based on real usage.

---

## 4. Rules

### 4.1 Monitoring vs Logs vs Error Tracking Rules

These systems are related but different.

```txt
Logs:
what happened?

Error tracking:
what error occurred, where, how often, and in which release?

Monitoring:
is the system healthy?

Alerts:
does a human need to act?
```

Rules:

1. Logs must provide event details.
2. Error tracking must capture exceptions and stack traces.
3. Monitoring must track health and metrics.
4. Alerts must notify when thresholds are crossed.
5. These systems should share requestId/release/environment when possible.

### 4.2 Golden Signals Rules

The system should monitor the four golden signals:

```txt
latency
traffic
errors
saturation
```

#### Latency

How long requests take.

Examples:

```txt
POST /api/restaurant/orders p95 latency
POST /api/restaurant/payments p95 latency
GET /api/restaurant/kitchen/orders p95 latency
```

#### Traffic

How many requests happen.

Examples:

```txt
requests per minute
orders per minute
payments per minute
kitchen polling requests per minute
```

#### Errors

How many requests fail.

Examples:

```txt
5xx error rate
payment failure rate
order creation failure rate
database timeout count
```

#### Saturation

How close the system is to resource limits.

Examples:

```txt
database connections
CPU
memory
storage
queue backlog
serverless function limits
```

### 4.3 RED Method Rules

For APIs, monitor RED:

```txt
Rate
Errors
Duration
```

Examples:

```txt
Rate:
POST /api/restaurant/orders = 20 requests/minute

Errors:
POST /api/restaurant/payments = 5% error rate

Duration:
GET /api/restaurant/kitchen/orders p95 = 800ms
```

Rules:

1. Monitor request rate.
2. Monitor error rate.
3. Monitor p50, p95, and p99 latency when possible.
4. Prioritize critical endpoints.
5. Do not rely only on average latency.

Average latency hides pain.

p95 and p99 show where users are actually suffering, because statistics enjoy exposing lies.

### 4.4 USE Method Rules

For infrastructure, monitor USE:

```txt
Utilization
Saturation
Errors
```

Examples:

```txt
CPU utilization
memory utilization
database connection saturation
disk/storage usage
network errors
database errors
```

Rules:

1. Monitor database resource usage.
2. Monitor app/server resource usage if available.
3. Monitor storage usage.
4. Monitor queue/worker backlog if workers exist.
5. Alert before resource exhaustion.

### 4.5 Alert Quality Rules

Alerts must be actionable.

Bad alert:

```txt
Something is wrong.
```

Good alert:

```txt
POST /api/restaurant/payments 5xx error rate > 5% for 5 minutes in production.
```

Alert should include:

```txt
environment
service
endpoint or metric
threshold
current value
duration
severity
link to dashboard/logs if available
```

Rules:

1. Alerts must explain what failed.
2. Alerts must include severity.
3. Alerts must avoid vague messages.
4. Alerts must avoid excessive noise.
5. Alerts must be tested if possible.

### 4.6 Severity Rules

Use severity levels:

```txt
info
warning
critical
```

#### info

Useful notification, no immediate action.

Examples:

```txt
deployment completed
backup completed
daily summary generated
```

#### warning

Potential issue, action may be needed soon.

Examples:

```txt
database connection usage > 80%
API p95 latency rising
report export failures increasing
```

#### critical

Immediate attention required.

Examples:

```txt
app is down
database unavailable
payment API error rate high
all login attempts failing
production health check failing
```

Do not make everything critical.

That is how alerts become background noise, and then the actual disaster politely walks through the front door.

---

## 5. Implementation Guide

### 5.1 Recommended MVP Monitoring Stack

MVP monitoring stack:

```txt
Uptime monitoring:
UptimeRobot / Better Stack

Error tracking:
Sentry

Logs:
hosting provider logs + structured app logs

Database monitoring:
database provider dashboard

Deployment monitoring:
Vercel / hosting provider deployment logs
```

Good MVP setup:

```txt
GET /api/health monitored every 1 minute
Sentry enabled for frontend/backend errors
critical API logs structured
database provider alerts enabled
manual smoke test after deploy
```

Future production stack may include:

```txt
Grafana
Prometheus
Datadog
New Relic
Axiom
Better Stack Logs
Grafana Loki
OpenTelemetry
```

Do not start with a NASA dashboard before login works. Monitoring should serve the product, not become the product.

---

### 5.2 Health Check Endpoint

Create a health endpoint:

```txt
GET /api/health
```

Simple response:

```json
{
  "status": "ok",
  "timestamp": "2026-06-12T00:00:00.000Z"
}
```

Better response with database check:

```json
{
  "status": "ok",
  "database": "ok",
  "timestamp": "2026-06-12T00:00:00.000Z"
}
```

Rules:

1. Health check must be fast.
2. Health check must not require login.
3. Health check must not expose secrets.
4. Health check must not run expensive queries.
5. Health check may check database with lightweight query.
6. Health check should return 500 when critical dependency fails.

Example database check:

```ts
await prisma.$queryRaw`SELECT 1`;
```

Do not calculate analytics inside health check.

That is not a health check. That is a self-inflicted denial of service wearing a stethoscope.

---

### 5.3 Uptime Monitoring

Monitor:

```txt
GET /api/health
```

Recommended interval:

```txt
1 minute for production
5 minutes for staging
```

Alert when:

```txt
health check fails 2-3 times consecutively
```

Suggested alert:

```txt
CRITICAL:
Production health check failed for 3 minutes.
```

Rules:

1. Monitor production URL.
2. Monitor staging separately.
3. Alert only after repeated failures to avoid false positives.
4. Include response code and failure reason if available.
5. Monitor from external service, not only inside the app.

### 5.4 API Monitoring

Important endpoints:

```txt
POST /api/auth/login
GET /api/auth/me
POST /api/restaurant/orders
PATCH /api/restaurant/orders/:id/status
POST /api/restaurant/payments
GET /api/restaurant/kitchen/orders
GET /api/restaurant/serving/orders
POST /api/inventory/movements
GET /api/analytics
POST /api/reports/export
```

Metrics:

```txt
request count
status code distribution
5xx count
4xx count
429 count
p50 latency
p95 latency
p99 latency
slowest endpoint
```

Suggested warning thresholds:

```txt
API 5xx rate > 2% for 5 minutes
API p95 latency > 1000ms for 5 minutes
Payment p95 latency > 2000ms for 3 minutes
Kitchen queue p95 latency > 1000ms for 5 minutes
```

Suggested critical thresholds:

```txt
API 5xx rate > 5% for 5 minutes
Payment error rate > 3% for 3 minutes
All login attempts failing
Health check failing for 3 minutes
```

### 5.5 Database Monitoring

Database metrics:

```txt
availability
connection count
connection pool usage
query latency
slow queries
deadlocks
storage usage
CPU/memory if available
backup status
migration failures
```

Important query patterns:

```txt
orders by restaurantId/status/createdAt
payments by restaurantId/date
kitchen orders by restaurantId/status
serving orders by restaurantId/status
inventory by restaurantId
audit logs by restaurantId/date
analytics by date range
```

Suggested warnings:

```txt
database connection usage > 80% for 5 minutes
database storage > 80%
query p95 > 1000ms
backup delayed
```

Suggested critical alerts:

```txt
database unavailable
connection usage > 95%
backup failed
migration failed in production
```

Rules:

1. Database downtime is critical.
2. Connection exhaustion is critical.
3. Slow queries should be investigated.
4. Missing indexes should be fixed before adding random infrastructure.
5. Backup monitoring is mandatory before production use.

### 5.6 Auth Monitoring

Auth metrics:

```txt
login success count
login failure count
login failure rate
session validation failures
inactive user login attempts
password reset requests
rate-limited login attempts
```

Suggested warnings:

```txt
login failure rate > 30% for 10 minutes
password reset requests spike
rate-limited login attempts spike
403 forbidden attempts spike
```

Suggested critical:

```txt
all login attempts fail after deploy
auth/me returns 500 repeatedly
session validation fails for most users
```

Possible causes:

```txt
session secret changed
cookie config broken
database session table issue
auth route error
environment variable missing
```

Auth can make the whole system feel down even if the server is technically alive. A server that rejects every legitimate user is very healthy in the same way a locked restaurant is technically secure.

### 5.7 Order Flow Monitoring

Order flow is business-critical.

Monitor:

```txt
orders created per minute
order creation failure rate
orders stuck in WAITING_CASHIER_APPROVAL
orders stuck in WAITING_PAYMENT
orders stuck in PAID
orders stuck in PREPARING
orders stuck in READY
average PAID → READY time
average READY → SERVED time
cancelled order rate
rejected order rate
```

Suggested warnings:

```txt
orders stuck in PAID > 30 minutes
orders stuck in PREPARING > 60 minutes
orders stuck in READY > 30 minutes
order creation error rate > 3% for 5 minutes
```

Suggested critical:

```txt
POST /api/restaurant/orders error rate > 5% for 5 minutes
no orders created during expected operating hours when traffic exists
invalid state transition errors spike after deploy
```

Rules:

1. Stuck orders should be visible.
2. Invalid transitions should be logged and monitored.
3. Order flow monitoring must include business scope.
4. Operational metrics should not expose private customer data.

### 5.8 Payment Monitoring

Payment is highly sensitive.

Monitor:

```txt
payment creation count
payment success rate
payment failure rate
duplicate payment blocked count
payment latency
payment amount mismatch errors
payment provider webhook failures if provider exists
refund count
```

Suggested warnings:

```txt
payment error rate > 2% for 5 minutes
duplicate payment blocked spikes
payment p95 latency > 2000ms
payment amount mismatch spikes
```

Suggested critical:

```txt
payment error rate > 5% for 3 minutes
payment API returns 500 repeatedly
payment succeeds but order does not become PAID
webhook verification fails repeatedly
```

Rules:

1. Payment failures must be logged.
2. Payment duplicate prevention must be monitored.
3. Payment provider webhook must be monitored if implemented.
4. Payment status must not rely on frontend success alone.
5. Payment incidents should be treated as high priority.

### 5.9 Kitchen and Serving Monitoring

Kitchen/serving queues are operationally important.

Monitor:

```txt
GET /api/restaurant/kitchen/orders latency
GET /api/restaurant/serving/orders latency
orders stuck in PAID
orders stuck in PREPARING
orders stuck in READY
status update failures
polling request volume
```

Suggested warnings:

```txt
kitchen queue p95 latency > 1000ms for 5 minutes
serving queue p95 latency > 1000ms for 5 minutes
orders stuck in PREPARING > 60 minutes
orders stuck in READY > 30 minutes
polling traffic unexpectedly high
```

Rules:

1. Polling interval must be reasonable.
2. Duplicate polling from multiple components should be avoided.
3. Queue endpoints should use indexes.
4. Stuck workflow should be visible to operators.

### 5.10 Inventory Monitoring

Inventory metrics:

```txt
stock adjustment count
stock movement creation failures
insufficient stock errors
negative stock occurrences if forbidden
low stock count
waste/correction count
inventory mutation latency
```

Suggested warnings:

```txt
stock movement creation failure
insufficient stock errors spike
low stock items exceed threshold
negative stock detected
```

Suggested critical:

```txt
stock quantity updated without stock movement
inventory mutation transaction fails repeatedly
```

Rules:

1. Stock mutation failures must be monitored.
2. Stock movement must exist for stock changes.
3. Negative stock must be handled based on business policy.
4. Inventory issues should be auditable.

### 5.11 Report and Analytics Monitoring

Reports and analytics can be expensive.

Monitor:

```txt
analytics endpoint latency
report export count
report export failure count
report generation duration
large date range usage
database load during analytics
```

Suggested warnings:

```txt
analytics p95 > 3000ms
report export duration > 10000ms
report export failures spike
large report generated repeatedly
```

Rules:

1. Expensive reports should be rate-limited.
2. Reports may use caching or background jobs later.
3. Analytics should not slow payment/order endpoints.
4. Report exports should log safe metadata.

### 5.12 Rate Limit Monitoring

Monitor rate limiting:

```txt
429 response count
login rate limit hits
password reset rate limit hits
customer order rate limit hits
payment rate limit hits
report export rate limit hits
```

Possible meanings:

```txt
bot attack
brute force
bad frontend retry loop
rate limit too strict
popular tenant activity spike
```

Suggested warnings:

```txt
429 count spikes 5x above normal
login rate limit hits from same IP
customer order rate limit hits per table/session
```

Rules:

1. 429 spikes should be investigated.
2. Rate limit logs must be safe.
3. Do not alert on every single 429.
4. Alert on abnormal patterns.

### 5.13 Security Monitoring

Security signals:

```txt
failed login spike
forbidden access spike
tenant access denied
invalid webhook signature
rate limit spike
admin access to tenant
role/permission changes
suspicious file upload rejection
```

Suggested warnings:

```txt
403 to admin endpoints spikes
tenant access denied events repeated
invalid webhook signature repeated
password reset requests spike
```

Suggested critical:

```txt
platform admin action without audit log
multiple tenant access violations
possible secret leak detected
```

Rules:

1. Security events must not log secrets.
2. Security alerts must be actionable.
3. Tenant isolation violations are serious.
4. Platform admin actions must be audited.

### 5.14 Storage Monitoring

Object storage metrics:

```txt
storage usage
file upload failures
file download failures
private file access failures
public asset delivery errors
large file uploads rejected
```

Suggested warnings:

```txt
storage usage > 80%
file upload failure spike
private file access denied spike
```

Rules:

1. File upload failures should be visible.
2. Private file access must be permission-checked.
3. Storage cost should be monitored.
4. Public assets should use CDN when appropriate.

### 5.15 Cloud Cost Monitoring

Cloud cost should be watched.

Cost sources:

```txt
hosting usage
serverless invocations
database compute
database storage
object storage
bandwidth
logs
error tracking
monitoring
build minutes
```

Suggested warnings:

```txt
monthly spend exceeds expected budget
database usage grows unusually fast
log volume spikes
bandwidth spikes
```

Rules:

1. Monitor usage after deployment.
2. Avoid excessive polling.
3. Avoid noisy logs.
4. Optimize images.
5. Rate limit expensive endpoints.

Cloud bills are not bugs. They are consequences with invoices.

---

## 6. Anti-Patterns

Do not:

- Run production without uptime monitoring
- Run production without health check
- Rely on user complaints as monitoring
- Alert on every tiny expected error
- Ignore payment error spikes
- Ignore database connection usage
- Ignore slow queries
- Ignore kitchen/serving stuck orders
- Ignore order status transition error spikes
- Ignore 429 spikes
- Monitor only average latency
- Monitor only frontend uptime
- Run expensive logic inside health check
- Expose secrets in monitoring/logs
- Send sensitive payloads to monitoring tools
- Treat staging and production metrics as the same
- Create alerts nobody reads
- Create noisy alerts until everyone ignores them
- Track vanity metrics only
- Ignore cloud cost
- Add complex monitoring stack before basic logs/error tracking exist
- Fix scaling problems before measuring bottlenecks

---

## 7. Checklist

Monitoring and alerts are acceptable when:

- [ ] Production has uptime monitoring.
- [ ] `/api/health` exists.
- [ ] Health check is lightweight.
- [ ] API error rate is monitored.
- [ ] API latency is monitored.
- [ ] Critical endpoints are monitored.
- [ ] Database availability is monitored.
- [ ] Database connection usage is monitored.
- [ ] Database backup status is monitored.
- [ ] Auth failures are monitored.
- [ ] Payment failures are monitored.
- [ ] Order creation failures are monitored.
- [ ] Stuck order states are monitored.
- [ ] Kitchen queue health is monitored.
- [ ] Serving queue health is monitored.
- [ ] Inventory mutation failures are monitored.
- [ ] Report/export failures are monitored.
- [ ] Rate limit spikes are monitored.
- [ ] Security signals are monitored safely.
- [ ] Alerts have severity.
- [ ] Alerts are actionable.
- [ ] Alert noise is controlled.
- [ ] Monitoring does not expose secrets.
- [ ] Production and staging are separated.
- [ ] Incident response process is documented.

---

## 8. References

Related documents:

- 00-ai-context.md
- 01-system-design.md
- 02-system-architecture.md
- 04-backend-api.md
- 05-database-storage.md
- 07-hosting-cloud.md
- 09-security.md
- 10-rate-limiting.md
- 11-caching-cdn.md
- 12-error-tracking-logs.md
- 14-testing.md
- 15-scaling.md
- appendices/error-codes.md
- appendices/implementation-rules.md