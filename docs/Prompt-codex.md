POS System V3 Phase 5A: Restaurant Mode Deep Hardening, Flow Completion, Shared Dashboard Wiring, Prisma/API Alignment, and Structure Cleanup
Context

Phase 1, Phase 2, Phase 3, Phase 4A, and Phase 4B have already been implemented locally.

Current business modes:

restaurant: active
retail: active
raw-material: active
custom-business: planned / guarded only

Raw Material Phase 4A and 4B were scoped separately:

Phase 4A cleaned Raw Material naming, route wiring, shared dashboard restrictions, and planned/unsupported states.
Phase 4B wired Raw Material shared dashboards to prefer the real GET /raw-material/summary backend API where applicable.
Procurement cashflow, supplier invoice hold, financial reports, HPP/COGS remain planned/unsupported for Raw Material because the schema does not exist yet.
Phase 4C will later focus only on Raw Material file splitting and file cleanup.

This Phase 5A task is scoped to Restaurant mode only, plus shared infrastructure only when Restaurant needs it.

Do not work broadly on Retail or Raw Material.
Do not modify Raw Material persistence decisions from Phase 4B.
Do not implement full Custom Business / Service.
Do not push, branch, commit, or open PR.
Work locally only.

Main Goal

Make Restaurant mode feel like a real, clean, guarded, maintainable, and testable business mode.

This includes:

Restaurant frontend flow hardening.
Restaurant backend/API polish.
Restaurant Prisma/database alignment if needed.
Restaurant shared dashboard wiring.
Restaurant route guard and access guard tightening.
Restaurant feature limiting.
Restaurant folder/file structure cleanup.
Restaurant naming cleanup.
Restaurant duplicate/hardcoded code cleanup.
Restaurant fat file split.
Restaurant edge case handling.
Restaurant docs update.
Restaurant verification.

This phase is incomplete if Restaurant still has stale V2/FNB assumptions, large mixed-responsibility files, broken order/table/payment/menu flows, or shared dashboards that show wrong context.

Scope Boundary

Focus only on:

artifacts/pos-system/src/features/restaurant
artifacts/pos-system/src/app routes related to restaurant
artifacts/pos-system/src/config related to restaurant mode/modules/routes
artifacts/pos-system/src/lib helpers used by restaurant
artifacts/pos-system/src/components used by restaurant
artifacts/pos-system/src/features/shared only when Restaurant dashboard wiring needs it
artifacts/api-server routes/services/controllers related to restaurant
Prisma schema only if Restaurant requires real backend alignment
docs related to Restaurant and V3 business modes
scripts/checks related to Restaurant

Do not modify unrelated Retail/Raw Material logic unless:

Restaurant imports shared code that has a bug.
Shared dashboard wiring needs a reusable mode-aware helper.
Business mode contract needs a Restaurant correction.
Route guard logic must be corrected for Restaurant.

If you touch shared files, explain why.

Required First Steps

Before editing:

Read all docs related to V3, Restaurant, business modes, shared dashboards, API, database, and phase notes.
Inspect the Restaurant feature folder.
Inspect Restaurant routes.
Inspect Restaurant navigation/sidebar/module registry.
Inspect Restaurant API clients.
Inspect Restaurant backend/API routes and services.
Inspect Prisma schema for restaurant/order/table/menu/payment/inventory/shift/audit-related models.
Inspect shared dashboards and how they should receive Restaurant context.
Inspect business mode guard logic for Restaurant.
Inspect scripts/checks related to Restaurant.
Write a short audit plan before changing code.

Search terms:

restaurant
fnb
FNB
FnB
menu
menus
menu item
category
order
orders
cashier
checkout
payment
payments
invoice
receipt
table
tables
kitchen
kds
serving
server
shift
tax
service charge
inventory
recipe
stock movement
audit
role
permission
OWNER
MANAGER
CASHIER
KITCHEN
SERVER
businessMode
currentBusinessMode
shared dashboard
dashboard
cashflow
analytics
financial report
invoice generator
sidebar
module
registry
guard

If old names like fnb, FNB, FnB, or Restaurant / F&B still appear in active Restaurant runtime code, fix them.
Historical docs can mention old names only if they clearly say they are legacy.

Restaurant Product Definition

Restaurant mode should represent an operational Restaurant/Food POS workflow.

Expected domain areas:

Menu items
Categories
Tables
Orders
Cashier / checkout
Payments
Kitchen / KDS
Serving
Inventory/recipes if already connected
Tax/service charge/settings if already present
Shift cashier if already present
Audit log if already present
Shared dashboard analytics/reporting if already supported

Do not invent a massive ERP system.
Complete and harden what already exists.

If a feature does not exist yet, do not build it fully unless it is a small guard/state/helper needed to make the current flow coherent.

Part 1: Restaurant Flow Audit

Audit current Restaurant flow end-to-end.

Check:

Entry Flow
User selects Restaurant from /select-mode.
Correct mode ID is stored: restaurant.
User is redirected to correct Restaurant dashboard/workspace.
Refresh keeps valid mode.
Invalid mode redirects safely.
Old fnb value does not become active runtime mode except storage-boundary migration if intentionally documented.
Old warehouse value does not affect Restaurant.
Old service value does not affect Restaurant.
Route Flow
Direct Restaurant route works when selected mode is restaurant.
Direct Restaurant route redirects safely when no mode is selected.
Direct Restaurant route redirects safely when selected mode is retail.
Direct Restaurant route redirects safely when selected mode is raw-material.
Direct Restaurant route redirects safely when selected mode is custom-business.
next param behavior is safe and predictable if used.
No active route should use /dashboard/fnb or features/fnb.
Navigation Flow
Sidebar shows only Restaurant-relevant modules.
Sidebar order matches canonical registry.
Sidebar role permissions match actual access.
No Retail/Raw Material/Custom Business modules leak into Restaurant.
No active FNB/Warehouse/Service labels appear.
Kitchen-only items are not shown to roles that should not see them.
Cashier-only items are not shown to roles that should not see them.
Owner/Manager views remain broad where appropriate.
Data Flow
Menu data loads safely.
Table data loads safely.
Order data loads safely.
Payment data loads safely.
Kitchen/serving queues load safely if present.
Empty states are handled.
API error states are handled.
Malformed API envelope is handled.
Slow loading state is handled if applicable.
Duplicate submit is prevented where there are forms/actions.
Part 2: Restaurant Edge Cases

Add guards, states, and validation for these edge cases where the current app supports the flow:

No menu items.
No categories.
No tables.
No active shift.
No orders.
No payments.
Order with invalid status.
Order transition not allowed.
Payment missing.
Payment failed.
Payment already paid.
Duplicate checkout submit.
Duplicate order submit.
Table already occupied.
Table unavailable/deleted.
Table status mismatch.
Kitchen order already preparing.
Kitchen order already ready.
Serving order already served/completed.
Inventory stock insufficient.
Recipe missing for menu item if recipe system exists.
Menu item unavailable.
Category deleted/unavailable.
Invalid quantity.
Invalid discount/tax if supported.
User role not allowed to perform action.
API returns empty array.
API returns error envelope.
API returns malformed envelope.
User opens Restaurant route with wrong selected mode.
User refreshes after selecting Restaurant.
User manually sets currentBusinessMode to fnb.
User manually sets currentBusinessMode to restaurant.
User manually sets currentBusinessMode to invalid random string.
Planned Custom Business must not reuse Restaurant UI.
Restaurant shared dashboard must not show Retail/Raw Material copy.

Do not create fake UI just to claim edge cases are handled.
Use real guards, empty states, validation, and safe fallbacks.

Part 3: Restaurant Prisma / Database Alignment

Inspect Prisma schema and backend models related to Restaurant.

Check whether Restaurant currently has proper persistence for:

restaurant/business entity
users/roles
menu items
categories
tables
orders
order items
payments
shifts
inventory items
recipes
stock movements
tax/service charge/settings
audit logs
kitchen/serving status
ownership/tenant/business scope

If Prisma models already exist:

verify API/services use them correctly
verify frontend types match backend response
verify request schemas match database constraints
verify nullable fields are handled
verify ownership/tenant filtering exists if applicable
verify role checks match operations

If Prisma models do not exist but Restaurant frontend pretends data is real:

do not add a massive schema blindly
document the mismatch
add Prisma only if necessary to make Restaurant mode coherent and testable
keep schema changes minimal and scoped
explain every Prisma change

Allowed Prisma alignment only if needed:

order status enum correction
payment status enum correction
table status enum correction
missing relation needed by existing Restaurant flow
nullable field correction if current API already depends on it
missing stock movement relation if current Restaurant stock flow depends on it

