# Raw Material Mode

## 1. Status

Raw Material mode is an active V3 workspace with backend-backed operational persistence for suppliers, storage, intakes, weighings, batches, processing runs, kandang pens, stock movements, guarded workflow writes, and summary metrics.

Current scope:

```txt
Backend-backed operational reads
Guarded stock and workflow mutations
Audit-backed Raw Material writes
Sample/mock fallback for backend-offline preview only
Finance/procurement/invoice/HPP remains planned
```

This mode should not present procurement cashflow, supplier invoice hold, or HPP/COGS as real until purchase, supplier invoice, and costing models are intentionally designed.

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
| Kandang | Pen occupancy, feed batch, and health preview |
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
artifacts/pos-system/src/app/workspace/raw-material/
├─ raw-material-workspace.tsx
├─ raw-material-workspace.constants.ts
├─ raw-material-workspace.types.ts
└─ raw-material-workspace.utils.ts
```

Current split boundary:

| File | Responsibility |
| --- | --- |
| `raw-material-workspace.tsx` | API-first composition container and guarded Raw Material workspace |
| `raw-material-workspace.constants.ts` | Module icons, badge tone maps, filter option constants |
| `raw-material-workspace.types.ts` | UI-only draft/filter types |
| `raw-material-workspace.utils.ts` | UI lookup helpers, numeric parser, filter normalizers |

The workspace should keep shrinking as sections become stable.

---

## 5. API Contract

The API contract is backend-backed for core operational reads and guarded writes.

Implemented operational endpoints include:

```txt
GET    /raw-material/summary
GET    /raw-material/suppliers
GET    /raw-material/storage-locations
GET    /raw-material/intakes
GET    /raw-material/weighings
GET    /raw-material/batches
GET    /raw-material/processing-runs
GET    /raw-material/pens
GET    /raw-material/stock-movements
POST   /raw-material/stock-movements/adjust
POST   /raw-material/stock-movements/transfer
POST   /raw-material/stock-movements/consume-processing
```

Contract entries define:

```txt
method
path
purpose
requestShape
responseShape
persistence: backend-backed | backend-backed-with-mock-fallback | future-db
```

Procurement, supplier invoice, and HPP/COGS handlers should stay planned until the matching schema exists.

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

## 7. Workspace Refactor Rule

Do not let `raw-material-workspace.tsx` grow forever.

Move code in this order:

```txt
1. constants
2. UI-only types
3. pure helper functions
4. read-only display sections
5. local draft forms
6. preview action panels
7. final route-specific screens
```

Do not extract a component if it hides business rules or makes state flow harder to read.

Target future shape:

```txt
raw-material-workspace.tsx
raw-material-workspace-shell.tsx
raw-material-draft-forms.tsx
raw-material-preview-actions.tsx
raw-material-filtered-tables.tsx
raw-material-static-snapshots.tsx
```

The current phase has completed steps 1-3.

---

## 8. Database Boundary

The current schema already includes operational Raw Material models for:

```txt
suppliers
storage locations
intakes
weighings
batches / lots
processing runs
kandang pens
stock movements
```

Do not add these finance/procurement concepts until the workflow is reviewed:

```txt
purchase / procurement order
purchase item
supplier invoice
supplier invoice payment
average material cost
COGS / HPP accounting ledger
```

These are not approved yet and must not be represented as real UI.

---

## 9. Advancement Checklist

Before real schema work, complete this checklist:

```txt
1. Workspace route works in raw-material mode.
2. Sidebar entry opens every raw material module.
3. Mock service returns typed API envelopes.
4. API contract covers read and write intent.
5. UI displays contract readiness.
6. Operational Prisma/schema/migration alignment is documented.
7. No backend handler pretending to be production.
8. Unsupported finance/procurement/HPP surfaces are hidden or clearly planned.
9. Workspace constants/types/utils are split from temporary composition file.
```

---

## 10. Next Safe Step

The next safe step is:

```txt
Extract read-only display sections into small components.
```

Candidate sections:

```txt
metrics grid
readiness card
API contract card
storage capacity
processing runs
kandang snapshot
supplier filter preview
```

Still no unsupported finance/procurement database write.

---

## 11. Hard Rule

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
