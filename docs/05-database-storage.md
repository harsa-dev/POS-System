# Database & Storage

## 1. Purpose

This document defines the database and storage strategy for POS System V3.

It explains how business data, relationships, transactions, files, ownership scope, indexes, snapshots, stock movement, migrations, and backups should be handled.

The goal is to protect data integrity, prevent tenant data leaks, keep financial and inventory data consistent, and make the database maintainable as the system grows.

This document does not define detailed backend route logic, frontend UI behavior, hosting setup, or monitoring. Those areas are handled in separate documents.

---

## 2. Current Context

POS System V3 currently uses a Restaurant / F&B-focused data model.

The current active mode is:

```txt
Restaurant / F&B
```

The current project may still use restaurant-oriented models and fields such as:

```txt
Restaurant
restaurantId
MenuItem
DiningTable
Order
OrderItem
Payment
InventoryItem
Recipe
StockMovement
Shift
AuditLog
```

In V3 design, `restaurantId` should be treated as the current implementation of business ownership scope.

Future architecture may migrate toward:

```txt
businessId
```

or:

```txt
tenantId
```

but this must be planned carefully.

The current recommended database stack is:

```txt
PostgreSQL
Prisma
```

The recommended file storage direction is:

```txt
Object Storage
```

Examples:

```txt
Cloudflare R2
Supabase Storage
AWS S3
S3-compatible storage
```

The system must use PostgreSQL for structured business data and object storage for files.

---

## 3. Decisions

The following database and storage decisions are locked:

1. PostgreSQL is the primary database.
2. Prisma is the ORM.
3. Database is the final persisted source of truth.
4. Backend is responsible for database access.
5. Frontend must not directly access the database.
6. Business-owned data must be scoped by restaurantId, businessId, or tenantId.
7. Current `restaurantId` is treated as the current ownership scope.
8. Future migration to `businessId` or `tenantId` must be planned.
9. Money must use Decimal or integer minor units, not Float.
10. Important transaction records must store snapshots.
11. Stock quantity must not change without stock movement.
12. Payment, stock, invoice, and workflow mutations should use transactions when multiple writes are involved.
13. Database schema must support Restaurant / F&B first.
14. Planned modes may have conceptual schema planning, but must not be fully implemented before needed.
15. Files must be stored in object storage, not directly in the database.
16. Database stores file metadata, path, URL, ownership scope, and access rules.
17. Migrations must be reviewed before being applied.
18. Indexes must support common queries.
19. Large list queries must use pagination.
20. Audit logs must be stored for important business actions.
21. Schema changes must not be made casually to satisfy temporary UI needs.
22. Database-per-mode is out of scope.
23. Separate database per tenant is out of scope for MVP.
24. Backup strategy is required before production use.
25. Production data must not be reset casually.

---

## 4. Rules

### 4.1 Database Responsibility Rules

Database stores official records for:

```txt
users
sessions
businesses / restaurants
roles / permissions if implemented
menu items
categories
orders
order items
payments
inventory items
recipes
stock movements
dining tables
shifts
cashflow entries
invoices
audit logs
settings
```

Database must not be treated as a random dump of frontend state.

Frontend state is temporary.

Database state is official.

### 4.2 Tenant / Business Scope Rules

Every business-owned table must include ownership scope.

Current MVP scope:

```txt
restaurantId
```

V3 conceptual scope:

```txt
businessId
```

SaaS technical scope:

```txt
tenantId
```

Rules:

1. Business-owned data must always be scoped.
2. Queries must filter by ownership scope.
3. Mutations must load resource using ownership scope before update.
4. Frontend must not provide final ownership scope.
5. Backend must derive scope from current user/session.
6. Platform admin cross-tenant access must be explicit and audited.

Bad:

```ts
await prisma.order.findUnique({
  where: { id },
});
```

Good:

```ts
await prisma.order.findFirst({
  where: {
    id,
    restaurantId: user.restaurantId,
  },
});
```

