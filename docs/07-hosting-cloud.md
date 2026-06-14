# Hosting & Cloud

## 1. Purpose

This document defines the hosting and cloud strategy for POS System V3.

It explains how the application should be deployed, where the frontend/backend should run, where the database should live, how files should be stored, how environments should be separated, and what production requirements must exist before real users use the system.

The goal is to make deployment predictable, secure, maintainable, and suitable for MVP without over-engineering the infrastructure.

This document does not define detailed CI/CD workflow, monitoring rules, database schema, or security implementation. Those areas are handled in separate documents.

---

## 2. Current Context

POS System V3 is currently a web-based application.

The current active mode is:

```txt
Restaurant
```

The current recommended deployment direction is:

```txt
Next.js app for frontend and API
PostgreSQL for database
Object storage for files
GitHub for source control
Vercel or similar platform for app hosting
Managed PostgreSQL provider for database
```

The system is still in MVP/portfolio stage.

The system should prioritize:

```txt
simple deployment
safe environment variables
separate development and production data
automatic HTTPS
database backup
basic logs
basic monitoring
clear rollback path
```

The system should not start with complex infrastructure such as:

```txt
Kubernetes
multi-region deployment
manual server cluster
microservices deployment
Kafka
advanced load balancer setup
```

Not yet. Let the app survive production basics before dressing it like a cloud conference keynote.

---

## 3. Decisions

The following hosting and cloud decisions are locked:

1. MVP should use managed hosting where possible.
2. Next.js frontend and API may be deployed together for MVP.
3. Vercel or similar Next.js-friendly platform is acceptable for MVP.
4. PostgreSQL must use a managed provider for online testing/production.
5. Local database must not be used as production database.
6. Object storage must be used for files.
7. Files must not be stored permanently in the application server filesystem.
8. Environment variables must be separated per environment.
9. Secrets must not be committed to GitHub.
10. Production must use HTTPS.
11. Production cookies must use secure settings.
12. Production database must have backup.
13. Staging should exist before real production usage.
14. Preview deployments are useful but must not use production secrets carelessly.
15. Logs and error tracking are required before serious user testing.
16. Monitoring is required before production use.
17. Deployment should be connected to version control.
18. Rollback path must exist.
19. Infrastructure should remain simple until bottlenecks are proven.
20. Scaling infrastructure is future scope, not MVP default.

---

## 4. Rules

### 4.1 Environment Rules

The system must separate environments:

```txt
local
staging
production
```

#### Local

Used for development.

```txt
localhost
local database or development cloud database
debug-friendly logs
dummy data
safe to reset
```

#### Staging

Used for testing before production.

```txt
online app
online database
production-like configuration
dummy/testing data
safe for feature testing
```

#### Production

Used by real users.

```txt
real data
real business usage
strict environment variables
backup required
monitoring required
error tracking required
rollback required
```

Rules:

1. Do not test dangerous changes directly in production.
2. Do not use production database for local development.
3. Do not seed production with random demo data.
4. Do not reset production database casually.
5. Do not expose staging credentials publicly.

---

### 4.2 App Hosting Rules

MVP app hosting may use:

```txt
Vercel
Railway
Render
Fly.io
Cloudflare Pages depending on app needs
```

For Next.js MVP:

```txt
Vercel is acceptable
```

Rules:

1. Hosting must support the selected Next.js features.
2. API runtime limits must be understood.
3. Long-running jobs must not be forced into serverless functions.
4. Background jobs may need separate worker in future.
5. WebSocket may need separate backend/runtime in future.
6. Deployment must be connected to GitHub or CI/CD.
7. Production build must pass before deploy.

---

### 4.3 Database Hosting Rules

Database must use managed PostgreSQL for online environments.

Possible providers:

```txt
Neon
Supabase
Railway PostgreSQL
Render PostgreSQL
AWS RDS
Google Cloud SQL
Azure Database for PostgreSQL
```

For MVP, acceptable options:

```txt
Neon
Supabase
Railway PostgreSQL
```

Rules:

1. Database must be PostgreSQL.
2. Database credentials must be stored in environment variables.
3. Production database must not be shared with local development.
4. Connection pooling must be considered for serverless deployment.
5. Production database must have backup.
6. Migrations must be applied carefully.
7. Production database must not be reset without backup and approval.

