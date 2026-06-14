POS System V3 Phase 3: Per-Business-Mode Deep Cleanup, Flow Hardening, and Structure Refactor
Context

Phase 1 and Phase 2 cleanup have already been implemented locally.

Known completed work:

features/fnb was migrated to features/restaurant.
features/orders/constans was renamed to features/orders/constants.
duplicate order-respone.mapper.ts was deleted.
canonical routes were changed from /dashboard/fnb/* to /dashboard/restaurant/*.
central business mode contract was added.
runtime aliases for fnb, warehouse, and service were removed from normal app flow.
old stored currentBusinessMode values are only repaired at the storage boundary.
backend mode parsing rejects old API mode IDs.
UI labels changed from Restaurant / F&B to Restaurant.
duplicated frontend API envelope parsing was centralized in read-api-envelope.ts.
order/table/menu/invoice/payment API clients now use the shared parser.
backend TypeScript passed after fixing upload, audit log ownership, inventory/order stock movement writes, route param narrowing, and restaurant role checks.
frontend scoped TypeScript passed for Restaurant, Retail, Raw Material, and Service.
frontend production build passed with existing sourcemap warnings.
Phase 2 docs were added.

This Phase 3 task must go deeper per business mode.

Do not push to GitHub.
Do not create a branch.
Do not create a PR.
Do not commit unless explicitly asked.
Work locally only.

Main Goal

Perform a per-business-mode deep cleanup and hardening pass.

This phase must not only clean Restaurant.
You must inspect, test, and improve each mode independently:

Restaurant
Retail
Raw Material
Custom Business / Service planned state
Business mode switcher and shared mode infrastructure

For each mode:

inspect all related files
check full frontend flow
check backend/API flow if connected
check route guards
check mode-specific data boundaries
check UI states
check edge cases
remove duplicate code
remove hardcoded values
split fat files
create reusable helpers where useful
fix bugs
polish frontend
polish backend/API
update docs if behavior or structure changes

This is a controlled cleanup and hardening pass, not a full rewrite.

Non-Negotiable Rule

Do not only work on Restaurant.

You must produce a report for each mode:

Restaurant audit result
Retail audit result
Raw Material audit result
Custom Business / Service planned-state audit result
Shared business-mode infrastructure audit result

If one mode has fewer files or fewer issues, say that clearly.
Do not skip it silently.

Required First Steps

Before editing code:

Read all docs.
Read V3 canonical business mode docs.
Read Phase 2 quality cleanup docs.
Inspect full repository structure.
Inspect package scripts.
Inspect all feature folders.
Inspect all frontend routes.
Inspect all backend/API routes.
Inspect all business mode configs.
Inspect all route guards and mode guards.
Inspect all shared helpers/components.
Create a mode-by-mode audit plan before editing.

Search globally for:

restaurant
retail
raw-material
rawMaterial
custom-business
service
businessMode
currentBusinessMode
mode
dashboard
guard
route
api
status
inventory
order
payment
invoice
cashier
table
menu
material
stock
supplier
customer
TODO
FIXME
mock
demo
legacy
fnb
warehouse
any
@ts-ignore
as any
as unknown as
Canonical Mode Contract

The app must keep these canonical mode IDs:

restaurant
retail
raw-material
custom-business

Rules:

restaurant, retail, and raw-material are active modes.
custom-business is planned or guarded only.
Do not implement full Custom Business / Service mode in this phase.
Do not reintroduce fnb, warehouse, or service as active runtime mode IDs.
If old values are handled, they must only be handled at the storage migration boundary.
Do not create compatibility bridges across normal app flow.
PART 1: Business Mode Switcher Deep Audit

Audit and harden the mode switcher globally.

Check:

/select-mode
selected mode persistence
localStorage key usage
invalid stored mode
empty stored mode
old stored value migration
refresh behavior
direct dashboard access
switching mode while inside a mode-specific route
route redirect after mode selection
next query param if used
planned mode behavior
sidebar/topbar mode label
route guard behavior
mode-specific navigation

Required fixes:

centralize localStorage key if repeated
centralize mode route resolution if repeated
centralize mode label resolution if repeated
prevent invalid mode from rendering wrong dashboard
prevent mode leakage between modes
make planned mode safe and clear
make redirect behavior predictable

Edge cases to handle:

User opens /dashboard without selected mode.
User opens /dashboard/restaurant without selected mode.
User opens /dashboard/retail without selected mode.
User opens /dashboard/raw-material without selected mode.
User has invalid currentBusinessMode.
User has old currentBusinessMode value like fnb, warehouse, or service.
User selects Restaurant then directly opens Retail route.
User selects Retail then directly opens Raw Material route.
User selects Raw Material then directly opens Restaurant route.
User selects planned Custom Business mode.
User refreshes each dashboard route.
User uses browser back after switching modes.
PART 2: Restaurant Mode Deep Audit

Inspect all Restaurant-related files.

Possible areas:

dashboard
menu/products
orders
cashier
tables
kitchen/KDS if present
serving if present
payments
invoices
inventory integration
analytics/shared dashboard usage
API clients
schemas/types
constants/helpers
route guards
sidebar/nav

Check frontend flow:

loading state
empty state
error state
form validation
duplicate submit prevention
status badge consistency
table readability
mobile/responsive issues
broken buttons/actions
stale labels
wrong route links
wrong mode leakage
hardcoded statuses
hardcoded routes
repeated formatters
repeated API parsing

Check backend/API flow:

order status transitions
table status transitions
payment status handling
inventory stock movement writes
menu item handling
restaurant ownership/role checks
invalid route params
invalid request body
safe error responses
duplicate mapper/service logic

Restaurant edge cases:

No orders.
No tables.
No menu items.
No payments.
Order with invalid status.
Payment missing or failed.
Table already occupied.
Table deleted/unavailable.
Inventory stock insufficient.
Kitchen order already marked ready.
Serving order already completed.
Duplicate order submit.
User role not allowed to perform action.
API returns empty array.
API returns malformed or failed envelope.

Required cleanup:

split fat Restaurant files
move Restaurant-specific helpers into features/restaurant
move truly shared helpers into shared/lib/config
remove duplicated status/route/mode checks
improve UI consistency
improve API response handling
avoid Restaurant assumptions in shared components
PART 3: Retail Mode Deep Audit

Inspect all Retail-related files.

Possible areas:

retail dashboard
retail products
retail inventory
retail transactions/orders
customer/sales flow
payment flow
invoices/receipts
analytics/shared dashboard usage
API clients
schemas/types
constants/helpers
route guards
sidebar/nav

Check frontend flow:

loading state
empty state
error state
validation
duplicate submit prevention
product list state
stock state
checkout/sales flow if present
status badges
price/currency formatting
table layout
mobile/responsive issues
broken actions
wrong route links
hardcoded values
repeated logic

Check backend/API flow:

product create/update/delete if present
stock mutation if present
sales/order transaction if present
payment update if present
inventory movement if present
route param validation
body validation
ownership/tenant guard
safe error response
response envelope consistency

Retail edge cases:

No products.
Product out of stock.
Product deleted while selected.
Invalid quantity.
Duplicate checkout submit.
Payment failed/missing.
Invalid discount/tax if present.
Empty cart.
API returns empty array.
API returns failed envelope.
User opens Retail route while selected mode is Restaurant.
User opens Retail route while selected mode is Raw Material.

Required cleanup:

split fat Retail files
centralize retail status/stock helpers
centralize repeated product/table/card configs
remove Restaurant assumptions from Retail
remove raw-material assumptions from Retail
polish Retail dashboard and UX
harden Retail route access and API flow
PART 4: Raw Material Mode Deep Audit

Inspect all Raw Material-related files.

Possible areas:

raw material dashboard
materials
suppliers
stock
procurement/purchasing if present
inventory movement
material usage
alerts/low stock
analytics/shared dashboard usage
API clients
schemas/types
constants/helpers
route guards
sidebar/nav

Check frontend flow:

loading state
empty state
error state
validation
duplicate submit prevention
stock movement display
low-stock states
supplier states
unit formatting
table readability
mobile/responsive issues
broken actions
wrong route links
repeated hardcoded unit/status strings
repeated API handling

Check backend/API flow:

material create/update/delete if present
supplier relation if present
stock movement writes
inventory correction
unit validation
route param validation
request body validation
ownership/tenant guard
safe error response
response envelope consistency

Raw Material edge cases:

No materials.
No suppliers.
Material out of stock.
Material below minimum stock.
Invalid stock movement quantity.
Invalid unit.
Supplier deleted/unavailable.
Duplicate stock update submit.
API returns empty array.
API returns failed envelope.
User opens Raw Material route while selected mode is Restaurant.
User opens Raw Material route while selected mode is Retail.

Required cleanup:

split fat Raw Material files
centralize raw-material unit/status helpers
centralize stock movement helpers
remove Restaurant/Retail assumptions
polish Raw Material dashboard and UX
harden Raw Material route access and API flow
PART 5: Custom Business / Service Planned-State Audit

Do not fully implement Custom Business / Service.

Audit only:

mode option display
planned state messaging
route guard behavior
docs wording
type contract
mode config
route config
disabled/coming soon UI if applicable

Required behavior:

It must not look production-ready.
It must not show broken pages.
It must not accidentally reuse Restaurant/Retail/Raw Material data.
It must not use old service mode ID as active runtime mode.
If selectable, it should show a clear planned/coming-soon state.
If not selectable, docs should say it is planned.

Edge cases:

User manually sets currentBusinessMode to custom-business.
User manually opens Custom Business route if it exists.
User manually sets currentBusinessMode to service.
User tries to access planned feature through navigation.
PART 6: Shared Code and Architecture Cleanup

Audit shared folders.

Check:

components/shared
features/shared
lib
config
types
schemas
API clients
route configs
navigation configs
status configs
formatter helpers
error helpers

Rules:

shared code must be genuinely shared
shared code must not import from features/restaurant, features/retail, or features/raw-material
mode-specific code must not be forced into shared
avoid giant global utility files
avoid duplicated helpers across modes
keep helpers domain-specific and clearly named

Look for:

duplicate API parsing
duplicate loading/error/empty UI
duplicate status badge logic
duplicate currency/date formatters
duplicate mode route logic
duplicate navigation logic
duplicate table/card components
duplicate validation logic
duplicate mapper logic

Create helpers/components only when they reduce real duplication.

PART 7: Fat File and Structure Refactor

Find fat files across all modes and shared/backend.

A file is considered fat if:

it mixes UI + fetch + business logic + constants + formatting
it contains multiple unrelated components
it has long repeated JSX
it has long if/else or switch chains
it has duplicated inline arrays/configs
it is hard to reason about
it is used as a dumping ground

For each fat file:

identify responsibility groups
extract constants
extract helpers
extract hooks
extract child components
extract schemas/types if useful
keep behavior unchanged
update imports
run typecheck

Preferred structure per feature:

features/{mode}/
  components/
  hooks/
  services/
  schemas/
  types/
  utils/
  constants/
  config/

Only create folders that are actually used.

PART 8: Hardcoded Value Cleanup

Remove repeated hardcoded values.

Centralize:

route paths
business mode IDs
localStorage keys
status labels
status badge variants
status colors
role labels
API endpoints if repeated
currency formatter
date formatter
unit formatter
empty state copy if repeated
dashboard metric configs
table column configs if repeated
stock thresholds if repeated
planned mode copy if repeated

Do not centralize one-off local UI text.

Bad:

if (mode === "restaurant") { ... }
navigate("/dashboard/restaurant")
localStorage.getItem("currentBusinessMode")

Better:

isBusinessMode(mode, BUSINESS_MODE_IDS.restaurant)
getBusinessModeDashboardRoute(mode)
BUSINESS_MODE_STORAGE_KEY

But do not create helper noise for a value used only once.

PART 9: Bug Hunting

Search for and fix bugs.

Bug categories:

route guard bug
selected mode mismatch
wrong mode data showing
stale route
broken import
wrong API endpoint
wrong response handling
missing null check
missing empty state
duplicate submit
invalid form accepted
wrong status transition
wrong stock movement sign
unsafe ownership access
role check missing
table/action button enabled incorrectly
planned mode accidentally active
old fnb or warehouse runtime path
service treated as active mode
dead component still referenced
API client not using shared envelope parser
UI expecting data shape that API does not guarantee

Do not invent massive new features.
Fix real bugs.

PART 10: Backend/API Polish

Audit backend files per domain.

Focus on:

validation
typed request params
safe response format
safe error handling
ownership/tenant checks
role checks
mode parsing
duplicate service logic
duplicate mapper logic
stock movement logic
audit log writes
inventory updates
order/payment updates
upload handling

Required:

no backend route should trust invalid mode values
no internal DB/stack error should leak directly
repeated response/error logic should become helper if duplicated
mode parsing must use canonical V3 mode contract
backend services should not be giant mixed-responsibility files when avoidable

If backend file is too broad, split carefully:

route handler
service
mapper
validator
constants/types

Do not change database schema unless absolutely required.

PART 11: Frontend Polish

Polish frontend per mode.

Focus:

consistent dashboard cards
consistent empty states
consistent loading states
consistent error states
consistent buttons
consistent badges
clear form validation
table readability
responsive layout
mode switcher clarity
sidebar active states
planned mode messaging
no stale FNB labels
no old route labels
no mode leakage

Do not redesign the whole product.
Polish what exists.

PART 12: Verification

Run checks after changes.

Try pnpm scripts first if environment allows:

pnpm --filter @workspace/pos-system run typecheck:restaurant
pnpm --filter @workspace/pos-system run typecheck:retail
pnpm --filter @workspace/pos-system run typecheck:raw-material
pnpm --filter @workspace/pos-system run typecheck:service
pnpm --filter @workspace/pos-system run build
pnpm business-mode:check
pnpm restaurant:check
pnpm retail:check
pnpm raw-material:check

If pnpm is still blocked by local permission error, use the repo-local TypeScript commands that already worked:

tsc -p artifacts/pos-system/tsconfig.restaurant.json --noEmit
tsc -p artifacts/pos-system/tsconfig.retail.json --noEmit
tsc -p artifacts/pos-system/tsconfig.raw-material.json --noEmit
tsc -p artifacts/pos-system/tsconfig.service.json --noEmit

Run frontend build:

cd artifacts/pos-system
vite build

Run backend TypeScript check if available.

Important:

Do not claim full frontend tsc -p artifacts/pos-system/tsconfig.json --noEmit passed if it times out.
If it times out, report timeout honestly.
Separate:
checks passed
checks failed because of environment
checks failed because of existing issues
checks failed because of your changes
PART 13: Manual QA Checklist

Provide exact manual browser QA steps:

Business mode switcher
Open /select-mode.
Clear currentBusinessMode.
Refresh and confirm /select-mode is shown.
Set invalid currentBusinessMode.
Refresh and confirm safe redirect/repair.
Set old fnb.
Refresh and confirm storage-boundary repair only if migration is intended.
Set old warehouse.
Refresh and confirm storage-boundary repair only if migration is intended.
Set old service.
Refresh and confirm it does not become active Service mode.
Restaurant
Select Restaurant.
Open Restaurant dashboard.
Refresh.
Open direct Restaurant route.
Check menu/products.
Check orders.
Check tables.
Check payments/invoices.
Check empty states.
Check loading/error states if possible.
Confirm no FNB label.
Confirm no Retail/Raw Material nav leakage.
Retail
Select Retail.
Open Retail dashboard.
Refresh.
Open direct Retail route.
Check product/inventory/sales flow if present.
Check empty states.
Check loading/error states if possible.
Confirm no Restaurant/Raw Material nav leakage.
Raw Material
Select Raw Material.
Open Raw Material dashboard.
Refresh.
Open direct Raw Material route.
Check material/supplier/stock flow if present.
Check empty states.
Check loading/error states if possible.
Confirm no Restaurant/Retail nav leakage.
Custom Business / Service planned
Try selecting planned mode if visible.
Confirm it is coming soon/guarded.
Try direct route if route exists.
Confirm it does not show broken production UI.
PART 14: Documentation

Update docs if anything changes.

Docs must include:

final per-mode structure
active modes
planned mode behavior
route guard behavior
mode switcher behavior
important helpers/components added
checks run
limitations
manual QA checklist
remaining known risks

Do not leave docs outdated.

Strict Rules
Do not push to GitHub.
Do not create a branch.
Do not create a PR.
Do not commit unless explicitly asked.
Do not focus only on Restaurant.
Do not skip Retail.
Do not skip Raw Material.
Do not fully implement Custom Business / Service.
Do not reintroduce FNB as active runtime naming.
Do not reintroduce Warehouse as active runtime naming.
Do not treat Service as an active mode ID.
Do not create fake compatibility bridges.
Do not loosen types to pass checks.
Do not use any, as any, as unknown as, @ts-ignore, or @ts-expect-error.
Do not create giant utils.ts dumping grounds.
Do not move mode-specific logic into shared code.
Do not let shared code import from mode folders.
Do not leave fat files untouched if they clearly mix unrelated responsibilities.
Do not leave obvious duplicate code.
Do not centralize one-off values just to look clever.
Do not delete files unless confirmed unused.
Do not delete useful logic. Move it first.
Do not rewrite the whole app.
Do not change database schema unless absolutely required.
Do not silently skip failed checks.
Do not claim checks passed unless they actually passed.
Do not leave docs inconsistent with code.
Do not leave broken routes/navigation.
Do not leave planned mode looking production-ready.
Do not stop after the first mode.
Final Report Format

At the end, report in this exact structure:

Phase 3 Report
1. Summary

What was cleaned and hardened.

2. Docs read

List docs inspected.

3. Commands run

For each command:

command
passed/failed/blocked/timed out
notes
4. Restaurant audit and changes
files inspected
bugs found
flow fixes
UI polish
backend/API fixes
files split
helpers created
remaining risks
5. Retail audit and changes
files inspected
bugs found
flow fixes
UI polish
backend/API fixes
files split
helpers created
remaining risks
6. Raw Material audit and changes
files inspected
bugs found
flow fixes
UI polish
backend/API fixes
files split
helpers created
remaining risks
7. Custom Business / Service planned-state audit
behavior checked
fixes made
remaining risks
8. Business mode switcher audit
edge cases checked
guard fixes
route fixes
storage fixes
remaining risks
9. Shared architecture cleanup
shared files inspected
helpers/components created
duplicate code removed
hardcoded values centralized
remaining risks
10. Structure changes

For each moved/renamed file:

old path
new path
reason
11. Fat files split

For each:

original file
extracted files
reason
12. Files deleted

For each:

path
why safe to delete
13. Backend/API changes
validation
response handling
mode parsing
services/mappers
security/ownership
remaining risks
14. Frontend/UI changes
loading states
empty states
error states
mode UI
dashboard polish
remaining risks
15. Hardcoded/duplicate cleanup
what was removed
what was centralized
why
16. Manual QA checklist

Give exact browser steps.

17. Remaining risks

Be honest and specific.

18. Next recommended task

Give only one next task.