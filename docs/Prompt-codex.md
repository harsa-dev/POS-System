POS System V3 Phase 4A: Raw Material Mode Deep Hardening, Flow Completion, Shared Dashboard Wiring, and Structure Cleanup
Context

Phase 1, Phase 2, and Phase 3 cleanup have already been implemented locally.

Current business modes:

restaurant: active
retail: active
raw-material: active
custom-business: planned / guarded only

This task is scoped to Raw Material mode only, plus shared infrastructure only when Raw Material needs it.

Do not work broadly across all modes.
Do not polish Restaurant or Retail except when a shared helper/config must be adjusted to support Raw Material correctly.

Work locally only.

Do not:

create branch
commit
push
open PR
implement full Custom Business / Service
rewrite the whole app
change database schema unless Raw Material genuinely needs Prisma alignment and the reason is documented
Main Goal

Make Raw Material mode feel like a real, clean, guarded, maintainable business mode.

This includes:

Raw Material frontend flow hardening.
Raw Material backend/API polish.
Raw Material Prisma/database alignment if needed.
Raw Material shared dashboard wiring.
Raw Material route guard and access guard tightening.
Raw Material feature limiting.
Raw Material folder/file structure cleanup.
Raw Material naming cleanup.
Raw Material duplicate/hardcoded code cleanup.
Raw Material fat file split.
Raw Material edge case handling.
Raw Material docs update.
Raw Material verification.

This phase is incomplete if Raw Material remains a placeholder-style workspace without clear structure and flow.

Scope Boundary

Focus only on:

artifacts/pos-system/src/features/raw-material
artifacts/pos-system/src/app routes related to raw-material
artifacts/pos-system/src/config related to raw-material
artifacts/pos-system/src/lib helpers used by raw-material
artifacts/pos-system/src/components used by raw-material
artifacts/pos-system/src/features/shared only when Raw Material dashboard wiring needs it
artifacts/api-server routes/services/controllers related to raw-material
Prisma schema only if Raw Material requires real backend alignment
docs related to Raw Material and V3 business modes
scripts/checks related to Raw Material

Do not modify unrelated Restaurant/Retail logic unless:

Raw Material imports shared code that has a bug.
Shared dashboard wiring needs a reusable mode-aware helper.
Business mode contract needs a Raw Material correction.
Route guard logic must be corrected for Raw Material.

If you touch shared files, explain why.

Required First Steps

Before editing:

Read all docs related to V3, Raw Material, business modes, shared dashboards, API, database, and phase notes.
Inspect the Raw Material feature folder.
Inspect Raw Material routes.
Inspect Raw Material navigation/sidebar/module registry.
Inspect Raw Material API clients.
Inspect Raw Material backend/API routes and services.
Inspect Prisma schema for raw material/inventory/stock/supplier/material-related models.
Inspect shared dashboards and how they should receive Raw Material context.
Inspect business mode guard logic for Raw Material.
Inspect scripts/checks related to Raw Material.
Write a short audit plan before changing code.

Search terms:

raw-material
rawMaterial
material
materials
supplier
suppliers
stock
stock movement
inventory
procurement
purchase
kandang
unit
low stock
minimum stock
warehouse
service
fnb
businessMode
currentBusinessMode
shared dashboard
dashboard
cashflow
analytics
invoice
report
sidebar
module
registry
role
permission
guard

If old names like warehouse still appear in active Raw Material runtime code, fix them.
Historical docs can mention old names only if they clearly say they are legacy.

Raw Material Product Definition

Raw Material mode should represent a business workflow for managing raw goods/materials.

Expected domain areas:

Material list
Supplier list
Stock level
Stock movement
Low-stock alert
Unit handling
Procurement/purchase planning if already present
Material usage tracking if already present
Inventory correction if already present
Reports/analytics integration if shared dashboards support it

Do not invent a massive ERP system.
Complete and harden what already exists.

If a feature does not exist yet, do not build it fully unless it is a small guard/state/helper needed to make the current flow coherent.