---

### 4.4 Object Storage Rules

Object storage must be used for files.

Possible providers:

```txt
Cloudflare R2
Supabase Storage
AWS S3
Google Cloud Storage
Firebase Storage
```

Files that belong in object storage:

```txt
menu images
business logo
user avatar
invoice PDF
report export
payment proof
attachments
```

Rules:

1. Do not store large files directly in PostgreSQL.
2. Do not rely on local filesystem for persistent uploads.
3. Backend must validate upload permission.
4. Backend must validate file type.
5. Backend must validate file size.
6. Private files must not be publicly accessible.
7. Public files must be intentionally public.
8. Database should store file metadata and storage path.

---

### 4.5 Domain and DNS Rules

Production should use a real domain when the app is ready for public testing.

Possible structure:

```txt
Marketing site:
example.com

Application:
app.example.com

API if separated:
api.example.com

Docs if needed:
docs.example.com
```

Rules:

1. DNS must point to the correct hosting provider.
2. Domain verification must be completed.
3. HTTPS must be enabled.
4. Production app must not rely on temporary preview URLs forever.
5. DNS changes must be documented.

---

### 4.6 HTTPS Rules

Production must use HTTPS.

Rules:

1. HTTP must redirect to HTTPS.
2. Auth cookies in production must use `Secure`.
3. No mixed content.
4. Public app URLs must use `https://`.
5. Webhooks must use HTTPS endpoints.
6. Payment providers must never send webhooks to insecure endpoints.

Cookie production settings should include:

```txt
HttpOnly
Secure
SameSite=Lax or Strict
Path=/
Max-Age / Expires
```

---

### 4.7 Environment Variable Rules

Environment variables must be separated by environment.

Common private variables:

```txt
DATABASE_URL
SESSION_SECRET
JWT_SECRET
STORAGE_ACCESS_KEY
STORAGE_SECRET_KEY
PAYMENT_SECRET_KEY
WEBHOOK_SECRET
SENTRY_AUTH_TOKEN
```

Common public variables:

```txt
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_SITE_NAME
NEXT_PUBLIC_ENVIRONMENT
```

Rules:

1. Never commit `.env` files containing real secrets.
2. Never expose private secrets using `NEXT_PUBLIC_*`.
3. Never put `DATABASE_URL` in frontend public variables.
4. Never log secrets.
5. Rotate secrets if leaked.
6. Production secrets must be stored in hosting provider secret manager.
7. Staging and production must use different secrets.

---

### 4.8 Deployment Rules

Deployment must follow a predictable process.

Recommended MVP flow:

```txt
push to GitHub
↓
CI checks run
↓
build succeeds
↓
hosting provider deploys
↓
deployment is verified
```

Rules:

1. Production deploy should come from main branch.
2. Feature branches may create preview deployments.
3. Failed build must block deploy.
4. TypeScript errors must block deploy.
5. Prisma schema errors must block deploy.
6. Environment variables must exist before deploy.
7. Migration must be handled carefully before production deploy.
8. Rollback path must be available.

---

### 4.9 Logs, Monitoring, and Error Tracking Rules

Before real user testing, the system should have:

```txt
application logs
error tracking
basic uptime monitoring
database provider monitoring
deployment logs
```

Recommended tools:

```txt
Sentry for error tracking
Better Stack / UptimeRobot for uptime
hosting provider logs
database provider metrics
```

Rules:

1. Do not deploy blindly without logs.
2. Do not expose sensitive data in logs.
3. Production errors must be traceable.
4. Payment/order errors must be logged with safe metadata.
5. Monitoring must alert when the app is down.

---

### 4.10 Backup Rules

Production must have backup.

Backup should cover:

```txt
PostgreSQL database
object storage files
migration history
environment variable documentation
```

Rules:

1. Automated database backup must exist before production use.
2. Restore process must be documented.
3. Backup retention must be defined.
4. Backups must be protected.
5. Backup restore must be tested before relying on it.

A backup that cannot be restored is not a backup. It is emotional support with file extensions.

---

## 5. Implementation Guide

### 5.1 MVP Hosting Architecture

Recommended MVP architecture:

```txt
User Browser
↓
Domain + HTTPS
↓
Next.js Hosting
↓
PostgreSQL Provider
↓
Object Storage
↓
Logs / Error Tracking / Monitoring
```

Example MVP stack:

```txt
App:
Vercel

Database:
Neon / Supabase / Railway PostgreSQL

Storage:
Cloudflare R2 / Supabase Storage

Version Control:
GitHub

CI/CD:
GitHub Actions + hosting provider deployment

Error Tracking:
Sentry

Monitoring:
Better Stack / UptimeRobot
```

This is enough for MVP and user testing.

Do not start with Kubernetes. The app needs a working order flow, not a distributed headache factory.

---

### 5.2 Local Development Setup

Local development should use:

```txt
local .env.local
local or development database
local storage mock or development bucket
development seed data
```

Example local variables:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/pos_dev"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

Rules:

1. Local environment can be reset.
2. Local secrets must not be production secrets.
3. Local data can be dummy.
4. Local logs may be verbose.
5. Local environment should be easy to reproduce.

---

### 5.3 Staging Setup

Staging should mirror production enough to catch deployment problems.

Staging should have:

```txt
staging app URL
staging PostgreSQL database
staging storage bucket
staging environment variables
staging seed data
error tracking enabled
basic monitoring enabled
```

Staging is used to test:

```txt
login
order flow
payment flow using manual/dummy payment
kitchen flow
serving flow
inventory flow
deployment
migration
environment variables
```

Rules:

1. Staging must not use production data unless sanitized.
2. Staging must not send real payment unless explicitly configured.
3. Staging must not send real customer notification accidentally.
4. Staging should catch broken deploy before production.

---

### 5.4 Production Setup

Production should have:

```txt
production app URL
production database
production object storage
production secrets
HTTPS
error tracking
logs
monitoring
backup
rollback path
```

Production readiness requires:

```txt
build passes
typecheck passes
lint passes if enforced
database migration reviewed
environment variables configured
auth cookie configured securely
health endpoint works
backup enabled
monitoring enabled
error tracking enabled
```

Production is not the place to discover that `.env` was missing. That is comedy only if someone else pays the cloud bill.

---

### 5.5 Database Provider Setup

Database provider must support:

```txt
PostgreSQL
connection string
backup
metrics
secure access
migration compatibility
```

For serverless platforms, consider:

```txt
connection pooling
Prisma connection behavior
cold starts
max connection limits
```

Rules:

1. Use pooled connection string if provider recommends it.
2. Do not open unnecessary database connections.
3. Do not log database URL.
4. Keep migration history in Git.
5. Monitor database storage and connection usage.

---

### 5.6 Object Storage Setup

Storage should have separate buckets or prefixes by environment.

Example:

```txt
pos-dev-files
pos-staging-files
pos-production-files
```

or:

```txt
dev/
staging/
production/
```

File key pattern:

```txt
restaurants/{restaurantId}/menu/{fileId}.webp
restaurants/{restaurantId}/logos/{fileId}.webp
restaurants/{restaurantId}/invoices/{invoiceId}.pdf
```

Rules:

1. File keys must include ownership scope.
2. File names must avoid user-controlled unsafe paths.
3. Private files need signed URLs or backend proxy.
4. Public files may use CDN.
5. Uploaded images should be optimized.

---

### 5.7 Domain Setup

Recommended domain structure:

```txt
app.product-name.com
```

Optional future:

```txt
www.product-name.com
api.product-name.com
docs.product-name.com
status.product-name.com
```

DNS records may include:

```txt
CNAME for app hosting
TXT for domain verification
MX for email if needed
TXT for SPF/DKIM/DMARC if sending email
```

Domain setup must be documented because DNS debugging is where time goes to evaporate.

---

### 5.8 Environment Variables Setup

Minimum production variables:

```txt
DATABASE_URL
SESSION_SECRET
NEXT_PUBLIC_APP_URL
NODE_ENV
```

If storage is enabled:

```txt
STORAGE_ENDPOINT
STORAGE_BUCKET
STORAGE_ACCESS_KEY
STORAGE_SECRET_KEY
```

If Sentry is enabled:

```txt
SENTRY_DSN
```

If payment gateway is enabled:

```txt
PAYMENT_SECRET_KEY
PAYMENT_WEBHOOK_SECRET
```