### 4.3 Money Rules

Money must not use Float.

Use:

```txt
Decimal
```

or:

```txt
integer minor units
```

Examples:

```txt
IDR 25,000 stored as Decimal 25000
IDR 25,000 stored as integer 25000
```

Rules:

1. Do not use Float for price, subtotal, tax, discount, service charge, payment, invoice, or cashflow.
2. Backend must calculate money values.
3. Historical transactions must store money snapshots.
4. Reports must use stored transaction values, not recalculated current product prices.

### 4.4 Snapshot Rules

Important transaction data must be stored as snapshot.

Why?

Because master data may change later.

Examples:

```txt
menu price changes
product name changes
tax rate changes
service charge changes
customer name changes
```

Order history must not change because current menu data changed.

Required snapshots:

```txt
order item name snapshot
order item price snapshot
subtotal snapshot
tax rate snapshot
tax amount snapshot
service charge rate snapshot
service charge amount snapshot
discount amount snapshot
total amount snapshot
payment method snapshot
invoice item snapshot
customer name snapshot when needed
```

### 4.5 Stock Movement Rules

Stock must change through stock movement.

Do not update inventory quantity silently.

Bad:

```ts
await prisma.inventoryItem.update({
  where: { id },
  data: {
    quantity: newQuantity,
  },
});
```

Better:

```txt
create stock movement
update inventory quantity
create audit log
```

Stock movement types may include:

```txt
IN
OUT
ADJUSTMENT
CORRECTION
WASTE
RETURN
TRANSFER
RESERVATION
COMMIT
```

Rules:

1. Every stock change must create stock movement.
2. Stock movement must include business scope.
3. Stock movement must include actor if user initiated.
4. Stock movement must include reason or source when relevant.
5. Stock movement must be created in the same transaction as quantity update.

### 4.6 Relation Rules

Database relations must reflect real business ownership.

Examples:

```txt
Restaurant has many Users
Restaurant has many Orders
Order has many OrderItems
Order may have Payment
MenuItem may have Recipes
Recipe references InventoryItem
InventoryItem has many StockMovements
User creates Orders
User creates Payments
User creates AuditLogs
```

Rules:

1. Avoid orphan records.
2. Use foreign keys for important relationships.
3. Use unique constraints for business uniqueness.
4. Use indexes for common access patterns.
5. Avoid relations that force unrelated modes together.

### 4.7 Transaction Rules

Use database transaction for multi-write business actions.

Transaction recommended for:

```txt
create order + order items + stock movement
create payment + update order status
cancel order + restore stock + audit log
adjust stock + stock movement + audit log
create invoice + invoice items
pay invoice + payment + cashflow entry
change role/permission + audit log
settings update + audit log
```

Do not allow partial business state.

Bad state examples:

```txt
payment exists but order is not PAID
order exists but order items failed
stock deducted but stock movement missing
invoice is PAID but payment missing
settings changed but audit missing
```

### 4.8 Migration Rules

Schema migration must be planned.

Rules:

1. Do not rename important fields casually.
2. Do not drop columns without backup or migration plan.
3. Do not reset production database.
4. Do not apply destructive migration without review.
5. Prisma migration files must be committed.
6. Development migration and production migration must be treated differently.
7. Data migration must be written when field meaning changes.
8. restaurantId to businessId/tenantId migration must be planned as a separate task.

### 4.9 Storage Rules

Files must be stored in object storage.

Examples:

```txt
menu images
restaurant logo
user avatar
invoice PDF
report export
payment proof
attachment
```

Database stores metadata:

```txt
id
restaurantId / businessId / tenantId
fileName
fileKey
mimeType
size
url or storage path
uploadedById
createdAt
```

Rules:

1. Do not store large files directly in PostgreSQL.
2. Do not trust frontend file metadata blindly.
3. Backend must validate file type and size.
4. Private files must not use public URLs without access control.
5. Public files must be intentionally public.
6. File deletion must consider database references.