Rules:

Do not break Retail or Raw Material schema.
Do not rename broad shared models without strong reason.
Do not create destructive migrations.
Do not add nullable chaos just to make things pass.
Do not add schema fields that are not used by current Restaurant flow.
If migration is required, document exact command and risk.
If environment cannot run Prisma generate/migrate, report it honestly.
Part 4: Restaurant Backend/API Hardening

Audit and improve backend/API only for Restaurant-related flow.

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
order status validated
payment method/status validated
table ID validated
menu item ID validated
category ID validated
quantity validated
tax/discount validated if present
shift ID validated if present
Security / Guarding
no invalid mode accepted
no old fnb mode accepted as active API mode
no client mode trusted blindly
ownership/tenant filter exists if architecture has owner/business/restaurant IDs
role permission checks exist where role system applies
cashier/kitchen/server role actions are guarded
unsafe internal errors are not leaked
Service Structure
route handler should not contain too much business logic
repeated mapper logic should be extracted
repeated response/error logic should use shared helper if already available
order transition logic should be centralized
payment update logic should be consistent
table status update logic should be consistent
stock movement writes should be consistent
audit log write should be consistent if used

Do not rewrite all backend.
Only harden Restaurant-related backend/API.

Part 5: Restaurant Shared Dashboard Wiring

Wire Restaurant mode into shared dashboards according to existing shared dashboard context.

Inspect shared dashboards such as:

Sales Analytics
Customers & Partners
Inventory Management
Cashflow
Financial Reports
Invoice Generator
Shift Cashier Reports
Team Management
Employee Performance
Approvals
Audit Log
Platform Monitoring
Any shared dashboard registry/module system

For each shared dashboard, decide Restaurant behavior:

Supported and useful for Restaurant
Supported but with Restaurant-specific labels/data mapping
Not supported and should be hidden/disabled for Restaurant
Planned only and should show clear state

Expected examples:

Sales Analytics

Restaurant should likely be supported.
It should show:

order revenue
menu sales
payment totals
daily sales
average order value
cashier or table context if present
Inventory Management

Restaurant should likely be supported if inventory/recipe system exists.
It should show:

ingredient stock
recipe consumption
stock movement
low stock if available
Cashflow

Restaurant may be supported if payment/sales data exists.
It should show:

cash/card/QRIS revenue
refunds/cancellations if available
shift cashier cash summary if available
Financial Reports

Restaurant may be supported if revenue/cost data exists.
It should not fake profit if cost/HPP data is missing.
If only revenue exists, label it clearly as revenue summary.

Invoice Generator

Restaurant may support receipt/invoice generation if order/payment data exists.
Do not show supplier/procurement invoice copy.

Shift Cashier Reports

Restaurant should likely be supported if shift cashier exists.
It should show:

shift opening cash
expected cash
actual cash if available
cash difference if available
cashier performance if available
Customers & Partners

Restaurant may map to customers/tables/guest activity if customer entity exists.
If no customer entity, hide or show limited context.

Rules:

Do not show Retail/Raw Material dashboard copy in Restaurant.
Do not fake data.
Do not wire unsupported dashboards just to make sidebar full.
Shared dashboard visibility must be mode-aware.
Shared dashboard labels must be context-aware.
Shared dashboard empty states must be context-aware.
Restaurant should only see dashboards that make business sense.

If a shared dashboard needs mode-specific adapter:

create a clean adapter/helper
keep adapter config typed
do not hardcode mode checks everywhere
avoid giant switch statements inside UI components
Part 6: Restaurant Guarding, Limiting, and Permissions

Tighten access control for Restaurant.

Audit:

route guard
sidebar visibility
feature visibility
role permissions
planned/unsupported dashboard visibility
direct URL access
API access if backend has auth/roles

Expected role examples:

OWNER: broad access
MANAGER: broad operational access, maybe limited settings
CASHIER: cashier/order/payment/shift access
KITCHEN: KDS/kitchen order access
SERVER: serving/table/order status access

Rules:

unsupported Restaurant features should not appear as active.
role-limited modules should be hidden or disabled consistently.
direct route access should not bypass UI guard.
backend should still validate mutations.
shared dashboards must check whether Restaurant supports them.
planned features should be clearly marked, not broken.
do not copy Raw Material/Retail permission assumptions into Restaurant.

