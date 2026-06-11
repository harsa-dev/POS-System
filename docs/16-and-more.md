# And More

## 1. Purpose

This document defines additional SaaS/product systems that are not part of the core POS workflow but are required for a serious production-ready product.

This includes billing, subscription, feature gating, usage quota, invoices, legal documents, backup, disaster recovery, support, internal admin tools, onboarding, notifications, product analytics, data retention, account deletion, documentation, compliance, and operational runbooks.

The goal is to prevent the system from becoming only a working app without business, legal, recovery, and support foundations.

A SaaS is not only code.

A SaaS is code plus billing, trust, support, recovery, documentation, and a long list of boring things that become urgent exactly when ignored.

---

## 2. Current Context

POS System V3 is currently focused on building a strong Restaurant / F&B POS foundation.

Active mode:

```txt
Restaurant / F&B
```

Current priority:

```txt
core POS workflow
auth
orders
payments
kitchen
serving
inventory
analytics
settings
audit logs
deployment
security
testing
monitoring
```

Future SaaS/product needs:

```txt
billing/subscription
plans
feature gating
usage quota
invoice
legal pages
privacy policy
terms of service
backup
disaster recovery
customer support
internal admin dashboard
onboarding
email notifications
feature flags
product analytics
data export
account deletion
roadmap management
documentation
runbooks
```

These systems should not all be built immediately.

But they must be documented so future implementation does not become random panic coding with a subscription table taped onto the side like an afterthought.

---

## 3. Decisions

The following decisions are locked:

1. Billing is not MVP core but must be planned.
2. Subscription system is future SaaS scope.
3. Feature gating must be enforced in backend.
4. Usage quota is future SaaS scope.
5. Platform admin roles must be separate from restaurant roles.
6. OWNER is not SUPER_ADMIN.
7. Internal admin dashboard is future scope.
8. Support tools must be audited.
9. Impersonation, if built, must be highly restricted and audited.
10. Legal pages are required before real public SaaS launch.
11. Privacy policy is required before collecting real user/customer data.
12. Terms of service are required before paid usage.
13. Backup is required before production use.
14. Disaster recovery must be documented before serious production.
15. Account deletion and data export must be planned.
16. Product analytics must not expose sensitive data.
17. Feature flags may be used for risky or staged features.
18. Email and notifications must not leak tenant data.
19. Documentation must stay updated with architecture changes.
20. Operational runbooks should exist for common incidents.
21. Customer support process must exist before paid users.
22. Compliance should be considered as the product matures.
23. Roadmap should separate MVP, later, and not-now features.
24. Do not build all SaaS business systems before POS core is stable.
25. Do not ignore these systems when moving toward real users.

---

## 4. Rules

### 4.1 Billing Rules

Billing controls how SaaS customers pay for the product.

Future billing may support:

```txt
free trial
monthly subscription
yearly subscription
plan upgrade
plan downgrade
failed payment
invoice
refund
subscription cancellation
```

Possible plan examples:

```txt
STARTER
PRO
BUSINESS
ENTERPRISE
```

Rules:

1. Billing must be separate from POS payment.
2. SaaS subscription payment is not the same as restaurant customer payment.
3. Backend must enforce billing status.
4. Frontend feature hiding is not enough.
5. Subscription status must not be trusted from frontend.
6. Payment provider webhook must be verified.
7. Billing actions must be audited.

Important distinction:

```txt
Restaurant customer payment:
customer pays restaurant for food/order

SaaS subscription payment:
restaurant pays platform owner for using POS system
```

Do not mix these models in one confused `Payment` table unless you enjoy future archaeology.

### 4.2 Subscription Rules

Subscription status may include:

```txt
TRIALING
ACTIVE
PAST_DUE
CANCELLED
EXPIRED
SUSPENDED
```

Plan type may include:

```txt
STARTER
PRO
BUSINESS
ENTERPRISE
```

Subscription should answer:

```txt
which plan does this business use?
is the subscription active?
when does current billing period end?
is trial still active?
is payment overdue?
which features are allowed?
which limits apply?
```

Rules:

1. Subscription belongs to business/tenant.
2. Subscription status must be checked in backend.
3. Expired/suspended businesses should have limited access.
4. Owner should still access billing page when suspended.
5. Staff access may be restricted when subscription is inactive.
6. Subscription changes must be audited.

### 4.3 Feature Gating Rules

Feature gating controls access by plan.

Example:

```txt
STARTER:
basic POS
basic orders
basic reports

PRO:
inventory
advanced analytics
invoice

BUSINESS:
multi-outlet
advanced reports
priority support

ENTERPRISE:
custom limits
SLA
advanced audit
SSO future
```

Rules:

1. Backend must enforce feature gates.
2. Frontend may display locked feature UI.
3. Feature gate must not replace role permission.
4. Role permission and plan permission are different.
5. Feature gates should be centralized.
6. Feature gate errors should use consistent response code.

Example:

```txt
User has role permission:
reports.export

But plan does not allow:
report_export

Result:
403 PLAN_UPGRADE_REQUIRED
```

Because access control apparently needed multiple gates. Software loves doors.

### 4.4 Usage Quota Rules

Quota limits resource usage by plan.

Possible quota metrics:

```txt
orders per month
staff count
outlet count
report exports per month
storage usage
API requests
menu items
inventory items
```

Rules:

1. Quota is future SaaS scope.
2. Quota must be checked in backend.
3. Quota should reset by billing period when applicable.
4. Quota errors must be clear.
5. Quota should not corrupt existing data.
6. Quota enforcement must be fair by tenant.

Example response:

```json
{
  "success": false,
  "message": "Monthly order limit reached. Please upgrade your plan.",
  "code": "QUOTA_EXCEEDED"
}
```

### 4.5 SaaS Payment Provider Rules

Possible Indonesian payment providers:

```txt
Midtrans
Xendit
Duitku
Tripay
iPaymu
```

Possible global providers:

```txt
Stripe
Paddle
Lemon Squeezy
PayPal
```

Rules:

1. Use sandbox mode before production.
2. Verify webhook signature.
3. Use idempotency for webhook events.
4. Do not trust frontend payment success page.
5. Store provider payment ID.
6. Store provider customer/subscription ID if needed.
7. Audit subscription/payment status changes.
8. Never log payment provider secrets.

Billing flow:

```txt
Owner chooses plan
↓
Backend creates checkout/invoice
↓
Owner pays through provider
↓
Provider sends webhook
↓
Backend verifies webhook
↓
Backend updates subscription
↓
Backend stores invoice/payment record
```

### 4.6 Invoice Rules

SaaS invoices are for subscription billing.

Invoice should include:

```txt
invoice number
business name
billing email
plan
amount
currency
tax if applicable
status
due date
paid date
provider payment ID
createdAt
```

Invoice status:

```txt
DRAFT
PENDING
PAID
FAILED
VOID
REFUNDED
```

Rules:

1. Invoice number must be unique per business or globally.
2. Invoice amount must be calculated server-side.
3. Paid invoice must be immutable except controlled refund/void flow.
4. Invoice PDF should be stored in object storage.
5. Private invoice PDF must not be public without access control.
6. Invoice actions must be audited.

### 4.7 Trial, Grace Period, and Suspension Rules

Trial:

```txt
allows new business to test product before paying
```

Grace period:

```txt
allows limited continued access after payment issue
```

Suspension:

```txt
limits product usage after subscription failure
```

Rules:

1. Trial end date must be stored.
2. Grace period must be explicit.
3. Suspended owner should still access billing page.
4. Suspended staff may be blocked from operational actions.
5. Data should not be deleted immediately after suspension.
6. Subscription state changes must be logged/audited.

Bad:

```txt
payment failed
↓
lock everyone out completely
↓
owner cannot access billing
↓
business cannot pay
```

That is not billing enforcement. That is building a vending machine that refuses coins.