### 4.10 Backup Rules

Before production use, the system must have backup strategy.

Backup should cover:

```txt
PostgreSQL database
object storage files
environment variables documentation
migration history
```

Rules:

1. Production database must have automated backup.
2. Backup restore must be tested.
3. Backup retention should be defined.
4. Sensitive backup files must be protected.
5. Local development data is not production backup.

---

## 5. Implementation Guide

### 5.1 Database Stack

Recommended stack:

```txt
PostgreSQL
Prisma
```

Recommended environments:

```txt
local development database
staging database
production database
```

Do not use the same database for local, staging, and production.

Environment examples:

```txt
DATABASE_URL for local
STAGING_DATABASE_URL for staging
PRODUCTION_DATABASE_URL for production provider
```

Never commit real production database credentials.

---

### 5.2 Core Restaurant MVP Models

Core Restaurant MVP may include:

```txt
Restaurant
User
Session
Category
MenuItem
InventoryItem
Recipe
DiningTable
Order
OrderItem
Payment
Shift
StockMovement
AuditLog
Setting
```

These models support:

```txt
auth
staff role
menu
order
payment
kitchen
serving
inventory
stock movement
settings
audit
```

Do not add all future mode tables immediately unless needed.

Planned mode tables can be documented first.

---

### 5.3 Restaurant / Business Ownership

Current model may use:

```txt
Restaurant
restaurantId
```

This is acceptable for MVP.

V3 conceptual design should treat this as:

```txt
Business ownership scope
```

Future possible model:

```txt
Business
businessId
```

or:

```txt
Tenant
tenantId
```

Migration direction must be documented before implementation.

Do not rename every field during random refactor. That is how schema becomes an archaeological site.

---

### 5.4 User and Session

User should support:

```txt
id
restaurantId / businessId / tenantId
name
email
passwordHash
role
isActive
createdAt
updatedAt
```

Session should support:

```txt
id
userId
token
expiresAt
createdAt
```

Rules:

1. Password hash must never be returned to frontend.
2. Inactive user must not access protected APIs.
3. Session must expire.
4. Session token must be stored securely.

Detailed auth rules are defined in:

```txt
06-auth-permissions.md
```

---

### 5.5 Order and Order Item

Order should store:

```txt
id
restaurantId
orderNumber
status
paymentStatus
tableId
customerName
subtotal
taxAmount
serviceChargeAmount
discountAmount
totalAmount
createdById
createdAt
updatedAt
```

OrderItem should store:

```txt
id
orderId
menuItemId
itemNameSnapshot
unitPriceSnapshot
quantity
notes
subtotalSnapshot
```

Rules:

1. Order number should be unique per business/restaurant.
2. Order total must be calculated by backend.
3. Order item must store price snapshot.
4. Historical order total must not change when MenuItem price changes.
5. Order status must follow documented transitions.
6. Order must be scoped by restaurantId/businessId/tenantId.

Recommended unique constraint:

```txt
restaurantId + orderNumber
```

---

### 5.6 Payment

Payment should store:

```txt
id
restaurantId
orderId or payable reference
amount
method
status
reference
paidAt
createdById
createdAt
updatedAt
```

Payment method examples:

```txt
CASH
QRIS
CARD
TRANSFER
E_WALLET
```

Payment status examples:

```txt
PENDING
PAID
FAILED
REFUNDED
CANCELLED
```

Rules:

1. Payment amount must be validated by backend.
2. Payment must reference a valid payable entity.
3. Duplicate payment must be prevented.
4. Payment creation should update order/payment status in a transaction.
5. Payment creation must create audit log.
6. Future gateway payment must verify provider webhook/status.

---

### 5.7 Inventory and Stock Movement

InventoryItem should store:

```txt
id
restaurantId
name
unit
quantity
minimumStock
createdAt
updatedAt
```