If role system exists:

define which roles can access Restaurant modules.
align sidebar role permissions with backend role permissions where possible.
if uncertain, use conservative access and document it.
Part 7: Restaurant File Structure Cleanup

Clean Restaurant folder structure.

Preferred structure:

features/restaurant/
  components/
    dashboard/
    menu/
    orders/
    cashier/
    tables/
    kitchen/
    serving/
    payments/
    inventory/
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
no fnb naming in active Restaurant runtime
no placeholder naming if file is active production route
no Retail/Raw Material logic inside Restaurant
no Restaurant-specific logic inside global shared unless truly shared

If any active Restaurant file still uses old FNB naming:

rename it to Restaurant naming
update imports
update docs
run Restaurant typecheck
Part 8: Restaurant Fat File Split

Identify and split Restaurant fat files.

Known possible candidates:

large Restaurant menu files
order workspace files
cashier/checkout files
kitchen/serving files
table management files
dashboard files

Search for other large Restaurant files.

For each fat file:

identify responsibilities
extract constants
extract helper functions
extract child components
extract hooks if stateful logic is reusable
extract schemas/types if useful
update imports
preserve visible behavior
run Restaurant typecheck

Extraction examples:

restaurant-workspace.tsx
restaurant-dashboard-header.tsx
restaurant-metric-cards.tsx
menu-item-table.tsx
menu-category-filter.tsx
menu-item-form.tsx
order-status-badge.tsx
order-status.config.ts
order-transition.helpers.ts
cashier-cart-section.tsx
cashier-payment-summary.tsx
kitchen-order-card.tsx
serving-queue-section.tsx
table-status-grid.tsx
restaurant-empty-state.tsx
restaurant-api.ts
restaurant-routes.config.ts

Do not over-split into tiny useless files.

Part 9: Restaurant Naming Cleanup

Canonical naming:

Mode ID: restaurant
User label: Restaurant
Folder: features/restaurant
Route slug: keep existing canonical route if docs define it, otherwise use consistent V3 route
Type name examples:
RestaurantMode
RestaurantOrder
RestaurantMenuItem
RestaurantTable
RestaurantPayment
RestaurantShift

Avoid:

fnb
FNB
FnB
food as mode name
dining as mode name unless it is specifically table/dining domain
warehouse
service
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
run Restaurant typecheck
Part 10: Restaurant Hardcode and Duplicate Cleanup

Remove Restaurant hardcodes and repeated logic.

Centralize repeated:

Restaurant route paths
Restaurant module IDs
Restaurant dashboard labels
order status labels
order status transitions
table status labels
payment status labels
kitchen/serving queue labels
role labels
tax/service charge labels if repeated
empty state copy if repeated
API endpoints if repeated
table column configs if repeated
card metric configs if repeated
formatter helpers

Do not centralize one-off text.

Avoid scattered checks like:

mode === "restaurant"
path.includes("restaurant")
status === "READY"
paymentStatus === "PAID"
role === "CASHIER"

Prefer typed helpers/configs when repeated:

isRestaurantMode(mode)
RESTAURANT_ROUTES
ORDER_STATUS_CONFIG
getOrderStatusLabel()
getAllowedOrderTransitions()
getTableStatusVariant()
canRestaurantRoleAccessModule()
Part 11: Frontend Polish for Restaurant

Polish Restaurant UI.

Focus:

dashboard clarity
menu item list/table readability
category/filter/search clarity
order list readability
cashier cart and payment summary clarity
table status visibility
kitchen queue clarity
serving queue clarity
payment state clarity
shift state clarity
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
Polish existing UI so Restaurant feels intentional and operational.

Part 12: Tests and Verification

Run Restaurant-specific checks first.

Try pnpm if available:

pnpm --filter @workspace/pos-system run typecheck:restaurant
pnpm restaurant:check
pnpm business-mode:check

If pnpm is blocked by EPERM lstat C:\Users\LENOVO, use local commands:

tsc -p artifacts/pos-system/tsconfig.restaurant.json --noEmit

Also run:

cd artifacts/pos-system
vite build

Run backend check if backend touched:

tsc -p artifacts/api-server/tsconfig.json --noEmit

Run Prisma checks only if Prisma touched:

npx prisma validate
npx prisma generate

If Prisma commands are blocked by environment:

report the exact issue
do not claim they passed

Run business mode switch check:

node scripts/business-mode-switch-check.mjs

Run sidebar parity if Restaurant navigation/sidebar/module registry was touched.

Important:

do not claim full frontend typecheck passed if it times out
separate passed/failed/blocked/timed-out checks
separate pre-existing issues from issues caused by this phase
Part 13: Manual QA Checklist

Provide exact manual QA steps for Restaurant.

Must include:

Mode selection
Open /select-mode.
Select Restaurant.
Confirm selected mode is stored as restaurant.
Confirm app redirects to Restaurant dashboard/workspace.
Refresh and confirm Restaurant stays active.
Invalid mode
Clear currentBusinessMode.
Open Restaurant route directly.
Confirm safe redirect.
Set currentBusinessMode to fnb.
Refresh and confirm it does not become active runtime mode except documented storage-boundary repair if intended.
Set currentBusinessMode to restaurant.
Refresh and confirm it works.
Set random invalid value.
Confirm safe redirect.
Restaurant workspace
Open Restaurant dashboard.
Check menu section.
Check category/filter/search if present.
Check table section.
Check order section.
Check cashier/checkout section if present.
Check payment section if present.
Check kitchen/KDS section if present.
Check serving section if present.
Check empty states.
Check loading/error state if possible.
Try invalid quantity if form exists.
Try duplicate submit if form exists.
Confirm no Retail/Raw Material copy appears.
Confirm no FNB/Warehouse/Service active label appears.
Order flow
Create or inspect an order if supported.
Confirm allowed status transition.
Try invalid status transition if possible.
Confirm payment state.
Confirm kitchen queue state.
Confirm serving queue state.
Confirm completed/cancelled state behavior.
Tables
Open table management.
Check available/occupied/cleaning states.
Try table action if supported.
Confirm table state does not desync from order state.
Shared dashboards
Open each shared dashboard visible in Restaurant.
Confirm dashboard is relevant to Restaurant.
Confirm unsupported dashboards are hidden, disabled, or show not-applicable/planned state.
Confirm copy uses order/menu/table/payment/shift context where appropriate.
Confirm no Retail/Raw Material-only metric appears as Restaurant data.
Part 14: Documentation

Update or create:

docs/v3-phase-5a-restaurant-hardening.md

Include:

Restaurant current scope
supported Restaurant modules
planned/unsupported modules
shared dashboard wiring decisions
Prisma/backend decisions
folder structure changes
helpers/components created
commands run
remaining risks
manual QA checklist

Update existing docs if they become outdated.

Docs must not claim Restaurant supports a dashboard or backend feature that does not exist.

Strict Rules
Work only on Restaurant mode unless shared infrastructure is required.
Do not globally refactor Retail/Raw Material.
Do not change Raw Material Phase 4B persistence decisions.
Do not implement full Custom Business / Service.
Do not reintroduce fnb as active runtime mode.
Do not reintroduce warehouse.
Do not treat service as active mode.
Do not use any, as any, as unknown as, @ts-ignore, or @ts-expect-error.
Do not create fake compatibility bridges.
Do not add Prisma schema unless Restaurant genuinely needs it.
Do not create destructive database migrations.
Do not make shared dashboards show fake Restaurant data.
Do not show unsupported dashboards as active features.
Do not leave FNB naming on active Restaurant runtime files.
Do not leave fat Restaurant files untouched without a clear reason.
Do not create giant utils.ts.
Do not move Restaurant-specific code into global shared unless truly shared.
Do not let shared code import from Restaurant if it should remain generic.
Do not centralize one-off values.
Do not delete useful logic.
Do not silently skip checks.
Do not claim checks passed unless they passed.
Do not push, commit, branch, or PR.
Final Report Format

Return this exact report:

Phase 5A Restaurant Report
1. Summary
2. Docs read
3. Restaurant audit
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
order flow
table flow
payment flow
kitchen/serving flow
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
order/payment/table/kitchen/serving handling
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

This phase is incomplete if the final report does not prove Restaurant-specific inspection across menu, orders, cashier, tables, payments, kitchen/serving, shared dashboards, backend/API, Prisma, and route guards.

Do not return a successful Phase 5A report if Restaurant fat files, FNB leftovers, order/payment/table edge cases, and shared dashboard relevance were only mentioned but not actually inspected.