### 4.8 Legal Document Rules

Before public paid launch, prepare:

```txt
Terms of Service
Privacy Policy
Refund Policy
Cookie Policy if needed
Data Processing Agreement if needed later
SLA for enterprise if needed later
```

Rules:

1. Legal pages must be accessible.
2. Privacy policy must explain data collected.
3. Terms must explain acceptable usage.
4. Refund policy must explain billing/refund rules.
5. Legal documents should match actual product behavior.
6. Do not copy legal documents blindly from random companies.

Legal content should eventually be reviewed by a qualified professional before serious commercial use.

Yes, boring. Also yes, important. Laws are just production errors with courts.

### 4.9 Privacy Rules

Privacy policy should explain:

```txt
what data is collected
why data is collected
how data is stored
who can access data
how long data is retained
how user can request deletion/export
third-party processors
security measures
contact information
```

Data categories:

```txt
account data
business data
staff data
customer/order data
payment metadata
usage logs
support messages
uploaded files
```

Rules:

1. Collect only data needed.
2. Do not expose tenant data.
3. Do not use customer/order data for unrelated purposes without policy.
4. Protect private data.
5. Support deletion/export requests when required.
6. Avoid logging sensitive personal data.

### 4.10 Backup Rules

Backup is mandatory before production.

Backup should cover:

```txt
PostgreSQL database
object storage files
environment variable documentation
migration history
critical configuration
```

Rules:

1. Production database must have automated backup.
2. Backup retention must be defined.
3. Restore process must be documented.
4. Restore should be tested.
5. Backup must be protected.
6. Backup must not expose secrets publicly.
7. Object storage backup/replication should be considered.

A backup that has never been restored is a comforting myth with a timestamp.

### 4.11 Disaster Recovery Rules

Disaster recovery explains how to recover from major failure.

Possible incidents:

```txt
database deleted
bad migration
hosting provider outage
object storage issue
secrets leaked
payment webhook failure
production deploy breaks auth
critical bug corrupts order status
```

Recovery plan should define:

```txt
who responds
what to check first
how to rollback
how to restore backup
how to communicate status
how to verify recovery
how to write postmortem
```

Rules:

1. Recovery steps must be documented.
2. Rollback must be known.
3. Backup restore must be known.
4. Critical incidents should have postmortem.
5. Data corruption requires careful recovery, not random patching.

### 4.12 Support Rules

Support process is required before paid users.

Support channels may include:

```txt
email
WhatsApp Business
live chat
help center
ticket system
status page
```

Minimum support system:

```txt
support email
issue/ticket tracking
admin lookup by business/user/order
audit log visibility
basic troubleshooting docs
```

Common POS support cases:

```txt
staff cannot login
order not appearing in kitchen
payment not updating order
report mismatch
inventory stock mismatch
forgot password
subscription invoice issue
```

Rules:

1. Support actions must be logged.
2. Support must not bypass tenant isolation.
3. Support must not ask users for password.
4. Support should use requestId/orderId/businessId for investigation.
5. Support should avoid direct production database edits.

### 4.13 Internal Admin Dashboard Rules

Internal admin dashboard is for platform owner/operator.

Platform roles:

```txt
SUPER_ADMIN
SUPPORT_ADMIN
BILLING_ADMIN
```

Admin dashboard may include:

```txt
tenant list
subscription status
invoice status
usage metrics
support lookup
tenant health
error summary
audit logs
plan management
suspend/reactivate tenant
```

Rules:

1. Platform roles must be separate from business roles.
2. OWNER is not SUPER_ADMIN.
3. Admin actions must be audited.
4. Support admin access must be limited.
5. Billing admin access must focus on billing.
6. Admin dashboard must not become a silent backdoor.

### 4.14 Impersonation Rules

Impersonation means platform support temporarily views the app as a tenant/user.

This is sensitive.

Rules:

1. Impersonation is future scope.
2. Only authorized platform roles may impersonate.
3. Impersonation must require reason.
4. Impersonation must be audited.
5. UI must clearly show impersonation mode.
6. Sensitive actions should be blocked or extra-confirmed.
7. Password must never be revealed.
8. User should not be impersonated silently without policy.

Audit example:

```txt
SUPPORT_ADMIN impersonated user cashier_123 for support ticket ticket_456
```

Impersonation without audit is not support. It is a backdoor with nicer branding.

### 4.15 Onboarding Rules

Onboarding helps new business start using the system.

Onboarding may include:

```txt
create business profile
choose business mode
set currency
set tax/service charge
create first category
create first menu item
create first table
invite staff
open first shift
create first order
```

Rules:

1. Onboarding should guide without blocking expert users.
2. Required setup must be clear.
3. Empty states should suggest next action.
4. Demo data may be used in local/staging.
5. Production demo data must be clearly separated.
6. Onboarding progress may be stored.

Good onboarding prevents users from staring at an empty dashboard like it personally betrayed them.

### 4.16 Email and Notification Rules

System may need notifications for:

```txt
password reset
staff invite
subscription invoice
payment failed
trial ending
low stock
daily sales summary
critical system alert
```

Notification channels:

```txt
email
in-app notification
WhatsApp future
SMS future
push notification future
```

Rules:

1. Email must not include secrets.
2. Password reset link must expire.
3. Invite link must expire.
4. Notification must be tenant-scoped.
5. User preferences should be considered later.
6. Failed notification should be logged.
7. Do not spam users.

### 4.17 Feature Flag Rules

Feature flags allow enabling/disabling features without redeploy.

Useful for:

```txt
new dashboard
new payment flow
new report generator
new business mode
beta features
dangerous rollout
```

Rules:

1. Feature flags are future scope.
2. Backend must enforce critical feature flags.
3. Frontend flag is only UI control.
4. Flags should have owner and expiry.
5. Remove old flags after rollout.
6. Do not create permanent flag chaos.

Feature flags are useful until they become a graveyard of `isNewNewFlowEnabledFinal2`.

### 4.18 Product Analytics Rules

Product analytics tracks how users use the product.

Examples:

```txt
business created
first menu item created
first order created
payment processed
report exported
staff invited
feature used
onboarding completed
```

Rules:

1. Do not track sensitive raw data.
2. Do not track passwords/tokens/secrets.
3. Product analytics must be tenant-safe.
4. Analytics should support product decisions.
5. Business analytics and product analytics are different.

Business analytics:

```txt
restaurant sales, orders, inventory
```

Product analytics:

```txt
how SaaS users use the application
```

Do not mix them like soup.

### 4.19 Data Export Rules

Users may need to export data.

Possible exports:

```txt
orders CSV
payments CSV
inventory movements CSV
sales report PDF
invoice PDF
audit log export
customer data export
```

Rules:

1. Export must require permission.
2. Export must be scoped by tenant.
3. Export must be rate-limited.
4. Large export may use background job.
5. Private export files must not be public.
6. Export should have generated timestamp.
7. Export action should be audited.

### 4.20 Account Deletion and Data Retention Rules

Data deletion must be planned carefully.

Deletion types:

```txt
soft delete
hard delete
archive
anonymization
retention expiration
```

Rules:

1. Do not hard-delete business-critical records casually.
2. Completed orders/payments may need retention for reporting/audit.
3. Staff deactivation is usually better than deleting user.
4. Tenant deletion should have confirmation and backup policy.
5. Data retention period must be documented.
6. Legal/compliance requirements may affect deletion.

Example:

```txt
deactivate staff user
keep historical orders createdById
```

Better than deleting user and leaving historical records confused like a family tree after a database apocalypse.

### 4.21 Documentation Rules

Documentation must cover:

```txt
setup
environment variables
architecture
API behavior
database schema
auth/permissions
deployment
testing
troubleshooting
incident response
backup restore
```

Rules:

1. Docs must be updated when architecture changes.
2. Docs must not contain real secrets.
3. Docs should be readable by future maintainers.
4. Important decisions should be recorded.
5. AI/Codex instructions should be strict and clear.

Documentation is not optional if the project is meant to survive your future self forgetting everything. Which will happen. The brain is unreliable hardware.

### 4.22 Roadmap Rules

Roadmap should separate:

```txt
now
next
later
not now
never unless needed
```

Example:

```txt
Now:
Restaurant POS core

Next:
testing, deployment, monitoring

Later:
subscription, admin dashboard, support tools

Not now:
microservices, Kubernetes, plugin marketplace
```

Rules:

1. Roadmap must protect focus.
2. MVP must not absorb every idea.
3. Future features must not break current core.
4. Do not implement all business modes at once.
5. Architecture should allow future without forcing future today.

### 4.23 Runbook Rules

Runbook is a step-by-step guide for incidents.

Runbooks should exist for:

```txt
production deploy failed
database migration failed
auth broken after deploy
payment API failing
orders stuck in PAID
kitchen queue not updating
database backup restore
secret leaked
high error rate
```

Runbook should include:

```txt
symptoms
checks
logs to inspect
rollback steps
owner/responsible person
communication note
post-incident tasks
```

Rules:

1. Runbooks should be practical.
2. Runbooks should be updated after incidents.
3. Runbooks should avoid vague advice like "check everything".
4. Runbooks should link to logs/monitoring where possible.

### 4.24 Compliance Rules

Compliance depends on market and customer.

Possible future concerns:

```txt
personal data protection
tax invoice rules
payment data handling
employee data handling
data retention
auditability
enterprise security review
```

Rules:

1. Do not claim compliance without evidence.
2. Do not store unnecessary sensitive data.
3. Avoid storing card data directly.
4. Use payment providers for sensitive payment handling.
5. Keep audit logs for critical actions.
6. Prepare security documentation as product matures.

---

## 5. Implementation Guide

### 5.1 Recommended Implementation Phases

#### Phase 1: Portfolio / MVP

Implement or document:

```txt
basic README
docs folder
basic backup awareness
manual support notes
simple onboarding empty states
basic seed data
simple admin-only local tools if needed
```

Do not build:

```txt
full billing
full subscription
full admin dashboard
impersonation
complex legal system
enterprise compliance
```

#### Phase 2: Online MVP

Implement:

```txt
staging
production backup
error tracking
support email
basic legal placeholder drafts
basic privacy policy draft
basic operational runbook
environment variable documentation
```

Prepare:

```txt
billing model design
plan feature list
support process
restore process
```

#### Phase 3: Real User Testing

Implement:

```txt
backup restore test
support workflow
admin tenant lookup
audit log viewer
better onboarding
data export for reports
basic notification emails
```

Prepare:

```txt
subscription flow
payment provider sandbox
feature gating backend
usage tracking
```

#### Phase 4: Paid SaaS

Implement:

```txt
subscription
billing provider
invoice
feature gating
quota
proper legal documents
customer support process
internal admin dashboard
trial/grace/suspension
data deletion/export policy
```

#### Phase 5: Serious SaaS

Implement or consider:

```txt
advanced admin dashboard
impersonation with audit
status page
SLA
enterprise security docs
compliance review
advanced backup/disaster recovery
feature flags
product analytics
customer success tools
```

---

### 5.2 Suggested Data Models

#### Subscription

```prisma
enum SubscriptionStatus {
  TRIALING
  ACTIVE
  PAST_DUE
  CANCELLED
  EXPIRED
  SUSPENDED
}

enum PlanType {
  STARTER
  PRO
  BUSINESS
  ENTERPRISE
}

model Subscription {
  id                     String             @id @default(cuid())
  restaurantId           String             @unique

  plan                   PlanType
  status                 SubscriptionStatus

  trialEndsAt             DateTime?
  currentPeriodStart      DateTime?
  currentPeriodEnd        DateTime?

  provider                String?
  providerCustomerId      String?
  providerSubscriptionId  String?

  createdAt              DateTime           @default(now())
  updatedAt              DateTime           @updatedAt

  @@index([status])
}
```

