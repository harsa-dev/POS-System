# Raw Material Mode

## 1. Status

Raw Material mode is currently a frontend-safe V3 workspace foundation.

Current scope:

```txt
Mock data only
API contract only
No Prisma schema change
No migration
No real database write
No stock mutation
```

This mode exists to validate workflow shape before the database design is locked.

---

## 2. Active Workspace Routes

```txt
/v3/raw-material/intake
/v3/raw-material/weighing
/v3/raw-material/batches
/v3/raw-material/storage
/v3/raw-material/processing
/v3/raw-material/kandang
/v3/raw-material/suppliers
```

Each route is protected by `requiredMode="raw-material"`.

---

## 3. Current Frontend Modules

| Module | Purpose |
| --- | --- |
| Supplier Intake | Receiving supplier delivery and quality state preview |
| Weighing | Gross, tare, net, station, and operator preview |
| Batches | Lot code, expiry, remaining quantity, and traceability preview |
| Storage | Location capacity and usage preview |
| Processing | Raw-to-output transformation and yield preview |
| Kandang | Livestock pen, occupancy, feed batch, and health preview |
| Suppliers | Source identity, lead time, category, and reliability preview |

---

## 4. Files

```txt
artifacts/pos-system/src/features/raw-material/core-system/
├─ index.ts
├─ raw-material.api-contract.ts
├─ raw-material.mock-data.ts
├─ raw-material.mock-service.ts
└─ raw-material.types.ts
```

Workspace UI:

```txt
artifacts/pos-system/src/app/workspace/raw-material/raw-material-placeholder-workspace.tsx
```

---

## 5. API Contract

The API contract is intentionally frontend-only at this stage.

Example planned endpoints:

```txt
GET   /api/v3/raw-material/intakes
POST  /api/v3/raw-material/intakes
POST  /api/v3/raw-material/weighings
GET   /api/v3/raw-material/batches
PATCH /api/v3/raw-material/storage/transfers/:id
POST  /api/v3/raw-material/processing-runs
GET   /api/v3/raw-material/kandang/pens
GET   /api/v3/raw-material/suppliers
```

Contract entries define:

```txt
method
path
purpose
requestShape
responseShape
persistence: mock-only | future-db
```

No API handler should be added until the database design is reviewed.

---

## 6. Mock Service Rule

The workspace must consume mock data through:

```ts
rawMaterialMockService
```

Do not import raw mock arrays directly into new UI unless the helper needs lookup data.

Correct:

```ts
const intakes = rawMaterialMockService.listIntakes();
```

Avoid:

```ts
const intakes = rawMaterialIntakes;
```

Reason:

```txt
UI should depend on service contract shape.
Later, mock service can be replaced by API client with minimum UI changes.
```

---

## 7. Database Boundary

Do not touch these until the mode is reviewed:

```txt
prisma/schema.prisma
migration files
seed scripts
stock movement mutations
inventory deduction logic
```

Raw material mode will likely need new database concepts later:

```txt
supplier source
intake document
weighing record
batch / lot
storage location
storage transfer
processing run
kandang pen
livestock event
quality inspection
```

But these are not approved yet.

---

## 8. Advancement Checklist

Before real schema work, complete this checklist:

```txt
1. Workspace route works in raw-material mode.
2. Sidebar entry opens every raw material module.
3. Mock service returns typed API envelopes.
4. API contract covers read and write intent.
5. UI displays contract readiness.
6. No Prisma/schema/migration touched.
7. No backend handler pretending to be production.
8. No inventory mutation exists yet.
```

---

## 9. Next Safe Step

The next safe step is:

```txt
Add form-only draft interactions with local component state.
```

Example:

```txt
Create intake draft
Create weighing draft
Filter batches
Filter suppliers
Preview storage transfer
Preview processing yield
```

Still no database write.

---

## 10. Hard Rule

If a future task asks to make raw material mode production-ready, do not start from Prisma schema immediately.

Start from:

```txt
business flow
entity relationship draft
API contract review
validation rules
tenant scope rules
audit event design
then schema
```

Skipping this order creates database regret. Database regret is the software equivalent of stepping on Lego and then paying cloud bills.
