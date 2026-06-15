POS System V3 Phase 4B: Raw Material Persistence, Workflow Delegates, Procurement Cashflow, Supplier Invoice Hold, and HPP Costing
Context

Phase 4A Raw Material cleanup has already been implemented locally.

Known Phase 4A result:

Active Raw Material workspace was renamed from placeholder naming to raw-material-workspace.tsx.
Raw Material routes now lazy-load RawMaterialWorkspace.
Old raw-material-placeholder-workspace.tsx was deleted.
Debug/dummy wording was replaced with planning-preview/sample/preview language.
Raw Material scale dashboard status changed from new-dummy to planning-preview.
dummyMetric became previewMetric.
Raw Material shared-dashboard bridge behavior moved into features/shared/dashboard/dashboard-shell.tsx.
One-off Raw Material cashflow wrapper was removed from cashflow-workspace.tsx.
Unrelated shared surfaces like payroll, attendance, contracts, audit log, roster overview, and platform monitoring were restricted for Raw Material.
Backend audit found Raw Material routes already use requireBusinessMode(["raw-material"]) and Raw Material permission checks.
TypeScript checks passed through local commands.
Vite build passed.
pnpm commands remain blocked by local permission issue.
Browser QA could not run because local browser/runtime failed.

This Phase 4B task is still scoped to Raw Material mode only, plus shared infrastructure only when required for Raw Material.

Do not work broadly on Restaurant or Retail.
Do not push, branch, commit, or open PR.
Work locally only.

Main Goal

Turn Raw Material from mostly preview/planning surfaces into a coherent persisted business mode where the current UI can safely read/write real data where appropriate.

Focus areas:

Raw Material persistence.
Procurement cashflow.
Supplier invoice hold.
HPP / COGS costing.
Workflow write delegates.
Raw Material API contracts.
Raw Material Prisma alignment if needed.
Raw Material shared dashboard wiring based on real support, not fake preview data.
Guarding and limiting unsupported flows.
File structure, naming, helper extraction, and docs.

This is not a full ERP build.
Implement only the minimal real workflow needed to make the current Raw Material surfaces honest and testable.

Strict Scope

Work only on:

artifacts/pos-system/src/app/workspace/raw-material
artifacts/pos-system/src/features/raw-material
artifacts/pos-system/src/features/shared only when Raw Material shared-dashboard wiring requires it
artifacts/pos-system/src/config related to Raw Material mode/modules/routes
artifacts/pos-system/src/lib/api or helpers used by Raw Material
artifacts/api-server Raw Material related routes/services/controllers
Prisma schema only if needed for Raw Material persistence
docs related to Raw Material and V3 phases
scripts/checks related to Raw Material

Do not modify Restaurant/Retail except when:

shared contracts break because of Raw Material wiring
shared dashboard adapter must become mode-aware
business mode contract needs a Raw Material correction

If you touch shared files, explain why.

Required First Steps

Before editing code:

Read all Raw Material docs.
Read V3 canonical business mode docs.
Read Phase 4A Raw Material hardening docs.
Inspect Raw Material workspace and feature folder.
Inspect Raw Material API clients.
Inspect Raw Material backend routes/services.
Inspect Prisma schema.
Inspect shared dashboards currently visible to Raw Material.
Inspect cashflow, invoice, inventory, financial report, and dashboard shell shared files.
Inspect role/permission guards for Raw Material.
Produce a short implementation plan before editing.

Search terms:

raw-material
rawMaterial
material
materials
supplier
suppliers
procurement
purchase
purchase order
invoice
supplier invoice
cashflow
cash flow
hpp
cogs
costing
stock
stock movement
inventory
movement
unit
low stock
minimum stock
planning-preview
previewMetric
preview
sample
workflow delegate
delegate
write
mutation
requireBusinessMode
raw-material permission
Part 1: Decide What Should Become Real vs Stay Planned

Audit every Raw Material surface and classify it:

Real and should persist now.
Real read-only for now.
Preview/planned only.
Unsupported and should be hidden/disabled.
Shared dashboard that needs Raw Material adapter.

You must classify at least:

Material list
Supplier list
Stock level
Stock movement
Low-stock alerts
Procurement cashflow
Supplier invoice hold
HPP / COGS costing
Inventory Management shared dashboard
Cashflow shared dashboard
Financial Reports shared dashboard
Invoice Generator shared dashboard
Customers & Partners shared dashboard
Sales Analytics shared dashboard
Shift Cashier Reports shared dashboard

Rules:

Do not fake data as real.
Do not leave fake preview data on a surface that claims persistence.
Do not wire unsupported dashboards as if they work.
If a surface remains preview, label it honestly.
If a surface is real, connect it to real API/persistence.
Part 2: Raw Material Prisma / Database Persistence

Inspect current Prisma schema and backend models.

Determine whether Raw Material already has models for:

materials
suppliers
stock movement
unit
minimum stock
procurement/purchase
supplier invoice
cost/HPP/COGS
audit trail
ownership/tenant/business scope

If suitable models already exist:

use them
do not duplicate models
align API response types
align frontend types
fix nullable handling
fix ownership/tenant filtering if needed

If models are missing and current Raw Material flow needs real persistence:

add minimal Prisma models only for the current flow
keep schema scoped
avoid destructive migrations
avoid broad renames
avoid nullable chaos
avoid fields not used by the current UI/API

Allowed minimal models if missing:

model RawMaterial {
  id             String   @id @default(cuid())
  businessId     String
  name           String
  sku            String?
  unit           String
  currentStock   Decimal  @default(0)
  minimumStock   Decimal  @default(0)
  averageCost    Decimal  @default(0)
  supplierId     String?
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

model RawMaterialSupplier {
  id          String   @id @default(cuid())
  businessId  String
  name        String
  contactName String?
  phone       String?
  email       String?
  address     String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model RawMaterialStockMovement {
  id            String   @id @default(cuid())
  businessId    String
  materialId    String
  type          String
  quantity      Decimal
  unitCost      Decimal?
  totalCost     Decimal?
  referenceType String?
  referenceId   String?
  note          String?
  createdById   String?
  createdAt     DateTime @default(now())
}

Only add equivalent models if the existing schema does not already provide them.

If procurement and supplier invoice persistence is needed, prefer minimal scoped models:

model RawMaterialPurchase {
  id           String   @id @default(cuid())
  businessId   String
  supplierId   String?
  status       String
  subtotal     Decimal  @default(0)
  taxAmount    Decimal  @default(0)
  totalAmount  Decimal  @default(0)
  dueDate      DateTime?
  paidAt       DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model RawMaterialPurchaseItem {
  id          String  @id @default(cuid())
  purchaseId  String
  materialId  String
  quantity    Decimal
  unitCost    Decimal
  totalCost   Decimal
}

model RawMaterialSupplierInvoice {
  id          String   @id @default(cuid())
  businessId  String
  supplierId  String?
  purchaseId  String?
  status      String
  invoiceNo   String?
  amount      Decimal
  dueDate     DateTime?
  paidAt      DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

Only add these if actually needed.

Required:

document every schema decision
run Prisma validate/generate if environment allows
update backend types/services if Prisma changed
update docs

Do not change Restaurant/Retail schema.

Part 3: Procurement Cashflow

Make Raw Material cashflow honest.

Determine current behavior:

Is cashflow shown to Raw Material?
Is it preview-only?
Does it claim real procurement expenses?
Does backend have purchase/payment data?
Does shared cashflow expect sales revenue, which may not fit Raw Material?

Required behavior:

Raw Material cashflow should represent procurement/material spending, supplier payables, inventory cost movement, or planned preview.
It must not show Restaurant/Retail sales copy as Raw Material data.
It must not use fake preview data while pretending it is persisted.
Unsupported metrics must be hidden or marked not available.

If implementing real minimal procurement cashflow:

create/read purchase expense records
map supplier invoice/payment status into cashflow
expose API response for Raw Material cashflow summary
wire shared cashflow dashboard through a Raw Material adapter
label metrics clearly:
procurement spend
pending supplier invoices
paid supplier invoices
stock value
average material cost
low-stock restock estimate if already calculable

Do not implement full accounting.

Part 4: Supplier Invoice Hold

Implement or clarify supplier invoice hold.

Definition:
Supplier invoice hold means supplier invoices can exist in a pending/held/unpaid state before payment is completed.

Audit:

Is there an invoice generator shared dashboard?
Is there supplier invoice UI?
Is there backend support?
Is there Prisma support?
Is there cashflow linkage?

Required behavior:

If supported, supplier invoices must have clear statuses:
draft
held
pending
paid
cancelled
If not supported, hide or mark planned.
Do not reuse customer invoice wording for supplier invoices.
Do not show sales invoice UI as Raw Material supplier invoice UI.
Do not fake invoice persistence.

If implementing minimal support:

add typed status config
add API route/service if needed
add frontend service/client method
show held/pending supplier invoices in Raw Material context
wire to cashflow as payable/pending expense if appropriate
Part 5: HPP / COGS Costing

Raw Material should support cost context if current UI already mentions costing, HPP, COGS, average cost, stock value, or financial reports.

Audit:

Does Raw Material show HPP/costing metrics?
Does inventory have average cost?
Do stock movements store unit cost?
Do purchases update average cost?
Do shared financial reports show irrelevant Restaurant/Retail metrics?

Required behavior:

If HPP/costing is shown, it must be based on clear data or marked preview.
Stock value should be calculated consistently:
currentStock * averageCost
Purchase items should update or at least record unit cost.
Stock movement should store quantity and optional cost if relevant.
Financial reports should not pretend Raw Material has sales/profit data if it only has procurement data.

Possible minimal helper:

calculateRawMaterialStockValue(material)
calculateAverageCostAfterPurchase(previousStock, previousAverageCost, purchaseQuantity, purchaseUnitCost)
calculateRawMaterialMovementTotal(quantity, unitCost)

Keep helpers typed and tested through TypeScript.

Part 6: Workflow Write Delegates

Audit current Raw Material workspace actions.

Check whether UI has buttons/actions for:

add material
edit material
delete/deactivate material
add supplier
edit supplier
record stock movement
record purchase
hold supplier invoice
mark invoice paid
inventory correction
procurement request

For every visible write action:

either wire it to a real API mutation
or disable/mark as planned
or remove it from active UI if unsupported

Do not leave clickable buttons that only mutate local preview data while pretending to be real.

Create workflow delegates where useful:

features/raw-material/services/
  raw-material-api.ts
  raw-material-purchase-api.ts
  supplier-invoice-api.ts

features/raw-material/hooks/
  use-raw-materials.ts
  use-raw-material-suppliers.ts
  use-raw-material-stock-movements.ts
  use-raw-material-cashflow.ts

features/raw-material/utils/
  raw-material-costing.ts
  raw-material-stock-status.ts

Only create files actually used.

Part 7: Raw Material Backend/API Contracts

Create or harden Raw Material API contracts.

Expected API areas if supported:

GET materials
POST material
PATCH material
GET suppliers
POST supplier
PATCH supplier
GET stock movements
POST stock movement
GET procurement cashflow summary
GET supplier invoices
POST supplier invoice hold
PATCH supplier invoice status

Do not implement all if current flow does not need them.

Rules:

validate request body
validate route params
reject invalid business mode
enforce Raw Material permission checks
return consistent envelope
avoid leaking internal errors
keep ownership/tenant scoping
update frontend API clients
avoid duplicated parser logic, use shared read-api-envelope.ts
Part 8: Shared Dashboard Adapter for Raw Material

Instead of scattered if (mode === "raw-material"), create a clean typed adapter/config if needed.

Possible file:

features/shared/dashboard/mode-dashboard-adapters.ts

Adapter should define for Raw Material:

dashboard availability
labels
empty-state copy
metric mapping
unsupported reason
planned reason
route visibility

Example:

type SharedDashboardSupport = "supported" | "preview" | "planned" | "unsupported";

Rules:

no fake data
no giant untyped switch
no Restaurant/Retail copy leakage
keep Raw Material context clear:
materials
suppliers
procurement
stock
payables
costing
Part 9: Raw Material Guarding and Limiting

Tighten Raw Material feature limiting.

Required:

hide unsupported shared surfaces
disable planned actions clearly
prevent direct route access to unsupported Raw Material dashboards
ensure role guard matches module registry
ensure API guard matches UI guard
ensure wrong selected mode redirects safely
ensure warehouse is not active runtime mode
ensure rawMaterial is not silently accepted unless documented storage migration handles it
Part 10: Structure and Naming Cleanup

Clean Raw Material structure further.

Preferred structure:

features/raw-material/
  components/
    dashboard/
    materials/
    suppliers/
    stock/
    procurement/
    invoices/
    shared/
  config/
  hooks/
  schemas/
  services/
  types/
  utils/

Only create folders that are actually used.

Rules:

no active file should use placeholder naming
no active file should use warehouse naming
no vague dumping files
no giant workspace file if responsibilities can be split
no Raw Material-specific code in global shared unless it is an adapter/config intended for shared dashboard

If raw-material-workspace.tsx is still large:

split it further
extract sections/components/helpers
preserve behavior
Part 11: Frontend Polish

Polish Raw Material UI only.

Focus:

material stock cards
supplier invoice hold section
procurement cashflow summary
low-stock alerts
material table
supplier table
stock movement table
planned/unsupported states
empty states
loading states
error states
disabled states
form validation messages
consistent wording

Do not redesign the whole app.
Make existing UI coherent and honest.

Part 12: Verification

Run Raw Material-focused checks.

Try pnpm first if environment allows:

pnpm --filter @workspace/pos-system run typecheck:raw-material
pnpm raw-material:check
pnpm business-mode:check

If pnpm is blocked by EPERM lstat C:\Users\LENOVO, use:

tsc -p artifacts/pos-system/tsconfig.raw-material.json --noEmit

Also run:

cd artifacts/pos-system
vite build

If backend touched:

tsc -p artifacts/api-server/tsconfig.json --noEmit

If Prisma touched:

npx prisma validate
npx prisma generate

If scripts exist:

node scripts/business-mode-switch-check.mjs

Run sidebar parity only if Raw Material navigation/sidebar/shared dashboard availability changed.

Important:

do not claim full frontend typecheck passed if it times out
do not claim Prisma passed if it was blocked
separate passed, failed, blocked, and timed-out commands
separate pre-existing issues from new issues
Part 13: Manual QA Checklist

Provide Raw Material manual QA steps.

Must include:

Mode and route
Open /select-mode.
Select Raw Material.
Confirm currentBusinessMode is raw-material.
Refresh.
Open Raw Material route directly.
Set invalid currentBusinessMode.
Set old warehouse.
Set old rawMaterial.
Confirm safe behavior.
Materials
Open material list.
Check empty state.
Add material if supported.
Edit material if supported.
Check missing unit handling.
Check low-stock state.
Check out-of-stock state.
Suppliers
Open supplier section.
Check empty state.
Add supplier if supported.
Edit supplier if supported.
Check unavailable/deleted supplier state if supported.
Stock movement
Record stock movement if supported.
Try zero quantity.
Try negative quantity where not allowed.
Check stock update.
Check movement history.
Procurement cashflow
Open cashflow shared dashboard in Raw Material context if visible.
Confirm it shows procurement/material spending context.
Confirm no Restaurant/Retail sales copy.
Confirm preview/planned data is labeled honestly.
Supplier invoice hold
Open supplier invoice section if supported.
Create held invoice if supported.
Mark invoice pending/paid if supported.
Confirm cashflow/payable impact if implemented.
Confirm unsupported flows are disabled or planned.
HPP / COGS
Check stock value.
Check average cost.
Check purchase cost impact if supported.
Confirm financial report does not fake profit/sales if unsupported.
Part 14: Documentation

Create or update:

docs/v3-phase-4b-raw-material-persistence.md

Include:

what became real
what remains planned
Prisma decisions
backend/API contracts
shared dashboard wiring decisions
procurement cashflow behavior
supplier invoice hold behavior
HPP/costing behavior
workflow write delegates
commands run
known limitations
manual QA checklist

Docs must not overclaim.

Strict Rules
Work only on Raw Material unless shared infrastructure is required.
Do not implement Restaurant/Retail changes.
Do not implement full Custom Business/Service.
Do not fake persisted data.
Do not show preview data as real.
Do not add Prisma models unless needed.
Do not create destructive migrations.
Do not change database schema broadly.
Do not accept warehouse as active runtime mode.
Do not accept service as active runtime mode.
Do not reintroduce fnb.
Do not use any, as any, as unknown as, @ts-ignore, or @ts-expect-error.
Do not create fake compatibility bridges.
Do not create giant utils.ts.
Do not leave active write buttons unwired.
Do not leave unsupported dashboards active.
Do not leak Restaurant/Retail copy into Raw Material.
Do not claim checks passed unless they passed.
Do not push, branch, commit, or open PR.
Final Report Format

Return this exact report:

Phase 4B Raw Material Persistence Report
1. Summary
2. Docs read
3. Surface classification

For each Raw Material/shared surface:

real / read-only / preview / planned / unsupported
reason
4. Prisma/database decisions
changed or not changed
models touched/added
migration/generate status
risks
5. Backend/API changes
endpoints changed/added
validation
response envelope
permission/guarding
remaining risks
6. Frontend workflow changes
materials
suppliers
stock movement
procurement cashflow
supplier invoice hold
HPP/costing
planned/unsupported states
7. Shared dashboard wiring

For each shared dashboard:

supported/planned/unsupported
behavior
files changed
reason
8. Workflow write delegates

For each visible write action:

wired / disabled / removed / planned
reason
9. Structure and naming changes

For each moved/renamed file:

old path
new path
reason
10. Helpers/configs/components created

For each:

file path
purpose
where used
11. Hardcoded/duplicate cleanup
12. Commands run

For each:

command
passed/failed/blocked/timed out
notes
13. Manual QA checklist
14. Remaining risks
15. Next recommended task

Give only one next task.

This phase is incomplete if Raw Material still shows procurement cashflow, supplier invoice, or HPP/costing as real UI while backed only by preview/sample data.