Future V3 may replace `restaurantId` with:

```txt
businessId
tenantId
```

#### Usage Counter

```prisma
model UsageCounter {
  id            String   @id @default(cuid())
  restaurantId  String
  period        String
  metric        String
  count         Int      @default(0)

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([restaurantId, period, metric])
  @@index([restaurantId])
}
```

Example metrics:

```txt
orders
staff
report_exports
storage_mb
```

#### SaaS Invoice

```prisma
enum SaaSInvoiceStatus {
  DRAFT
  PENDING
  PAID
  FAILED
  VOID
  REFUNDED
}

model SaaSInvoice {
  id                 String            @id @default(cuid())
  restaurantId       String

  invoiceNumber      String
  status             SaaSInvoiceStatus

  plan               PlanType
  amount             Decimal
  currency           String            @default("IDR")

  dueDate            DateTime?
  paidAt             DateTime?

  providerInvoiceId  String?
  providerPaymentId  String?

  createdAt          DateTime          @default(now())
  updatedAt          DateTime          @updatedAt

  @@unique([restaurantId, invoiceNumber])
  @@index([restaurantId, status])
}
```

Naming uses `SaaSInvoice` to avoid confusion with restaurant/customer invoices.

Because naming two different concepts `Invoice` and then acting surprised later is a classic way to manufacture bugs.

---

### 5.3 Feature Gate Example

Feature list:

```ts
type Feature =
  | "inventory"
  | "advanced_analytics"
  | "multi_outlet"
  | "report_export"
  | "staff_management"
  | "priority_support";
```

Plan map:

```ts
type Plan = "STARTER" | "PRO" | "BUSINESS" | "ENTERPRISE";

const planFeatures: Record<Plan, Feature[]> = {
  STARTER: ["staff_management"],
  PRO: ["staff_management", "inventory", "advanced_analytics"],
  BUSINESS: [
    "staff_management",
    "inventory",
    "advanced_analytics",
    "multi_outlet",
    "report_export",
    "priority_support",
  ],
  ENTERPRISE: [
    "staff_management",
    "inventory",
    "advanced_analytics",
    "multi_outlet",
    "report_export",
    "priority_support",
  ],
};

export function hasPlanFeature(plan: Plan, feature: Feature) {
  return planFeatures[plan].includes(feature);
}
```

Backend usage:

```ts
if (!hasPlanFeature(subscription.plan, "report_export")) {
  throw new AppError({
    statusCode: 403,
    code: "PLAN_UPGRADE_REQUIRED",
    message: "Upgrade required to use report export.",
  });
}
```

### 5.4 Backup Runbook Example

Backup restore runbook:

```txt
1. Confirm incident type.
2. Stop risky writes if data corruption is ongoing.
3. Identify last known good backup.
4. Create snapshot of current broken state if safe.
5. Restore backup to staging first.
6. Verify critical data:
   - users
   - orders
   - payments
   - inventory
   - audit logs
7. Restore production only after validation.
8. Run smoke test.
9. Monitor logs and errors.
10. Write incident summary.
```

Never restore production blindly while panicking.

Panic is not a database tool, despite how often developers try to use it.

### 5.5 Support Workflow Example

Support issue flow:

```txt
User reports issue
↓
Support collects:
- business name
- user email or userId
- order number if relevant
- approximate time
- screenshot if useful
- requestId if available
↓
Support checks admin dashboard/logs
↓
Issue categorized:
- auth
- order
- payment
- inventory
- billing
- UI
↓
Bug or support action recorded
↓
Resolution sent to user
↓
If product bug, create issue and add regression test later
```

Rules:

1. Do not ask for password.
2. Do not ask for secret token.
3. Do not make direct database edits casually.
4. Record support-sensitive actions.

### 5.6 Legal Page Structure

Recommended legal pages:

```txt
/legal/privacy-policy
/legal/terms-of-service
/legal/refund-policy
/legal/cookie-policy
```

Footer links:

```txt
Privacy Policy
Terms of Service
Refund Policy
Contact Support
```

Legal docs should include last updated date:

```txt
Last updated: 2026-06-12
```

Use exact dates. “Recently updated” is not a date. It is fog.

### 5.7 Documentation Structure

Recommended docs:

```txt
docs/
├─ 00-ai-context.md
├─ 01-system-design.md
├─ 02-system-architecture.md
├─ 03-frontend.md
├─ 04-backend-api.md
├─ 05-database-storage.md
├─ 06-auth-permissions.md
├─ 07-hosting-cloud.md
├─ 08-cicd-version-control.md
├─ 09-security.md
├─ 10-rate-limiting.md
├─ 11-caching-cdn.md
├─ 12-error-tracking-logs.md
├─ 13-monitoring-alerts.md
├─ 14-testing.md
├─ 15-scaling.md
├─ 16-and-more.md
└─ appendices/
   ├─ permission-keys.md
   ├─ status-transitions.md
   ├─ error-codes.md
   ├─ api-response-format.md
   ├─ anti-patterns.md
   └─ implementation-rules.md
```

---

## 6. Anti-Patterns

Do not:

- Mix restaurant customer payment with SaaS subscription payment
- Trust frontend for subscription status
- Trust frontend for feature access
- Build feature gating only in UI
- Lock owner out of billing during suspension
- Delete tenant data immediately after failed payment
- Build full billing before POS core works
- Ignore billing design until paid launch
- Treat OWNER as SUPER_ADMIN
- Build admin dashboard without audit logs
- Build impersonation without audit
- Ask users for passwords during support
- Make direct production database edits casually
- Launch paid SaaS without privacy policy
- Launch paid SaaS without terms of service
- Copy legal docs blindly
- Run production without backup
- Assume backup works without restore test
- Store private invoice/report files publicly
- Send notification emails with secrets
- Track sensitive data in product analytics
- Keep feature flags forever
- Ignore account deletion/data retention
- Keep documentation outdated
- Build every “later” feature before MVP is stable
- Call something enterprise-ready just because it has a dashboard

---

## 7. Checklist

This area is acceptable when:

- [ ] Billing is documented separately from restaurant payments.
- [ ] Subscription status model is planned.
- [ ] Feature gating strategy is documented.
- [ ] Backend enforcement is required for gated features.
- [ ] Usage quota strategy is planned for future SaaS.
- [ ] Invoice model separates SaaS invoice from restaurant invoice.
- [ ] Trial/grace/suspension behavior is documented.
- [ ] Platform admin roles are separate from business roles.
- [ ] Admin/support actions require audit logs.
- [ ] Impersonation is restricted and audited if implemented.
- [ ] Privacy policy is planned before real data collection.
- [ ] Terms of service are planned before paid launch.
- [ ] Refund policy is planned before paid launch.
- [ ] Production backup exists before real users.
- [ ] Restore process is documented.
- [ ] Disaster recovery runbook exists.
- [ ] Support workflow is documented.
- [ ] Data export strategy is planned.
- [ ] Data deletion/retention strategy is planned.
- [ ] Email/notification rules avoid secrets.
- [ ] Product analytics avoids sensitive data.
- [ ] Documentation structure exists.
- [ ] Roadmap separates now, next, later, and not-now.
- [ ] These systems are not overbuilt before POS core is stable.

---

## 8. References

Related documents:

- 00-ai-context.md
- 01-system-design.md
- 02-system-architecture.md
- 04-backend-api.md
- 05-database-storage.md
- 06-auth-permissions.md
- 07-hosting-cloud.md
- 08-cicd-version-control.md
- 09-security.md
- 12-error-tracking-logs.md
- 13-monitoring-alerts.md
- 14-testing.md
- 15-scaling.md
- appendices/permission-keys.md
- appendices/error-codes.md
- appendices/implementation-rules.md