StockMovement should store:

```txt
id
restaurantId
inventoryItemId
type
quantity
reason
sourceType
sourceId
createdById
createdAt
```

Rules:

1. Inventory quantity changes must create stock movement.
2. Stock movement must be tenant-scoped.
3. Stock movement must describe why stock changed.
4. Stock movement must be used for audit and reports.
5. Stock validation must happen in backend.

Restaurant recipe deduction may use:

```txt
MenuItem
Recipe
InventoryItem
```

Raw Material / Kandang future mode may extend inventory with:

```txt
batch
lot
gross weight
tare weight
net weight
kandang
processing
shrinkage
quality control
```

Do not force all raw material complexity into Restaurant MVP inventory.

---

### 5.8 Invoice and Cashflow

Invoice is shared business data.

Invoice should support:

```txt
id
restaurantId / businessId
invoiceNumber
customerId
status
subtotal
taxAmount
discountAmount
totalAmount
issuedAt
dueDate
paidAt
createdAt
updatedAt
```

Cashflow should support:

```txt
id
restaurantId / businessId
type
amount
sourceType
sourceId
description
createdById
createdAt
```

Rules:

1. Invoice total must be calculated by backend.
2. Invoice should store item snapshots.
3. Payment should update invoice status if invoice is payable.
4. Cashflow entries should come from official transactions or audited manual entry.
5. Cashflow must not trust frontend final amount.

---

### 5.9 Audit Log

AuditLog should store:

```txt
id
restaurantId / businessId / tenantId
actorUserId
actorRole
action
entityType
entityId
beforeValue
afterValue
metadata
createdAt
```

Audit required for:

```txt
payment created
payment refunded
order status updated
stock adjusted
settings updated
role changed
permission changed
invoice voided
batch created
service job assigned
```

Rules:

1. Audit actor must come from backend current user.
2. Audit logs must be tenant-scoped.
3. Audit logs must not store secrets.
4. Audit logs should be queryable by business and date.
5. Audit logs should not be editable by normal users.

---

### 5.10 Settings

Settings may be split into:

```txt
core business settings
mode-specific settings
```

Core settings examples:

```txt
business profile
currency
timezone
tax default
invoice numbering
enabled payment methods
enabled modes
```

Restaurant settings examples:

```txt
service charge
table service enabled
kitchen flow enabled
dine-in enabled
takeaway enabled
```

Rules:

1. Settings changes that affect business behavior must be audited.
2. Settings must be scoped by business.
3. Frontend must not decide final settings behavior.
4. Mode-specific settings must not pollute core settings.

---

### 5.11 Index Strategy

Indexes should support common queries.

Recommended index patterns:

```txt
restaurantId
restaurantId + status
restaurantId + createdAt
restaurantId + status + createdAt
restaurantId + paymentStatus
restaurantId + orderNumber
restaurantId + email where applicable
restaurantId + inventoryItemId
restaurantId + sourceType + sourceId
```

Common indexed access patterns:

```txt
list orders by restaurant
list orders by status
list kitchen orders
list serving orders
list payments by date
list stock movements by item
list audit logs by date
find order by order number
```

Do not add random indexes everywhere.

Indexes improve reads but add write cost.

Use indexes for real query patterns.

---

### 5.12 Pagination Strategy

Large tables must use pagination.

Tables that require pagination:

```txt
orders
payments
stock movements
audit logs
cashflow entries
invoices
customers
suppliers
employees
reports
```

Default:

```txt
page = 1
limit = 20
max limit = 100
```

Do not return all records to frontend.

Bad:

```ts
await prisma.order.findMany({
  where: { restaurantId },
});
```

Good:

```ts
await prisma.order.findMany({
  where: { restaurantId },
  take: limit,
  skip: (page - 1) * limit,
  orderBy: { createdAt: "desc" },
});
```

Cursor pagination may be used for very large tables.

---

### 5.13 File Storage