Part 1: Raw Material Flow Audit

Audit current Raw Material flow end-to-end.

Check:

Entry Flow
User selects Raw Material from /select-mode.
Correct mode ID is stored: raw-material.
User is redirected to correct Raw Material dashboard/workspace.
Refresh keeps valid mode.
Invalid mode redirects safely.
Old warehouse value does not become active runtime mode.
Old service value does not become active runtime mode.
Old fnb value does not affect Raw Material.
Route Flow
Direct Raw Material route works when selected mode is raw-material.
Direct Raw Material route redirects safely when no mode is selected.
Direct Raw Material route redirects safely when selected mode is restaurant.
Direct Raw Material route redirects safely when selected mode is retail.
Direct Raw Material route redirects safely when selected mode is custom-business.
next param behavior is safe and predictable if used.
Navigation Flow
Sidebar shows only Raw Material-relevant modules.
Sidebar order matches canonical registry.
Sidebar role permissions match actual access.
No Restaurant/Retail/Custom Business modules leak into Raw Material.
No FNB/Warehouse/Service active labels appear.
Data Flow
Material data loads safely.
Supplier data loads safely.
Stock data loads safely.
Empty states are handled.
API error states are handled.
Malformed API envelope is handled.
Slow loading state is handled if applicable.
Duplicate submit is prevented where there are forms/actions.
Part 2: Raw Material Edge Cases

Add guards, states, and validation for these edge cases where the current app supports the flow:

No materials.
No suppliers.
Material below minimum stock.
Material out of stock.
Material unit missing.
Invalid unit.
Invalid stock quantity.
Negative stock movement where not allowed.
Stock movement quantity is zero.
Supplier deleted/unavailable.
Material deleted while selected.
Duplicate stock update submit.
API returns empty array.
API returns error envelope.
API returns malformed envelope.
User opens Raw Material route with wrong selected mode.
User refreshes after selecting Raw Material.
User manually sets currentBusinessMode to warehouse.
User manually sets currentBusinessMode to rawMaterial.
User manually sets currentBusinessMode to invalid random string.
Planned Custom Business must not reuse Raw Material UI.
Raw Material shared dashboard must not show Restaurant/Retail copy.

Do not create fake UI just to claim edge cases are handled.
Use real guards, empty states, validation, and safe fallbacks.

Part 3: Raw Material Prisma / Database Alignment

Inspect Prisma schema and backend models related to Raw Material.

Check whether Raw Material currently has proper persistence for:

materials
suppliers
stock level
stock movement
unit
minimum stock threshold
material category/type if present
purchase/procurement if present
audit log if present
user/business ownership if present

If Prisma models already exist:

verify API/services use them correctly
verify frontend types match backend response
verify request schemas match database constraints
verify nullable fields are handled
verify ownership/tenant scoping exists if applicable

If Prisma models do not exist but Raw Material frontend pretends data is real:

do not add a massive schema blindly
document the mismatch
add Prisma only if necessary to make Raw Material mode coherent and testable
keep schema changes minimal and scoped
explain every Prisma change

Allowed Prisma additions only if needed:

RawMaterial / Material model
Supplier model
RawMaterialStockMovement / MaterialStockMovement model
necessary enums for movement type/unit/status
relations to user/business/restaurant/company if existing architecture requires it

Rules:

Do not break existing Restaurant or Retail schema.
Do not rename broad shared models without strong reason.
Do not create destructive migrations.
Do not add nullable chaos just to make things pass.
Do not add schema fields that are not used by current Raw Material flow.
If migration is required, document exact command and risk.
If environment cannot run Prisma generate/migrate, report it honestly.
Part 4: Raw Material Backend/API Hardening

Audit and improve backend/API only for Raw Material-related flow.

Check:

API Design
endpoints match frontend calls
endpoint names match behavior
request payload matches frontend
response shape matches frontend
response envelope is consistent
status codes are correct
errors are safe
Validation
route params validated
body validated
unit validated
quantity validated
supplier ID validated
material ID validated
movement type validated
required fields enforced server-side
Security / Guarding
no invalid mode accepted
no old warehouse mode accepted as active API mode
no client mode trusted blindly
ownership/tenant filter exists if architecture has owner/business IDs
role permission checks exist if role system applies
unsafe internal errors are not leaked
Service Structure
route handler should not contain too much business logic
repeated mapper logic should be extracted
repeated response/error logic should use shared helper if already available
stock movement writes should be consistent
stock level update should be safe
audit log write should be consistent if used

Do not rewrite all backend.
Only harden Raw Material-related backend/API.

Part 5: Raw Material Shared Dashboard Wiring

Wire Raw Material mode into shared dashboards according to existing shared dashboard context.

Inspect shared dashboards such as:

Sales Analytics
Customers & Partners
Inventory Management
Cashflow
Financial Reports
Invoice Generator
Shift Cashier Reports
Team Management
Any shared dashboard registry/module system

For each shared dashboard, decide Raw Material behavior:

Supported and useful for Raw Material
Supported but with Raw Material-specific labels/data mapping
Not supported and should be hidden/disabled for Raw Material
Planned only and should show clear state

Expected examples:

Inventory Management

Raw Material should likely be supported.
It should show:

material stock
low stock
supplier/material context
stock movement
unit-aware quantities
Financial Reports

May be supported if data exists.
It should not show Restaurant/Retail-only wording.
If Raw Material financial data does not exist, show planned/empty state.

Cashflow

May be supported if purchases/procurement/stock costs exist.
If no real data exists, do not fake it.
Show guarded empty/planned state.

Invoice Generator

Only support if Raw Material has purchase/supplier invoice context.
Otherwise hide or mark as not available for Raw Material.

Shift Cashier Reports

Probably not relevant to Raw Material unless the business flow has cashier.
Hide or mark unsupported for Raw Material.

Customers & Partners

For Raw Material, this may map to suppliers/partners.
If used, rename copy/context properly.

Sales Analytics

Probably not directly relevant unless Raw Material has sales.
Hide, disable, or show not applicable.

Rules:

Do not show Restaurant/Retail dashboard copy in Raw Material.
Do not fake data.
Do not wire unsupported dashboards just to make sidebar full.
Shared dashboard visibility must be mode-aware.
Shared dashboard labels must be context-aware.
Shared dashboard empty states must be context-aware.
Raw Material should only see dashboards that make business sense.

If a shared dashboard needs mode-specific adapter:

create a clean adapter/helper
keep adapter config typed
do not hardcode mode checks everywhere
avoid giant switch statements inside UI components
Part 6: Raw Material Guarding, Limiting, and Permissions

Tighten access control for Raw Material.

Audit:

route guard
sidebar visibility
feature visibility
role permissions
planned/unsupported dashboard visibility
direct URL access
API access if backend has auth/roles

Rules:

unsupported Raw Material features should not appear as active.
role-limited modules should be hidden or disabled consistently.
direct route access should not bypass UI guard.
backend should still validate if data mutation exists.
shared dashboards must check whether Raw Material supports them.
planned features should be clearly marked, not broken.

If role system exists:

define which roles can access Raw Material modules.
avoid copy-paste Restaurant roles if they do not fit.
if uncertain, use conservative access and document it.
Part 7: Raw Material File Structure Cleanup

Clean Raw Material folder structure.

Preferred structure:

features/raw-material/
  components/
    dashboard/
    materials/
    suppliers/
    stock/
    shared/
  hooks/
  services/
  schemas/
  types/
  utils/
  constants/
  config/

Only create folders that are actually used.

Move files if needed:

components into components
local hooks into hooks
API clients/services into services
Zod/form schemas into schemas
domain types into types
formatting/domain helpers into utils
labels/status/routes/config into config or constants

Rules:

no giant dumping file
no vague utils.ts if domain-specific
no placeholder naming if file is active production route
no warehouse naming in active Raw Material runtime
no Restaurant/Retail logic inside Raw Material
no Raw Material-specific logic inside global shared unless truly shared

If raw-material-placeholder-workspace.tsx is active runtime:

rename it to an accurate name
split it into smaller files
remove placeholder wording unless it is truly a planned-only page
Part 8: Raw Material Fat File Split

Identify and split Raw Material fat files.

Known candidate:

raw-material-placeholder-workspace.tsx

Also search for other large Raw Material files.

For each fat file:

identify responsibilities
extract constants
extract helper functions
extract child components
extract hooks if stateful logic is reusable
extract schemas/types if useful
update imports
preserve visible behavior
run Raw Material typecheck

Extraction examples:

raw-material-workspace.tsx
raw-material-dashboard-header.tsx
raw-material-metric-cards.tsx
material-stock-table.tsx
supplier-list-section.tsx
low-stock-alerts.tsx
stock-movement-section.tsx
raw-material-empty-state.tsx
raw-material-status-badge.tsx
raw-material-units.config.ts
raw-material-stock.helpers.ts
raw-material-dashboard-metrics.ts

Do not over-split into tiny useless files.

Part 9: Raw Material Naming Cleanup

Canonical naming:

Mode ID: raw-material
User label: Raw Material
Folder: features/raw-material
Route slug: keep existing canonical route if docs define it, otherwise use consistent V3 route
Type name examples:
RawMaterialMode
RawMaterialItem
RawMaterialSupplier
RawMaterialStockMovement

Avoid:

warehouse as active name
rawMaterial in route strings if canonical route uses kebab-case
service
fnb
placeholder for active workspace
data.ts
helper.ts
utils.ts
temp
old
final

Rename misleading files/functions/variables.

After renaming:

update imports
update docs
run Raw Material typecheck
Part 10: Raw Material Hardcode and Duplicate Cleanup

Remove Raw Material hardcodes and repeated logic.

Centralize repeated:

Raw Material route paths
Raw Material module IDs
Raw Material dashboard labels
material status labels
stock movement labels
unit labels
low-stock threshold logic
supplier labels
empty state copy if repeated
API endpoints if repeated
table column configs if repeated
card metric configs if repeated
formatter helpers

Do not centralize one-off text.

Avoid scattered checks like:

mode === "raw-material"
path.includes("raw-material")
unit === "kg"
status === "low"

Prefer typed helpers/configs when repeated:

isRawMaterialMode(mode)
RAW_MATERIAL_ROUTES
RAW_MATERIAL_UNITS
getRawMaterialStockStatus()
formatRawMaterialQuantity()
Part 11: Frontend Polish for Raw Material

Polish Raw Material UI.

Focus:

dashboard clarity
material list/table readability
supplier section clarity
stock movement clarity
low-stock alert visibility
empty states
loading states
error states
form validation messages
disabled states
duplicate submit prevention
responsive layout
consistent badges
consistent buttons
context-aware shared dashboard copy

Do not redesign the whole app.
Polish existing UI so Raw Material feels intentional, not leftover.

Part 12: Tests and Verification

Run Raw Material-specific checks first.

Try pnpm if available:

pnpm --filter @workspace/pos-system run typecheck:raw-material
pnpm raw-material:check
pnpm business-mode:check

If pnpm is blocked by EPERM lstat C:\Users\LENOVO, use local commands:

tsc -p artifacts/pos-system/tsconfig.raw-material.json --noEmit

Also run:

cd artifacts/pos-system
vite build

Run backend check if backend touched:

tsc -p artifacts/api-server/tsconfig.json --noEmit

Run Prisma checks only if Prisma touched:

npx prisma generate
npx prisma validate

If Prisma commands are blocked by environment:

report the exact issue
do not claim they passed

Run business mode switch check:

node scripts/business-mode-switch-check.mjs

Run sidebar parity if Raw Material navigation/sidebar was touched.

Important:

do not claim full frontend typecheck passed if it times out
separate passed/failed/blocked/timed-out checks
separate pre-existing issues from issues caused by this phase
Part 13: Manual QA Checklist

Provide exact manual QA steps for Raw Material.

Must include:

Mode selection
Open /select-mode.
Select Raw Material.
Confirm selected mode is stored as raw-material.
Confirm app redirects to Raw Material dashboard/workspace.
Refresh and confirm Raw Material stays active.
Invalid mode
Clear currentBusinessMode.
Open Raw Material route directly.
Confirm safe redirect.
Set currentBusinessMode to warehouse.
Refresh and confirm it does not become active runtime mode.
Set currentBusinessMode to rawMaterial.
Refresh and confirm it is rejected or repaired only at storage boundary if intended.
Set random invalid value.
Confirm safe redirect.
Raw Material workspace
Open Raw Material dashboard.
Check material list/table.
Check supplier section.
Check stock movement section if present.
Check low-stock section if present.
Check empty material state.
Check empty supplier state.
Check loading/error state if possible.
Try invalid quantity if form exists.
Try duplicate submit if form exists.
Confirm no Restaurant/Retail copy appears.
Confirm no FNB/Warehouse/Service active label appears.
Shared dashboards
Open each shared dashboard visible in Raw Material.
Confirm dashboard is relevant to Raw Material.
Confirm unsupported dashboards are hidden, disabled, or show not-applicable/planned state.
Confirm copy uses material/supplier/stock context where appropriate.
Confirm no Restaurant/Retail-only metric appears as Raw Material data.
Part 14: Documentation

Update or create:

docs/v3-phase-4a-raw-material-hardening.md

Include:

Raw Material current scope
supported Raw Material modules
planned/unsupported modules
shared dashboard wiring decisions
Prisma/backend decisions
folder structure changes
helpers/components created
commands run
remaining risks
manual QA checklist

Update existing docs if they become outdated.

Docs must not claim Raw Material supports a dashboard or backend feature that does not exist.

Strict Rules
Work only on Raw Material mode unless shared infrastructure is required.
Do not globally refactor Restaurant/Retail.
Do not implement full Custom Business / Service.
Do not reintroduce warehouse as active runtime mode.
Do not reintroduce fnb.
Do not treat service as active mode.
Do not use any, as any, as unknown as, @ts-ignore, or @ts-expect-error.
Do not create fake compatibility bridges.
Do not add Prisma schema unless Raw Material genuinely needs it.
Do not create destructive database migrations.
Do not make shared dashboards show fake Raw Material data.
Do not show unsupported dashboards as active features.
Do not leave placeholder naming on active Raw Material runtime files.
Do not leave fat Raw Material files untouched without a clear reason.
Do not create giant utils.ts.
Do not move Raw Material-specific code into shared.
Do not let shared code import from Raw Material.
Do not centralize one-off values.
Do not delete useful logic.
Do not silently skip checks.
Do not claim checks passed unless they passed.
Do not push, commit, branch, or PR.
Final Report Format

Return this exact report:

Phase 4A Raw Material Report
1. Summary
2. Docs read
3. Raw Material audit
files inspected
routes inspected
backend/API inspected
shared dashboards inspected
Prisma inspected
4. Flow fixes
mode selection
route guard
sidebar/navigation
data loading
edge cases
5. Shared dashboard wiring

For each shared dashboard:

supported / unsupported / planned
behavior
files changed
reason
6. Prisma/database changes
changed or not changed
reason
migration/generate status
risks
7. Backend/API changes
files changed
validation changes
response/error handling
security/ownership/role checks
remaining risks
8. Frontend/UI changes
files changed
components split
polish made
loading/empty/error states
remaining risks
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
what was removed
what was centralized
why
12. Files deleted

For each:

path
why safe to delete
13. Commands run

For each:

command
passed/failed/blocked/timed out
notes
14. Manual QA checklist
15. Remaining risks
16. Next recommended task

Give only one next task.