Rules:

1. Keep env names consistent.
2. Document required env variables.
3. Validate env variables on startup if possible.
4. Fail fast when required env is missing.
5. Do not silently run production with missing secrets.

---

### 5.9 Migration and Deployment Flow

Safe deployment flow:

```txt
commit code
↓
push to GitHub
↓
CI runs typecheck/build/tests
↓
review migration if schema changed
↓
apply migration to staging
↓
test staging
↓
deploy production
↓
apply production migration carefully
↓
verify health endpoint
↓
monitor logs/errors
```

For MVP, this may be simplified.

But do not apply destructive database changes blindly.

---

### 5.10 Rollback Strategy

Rollback must be possible.

Rollback options:

```txt
redeploy previous deployment
revert commit
restore database backup if required
disable feature flag if available
```

Rules:

1. Keep deployment history.
2. Know how to redeploy previous version.
3. Do not make irreversible production migrations without backup.
4. Document rollback steps.
5. After rollback, investigate root cause.

Code rollback is easy.

Database rollback is where confidence goes to die, so plan before changing schema.

---

### 5.11 Cost Control

Cloud cost must be watched.

Potential cost sources:

```txt
hosting function usage
database compute
database storage
object storage
bandwidth
image delivery
logs
monitoring
error tracking
build minutes
```

Rules:

1. Use free/low-cost tiers carefully during MVP.
2. Monitor usage.
3. Optimize images before serving.
4. Avoid unnecessary polling frequency.
5. Avoid logging too much in production.
6. Do not generate reports repeatedly without limits.

---

### 5.12 Future Cloud Additions

Future additions may include:

```txt
Redis
queue / worker
WebSocket / SSE server
separate backend API
platform admin dashboard
billing webhook service
advanced monitoring
CDN rules
WAF
multi-region
read replica
```

These are future scope.

Add them only when:

```txt
there is a real bottleneck
there is a real product requirement
the simpler approach is no longer enough
```

Do not scale imaginary traffic. It has terrible ROI.

---

## 6. Anti-Patterns

Do not:

- Use localhost as if it were production
- Use production database for local development
- Commit `.env` secrets
- Put secrets in `NEXT_PUBLIC_*`
- Store files permanently on app server filesystem
- Store large files directly in PostgreSQL
- Deploy production without HTTPS
- Deploy production without backup
- Deploy production without logs
- Deploy production without error tracking
- Deploy production without monitoring
- Reset production database casually
- Apply destructive migration without backup
- Use one database for local, staging, and production
- Use production payment keys in staging
- Send real customer notifications from staging
- Ignore database connection limits
- Add Kubernetes for MVP
- Add microservices before modular monolith is stable
- Add Redis before cache strategy exists
- Add WebSocket before polling/API flow is stable
- Depend on preview deployment URLs forever
- Leave old secrets active after a leak
- Treat deployment success as proof the app works

---

## 7. Checklist

Hosting and cloud setup is acceptable when:

- [ ] Local, staging, and production environments are separated.
- [ ] App is deployed to a managed hosting provider.
- [ ] PostgreSQL database is hosted online for staging/production.
- [ ] Production does not use local database.
- [ ] Files use object storage.
- [ ] Secrets are stored in provider environment variables.
- [ ] No real secrets are committed to GitHub.
- [ ] No private secrets use `NEXT_PUBLIC_*`.
- [ ] Production uses HTTPS.
- [ ] Production auth cookie uses secure settings.
- [ ] Database backup exists before production use.
- [ ] Restore process is documented.
- [ ] Error tracking is enabled before serious testing.
- [ ] Basic uptime monitoring is enabled before production.
- [ ] Deployment is connected to version control.
- [ ] Rollback path exists.
- [ ] Migration process is documented.
- [ ] Cost usage is monitored.
- [ ] No unnecessary cloud complexity is introduced.

---

## 8. References

Related documents:

- 00-ai-context.md
- 01-system-design.md
- 02-system-architecture.md
- 04-backend-api.md
- 05-database-storage.md
- 08-cicd-version-control.md
- 09-security.md
- 11-caching-cdn.md
- 12-error-tracking-logs.md
- 13-monitoring-alerts.md
- 15-scaling.md
- appendices/implementation-rules.md