Use object storage for files.

File types:

```txt
menu image
business logo
user avatar
invoice PDF
report export
payment proof
attachment
```

Upload flow:

```txt
frontend selects file
↓
backend validates user and permission
↓
backend validates file type and size
↓
file uploaded to object storage
↓
database stores file metadata/path
```

File metadata model concept:

```txt
FileAsset
- id
- restaurantId / businessId
- fileKey
- fileName
- mimeType
- size
- url
- visibility
- uploadedById
- createdAt
```

Visibility:

```txt
PUBLIC
PRIVATE
INTERNAL
```

Public examples:

```txt
menu image
business logo
```

Private examples:

```txt
invoice PDF
payment proof
export report
```

---

### 5.14 Planned Mode Data Strategy

Planned modes should be documented before full implementation.

Retail may need:

```txt
Product
SKU
Barcode
Receiving
StockOpname
Promotion
ShelfLocation
```

Raw Material / Kandang may need:

```txt
Intake
WeighingRecord
Batch
Lot
Kandang
LivestockGroup
ProcessingRecord
QualityCheck
ShrinkageRecord
```

Service may need:

```txt
ServiceCatalog
ServiceRequest
ServiceJob
Assignment
JobProgress
ServiceInvoice
```

Do not add all planned mode models during Restaurant MVP unless there is a real implementation plan.

---

### 5.15 Backup and Restore

Before production:

```txt
automated database backup
manual restore test
object storage backup plan
migration backup plan
```

Minimum backup checklist:

```txt
daily database backup
backup retention period
restore procedure documented
production secrets protected
migration rollback plan when possible
```

A backup that has never been restored is just a comforting rumor.

---

## 6. Anti-Patterns

Do not:

- Use Float for money
- Store large files directly in PostgreSQL
- Query tenant-owned data without scope
- Use `findUnique` by ID only for business-owned resources
- Trust frontend restaurantId/businessId/tenantId
- Trust frontend calculated total
- Recalculate old order total from current menu price
- Update stock quantity without stock movement
- Create payment without duplicate protection
- Create order without item snapshots
- Create invoice without item snapshots
- Drop production columns casually
- Reset production database
- Rename restaurantId to businessId without migration plan
- Add all future mode tables before needed
- Mix raw material batch logic into Restaurant MVP inventory
- Put file secrets or signed URLs into public fields carelessly
- Store passwordHash in API response
- Store sensitive secrets in audit logs
- Add random indexes without query reason
- Return unlimited rows to frontend
- Treat cache as source of truth

---

## 7. Checklist

Database and storage are acceptable when:

- [ ] PostgreSQL is used for structured business data.
- [ ] Prisma schema is valid.
- [ ] Business-owned tables are scoped.
- [ ] Queries filter by business scope.
- [ ] Money fields do not use Float.
- [ ] Order items store snapshots.
- [ ] Invoice items store snapshots.
- [ ] Stock changes create stock movement.
- [ ] Payment is duplicate-safe.
- [ ] Multi-write critical actions use transactions.
- [ ] Important actions create audit logs.
- [ ] Large list queries use pagination.
- [ ] Common queries have relevant indexes.
- [ ] Files are stored in object storage.
- [ ] Database stores file metadata, not large file blobs.
- [ ] Settings are scoped and audited when important.
- [ ] Migrations are reviewed before apply.
- [ ] Production database is not reset casually.
- [ ] Backup plan exists before production.
- [ ] Planned mode models are not added randomly.
- [ ] Restaurant / F&B schema remains stable during V3 preparation.

---

## 8. References

Related documents:

- 00-ai-context.md
- 01-system-design.md
- 02-system-architecture.md
- 04-backend-api.md
- 06-auth-permissions.md
- 09-security.md
- 12-error-tracking-logs.md
- 14-testing.md
- appendices/status-transitions.md
- appendices/permission-keys.md
- appendices/implementation-rules.md