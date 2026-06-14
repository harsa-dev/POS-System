POS System V3 Phase 2: Global Structure, Flow, Frontend, Backend, and Code Quality Cleanup
Context

Phase 1 V3 canonical cleanup has already been implemented locally.

Known Phase 1 changes:

features/fnb was moved to features/restaurant.
features/orders/constans was renamed to features/orders/constants.
duplicate order-respone.mapper.ts was deleted.
canonical routes were changed from /dashboard/fnb/* to /dashboard/restaurant/*.
central business mode contract was added.
old runtime aliases for fnb, warehouse, and service were removed from normal app flow.
old stored currentBusinessMode values are only repaired at the storage boundary.
backend mode parsing rejects old API mode IDs.
UI labels changed from Restaurant / F&B to Restaurant.
docs were updated, including V3 canonical business mode docs.

This next phase must continue from the current working tree.
Do not push to GitHub.
Do not create a branch.
Do not create a PR.
Work locally only and focus on testing, cleanup, restructuring, and fixing real issues.

Main Goal

Perform a global V3 quality cleanup across the entire repository.

This phase must:

read all docs
inspect all source files
restructure files where needed
split fat files
remove duplicate code
remove dead code
remove hardcoded values
remove repeated logic
create reusable helpers where useful
fix frontend flow bugs
fix backend/API flow bugs
polish frontend UI
polish backend/API quality
fix mode switching flow globally
run available tests/typechecks/build checks
update docs if structure or behavior changes

This is still not a full rewrite.
This is a controlled cleanup pass.

Scope

Scope includes all files in the repository, especially:

artifacts/pos-system
frontend app
backend/API if present
shared configs
business mode logic
docs
scripts
typecheck configs
route configs
feature folders

Business modes in scope:

Restaurant
Retail
Raw Material
Custom Business / Service planned state
Business mode switcher
Shared dashboards and shared components

Do not implement full Service/Custom Business mode.
Only make its planned/guarded state clean and safe.

Important Rule

No GitHub publishing in this phase.

Do not run:

git push
gh pr create
branch creation
PR creation
remote publishing commands

You may use git locally only for:

checking diff
checking status
seeing changed files

Do not commit unless explicitly asked later.

Required First Steps

Before modifying code:

Read all docs in the repo.
Read the new V3 canonical business mode docs.
Inspect the current project tree.
Inspect package scripts.
Inspect TypeScript configs.
Inspect frontend routes.
Inspect backend/API routes.
Inspect business mode config and guard logic.
Search for duplicate/hardcoded/repeated logic.
Identify fat files and risky files.

Search terms:

restaurant
retail
raw-material
custom-business
service
businessMode
currentBusinessMode
dashboard
mode
route
guard
api
TODO
FIXME
hardcoded
mock
demo
legacy
fnb
warehouse
constans
respon
response
mapper

If fnb, warehouse, service, or other old names still exist:

check whether they are intentional docs/history references
check whether they are old runtime leftovers
remove or fix runtime leftovers
keep only truly necessary migration-boundary references
Global File Restructure Requirements

Audit the full file structure.

Restructure files only when it improves readability, maintainability, or domain separation.

Target structure style:

src/
  app/
  components/
    core/
    shared/
  config/
    business-modes/
    routes/
    navigation/
    status/
  features/
    restaurant/
      components/
      hooks/
      services/
      schemas/
      types/
      utils/
      constants/
    retail/
      components/
      hooks/
      services/
      schemas/
      types/
      utils/
      constants/
    raw-material/
      components/
      hooks/
      services/
      schemas/
      types/
      utils/
      constants/
    shared/
      components/
      hooks/
      services/
      schemas/
      types/
      utils/
      constants/
  lib/
    api/
    auth/
    business-mode/
    db/
    errors/
    formatters/
    validators/
  types/
  schemas/

Adapt to the existing repo if it already has a consistent pattern.

Rules:

mode-specific code must stay inside its mode folder
shared code must not import from mode-specific folders
Restaurant code must not leak into Retail or Raw Material
Retail code must not leak into Restaurant or Raw Material
Raw Material code must not leak into Restaurant or Retail
business mode switcher logic must be centralized
route config must be centralized if routes are repeated
status config must be centralized if statuses are repeated
API response helpers should be centralized if repeated
validation helpers should be centralized if repeated

Do not create empty folders.
Do not create fake architecture.
Do not split small clear files just for aesthetics.

Fat File Cleanup

Find files that are too large, doing too many jobs, or hard to understand.

A file should be considered suspicious if:

it mixes UI, data fetching, business rules, constants, and formatting
it has multiple unrelated components
it has large inline arrays/configs
it repeats status/route/mode checks
it contains long conditional chains
it contains repeated JSX blocks
it contains repeated fetch logic
it contains duplicated form logic
it is difficult to test or reason about

For each fat file:

extract constants
extract helper functions
extract hooks
extract child components
extract schemas/types if needed
keep the public behavior unchanged

Preferred extraction examples:

formatCurrency, formatDate, formatPercent
getStatusLabel, getStatusVariant, getStatusColor
getModeDashboardRoute
isSupportedBusinessMode
getBusinessModeLabel
useBusinessMode
useModeNavigation
useDashboardMetrics
reusable table empty state component
reusable loading/error state component
reusable API error parser
reusable response formatter

Do not over-abstract one-off logic.

Duplicate Code Cleanup

Search globally for duplicate code.

Check duplicates in:

page components
dashboard cards
table components
status badges
forms
modals
fetch logic
API response handling
validation schemas
route constants
mode constants
mapper functions
currency/date formatters
error handlers
empty/loading/error UI
sidebar/navigation config
permission checks

Fix duplicates by creating:

shared components
shared hooks
shared helpers
shared constants
mode-specific helpers
API utilities
typed config maps

Rules:

shared helpers must be truly shared
mode-specific helpers should stay inside the relevant mode
do not create giant global utility files full of unrelated functions
avoid utils.ts dumping grounds
use specific file names

Bad:

utils.ts
helper.ts
data.ts
misc.ts

Better:

format-currency.ts
order-status.config.ts
business-mode-routes.ts
parse-api-error.ts
restaurant-dashboard-metrics.ts
retail-inventory-status.ts
Hardcode Cleanup

Remove hardcoded values that can create drift.

Centralize repeated:

business mode IDs
business mode labels
route paths
sidebar items
nav groups
API paths
order statuses
inventory statuses
payment statuses
badge variants
role labels
currency formatting
date formatting
empty state copy
dashboard metric definitions
table column definitions if repeated
localStorage keys
error messages if repeated
query keys if used

Do not centralize one-off text unnecessarily.

Especially check:

direct string comparisons like mode === "restaurant"
direct path strings like /dashboard/restaurant
direct status strings inside components
repeated badge color logic
repeated currency formatter calls
repeated localStorage key usage
Frontend Flow Audit

Check and fix frontend behavior globally.

Audit:

/select-mode
dashboard route access
mode-specific navigation
mode switching from inside a mode route
empty currentBusinessMode
invalid currentBusinessMode
old stored values
planned Custom Business/Service state
refresh behavior
direct URL access
sidebar active state
topbar labels
breadcrumbs if present
mobile/responsive layout if obvious
loading states
error states
empty states
disabled states
duplicate submit prevention
form validation messages
table overflow
long text truncation
inconsistent badges
inconsistent buttons
inconsistent spacing

Required outcomes:

no invalid mode should silently render wrong UI
no mode should show another mode’s navigation/data
planned mode must not look production-ready
invalid route should redirect or show safe state
mode switcher must not rely on scattered logic
refresh should preserve valid selected mode
invalid stored mode should be repaired or cleared safely
Backend/API Flow Audit

Check backend/API behavior globally.

Audit:

mode parsing
request validation
route param validation
response shape consistency
error handling consistency
status codes
duplicated try/catch
repeated response helpers
unsafe trust of client mode
tenant/ownership filtering if business/user IDs exist
role checks if present
missing null checks
duplicate mapper logic
inconsistent DTOs
overly fat service files
old V2 naming leftovers
API endpoints no longer used by frontend
frontend calls to endpoints that do not exist

Required outcomes:

backend should reject invalid mode IDs
API should not accept old mode aliases as normal flow
response shapes should be predictable
errors should be safe for client
no stack traces/internal DB messages should be returned directly
duplicated mapper/service logic should be reduced
backend services should not be giant mixed files if avoidable

Do not rewrite the backend architecture from scratch.
Fix obvious issues and split files where useful.

Code Quality Rules

Do not use:

any
as any
as unknown as
@ts-ignore
@ts-expect-error

Do not add:

fake aliases
compatibility bridges except storage migration boundary
unnecessary dependencies
placeholder features
empty files
giant catch-all helpers
broad database schema rewrites
full Service/Custom Business implementation

Prefer:

typed configs
explicit unions
schema validation
small helper functions
small reusable components
clear folder boundaries
clear file names
predictable API contracts
domain-specific helpers
Naming Rules

Use clear and consistent names.

Canonical names:

restaurant
retail
raw-material
custom-business

Avoid:

fnb
warehouse
service as active mode
constans
respon
vague names like data, helper, misc, temp, final, old

If old names remain only in docs/history:

make it clear they are legacy references
do not keep them in active runtime paths
UI Polish Rules

Polish frontend where needed.

Focus on:

readable dashboards
consistent cards
consistent buttons
consistent badge styles
reusable loading state
reusable error state
reusable empty state
good mode switcher UX
clear planned-mode messaging
responsive fixes
table readability
form clarity

Do not redesign the whole app.
Do not change the visual identity radically.
Polish existing UI.

Testing and Verification

Run checks after cleanup.

Try these commands if available:

pnpm --filter @workspace/pos-system run typecheck:restaurant
pnpm --filter @workspace/pos-system run typecheck:retail
pnpm --filter @workspace/pos-system run typecheck:raw-material
pnpm --filter @workspace/pos-system run typecheck:service

If pnpm is blocked by environment, use repo-local equivalents that already worked:

tsc -p artifacts/pos-system/tsconfig.restaurant.json --noEmit
tsc -p artifacts/pos-system/tsconfig.retail.json --noEmit
tsc -p artifacts/pos-system/tsconfig.raw-material.json --noEmit
tsc -p artifacts/pos-system/tsconfig.service.json --noEmit

Run frontend build:

cd artifacts/pos-system
vite build

Run additional scripts only if they exist and environment allows:

pnpm business-mode:check
pnpm restaurant:check
pnpm retail:check
pnpm raw-material:check
pnpm typecheck
pnpm build

For backend:

run backend typecheck if available
if backend still has existing broader errors, report them clearly
separate existing pre-existing errors from errors caused by this cleanup
fix touched-area backend errors
do not pretend backend passed if it did not
Manual QA Checklist

Even if browser automation is unavailable, provide a manual QA checklist.

Checklist must include:

Open /select-mode.
Select Restaurant.
Confirm Restaurant dashboard loads.
Refresh Restaurant dashboard.
Access Restaurant route directly.
Confirm sidebar/nav only shows valid Restaurant items.
Select Retail.
Confirm Retail dashboard loads.
Refresh Retail dashboard.
Access Retail route directly.
Confirm sidebar/nav only shows valid Retail items.
Select Raw Material.
Confirm Raw Material dashboard loads.
Refresh Raw Material dashboard.
Access Raw Material route directly.
Confirm sidebar/nav only shows valid Raw Material items.
Set currentBusinessMode to an invalid value.
Refresh app and confirm it safely clears/repairs/redirects.
Clear currentBusinessMode.
Refresh app and confirm it routes to /select-mode.
Try planned Custom Business/Service state.
Confirm it is guarded or shown as planned, not production-ready.
Confirm there is no visible FNB label.
Confirm no active route uses /dashboard/fnb.
Confirm no page shows another mode’s data or navigation.
Documentation Update

Update docs if any of these changed:

folder structure
route structure
business mode behavior
mode contract
helper locations
frontend flow
backend flow
commands used
known limitations

Docs must not lie.

Docs should include:

final supported modes
planned Custom Business/Service status
final folder structure
key shared helpers
route/mode behavior
checks actually run
known remaining risks
Final Report Format

At the end, produce a clear report:

1. Summary

Short explanation of the cleanup.

2. Docs read

List docs inspected.

3. Commands run

Include pass/fail status.

4. Structure changes

For each moved/renamed file:

old path
new path
reason
5. Fat files split

For each:

original file
extracted files
reason
6. Helpers/components created

For each:

file path
purpose
where used
7. Duplicate code removed

Explain what duplicate logic was removed.

8. Hardcoded values removed

Explain what was centralized.

9. Frontend flow fixes

Group by:

business mode switcher
Restaurant
Retail
Raw Material
Custom Business planned state
shared UI
10. Backend/API fixes

Group by:

mode parsing
validation
response/error handling
services/mappers
security checks
11. Files deleted

For each:

file path
reason it was safe to delete
12. Remaining risks

Be honest.

13. Manual QA checklist

Give exact browser steps.

14. Next recommended task

Give only one next task.

Strict Rules
Do not push to GitHub.
Do not create a PR.
Do not create a branch unless explicitly asked.
Do not commit unless explicitly asked.
Do not implement full Service/Custom Business mode.
Do not reintroduce fnb as active runtime naming.
Do not create fake compatibility maps to hide wrong naming.
Do not loosen types to make errors disappear.
Do not use any, cast hacks, or ignore comments.
Do not create giant shared utility dumping grounds.
Do not move mode-specific logic into shared code.
Do not let shared code import from mode-specific folders.
Do not leave fat files untouched if they clearly mix unrelated responsibilities.
Do not leave duplicate code if it is obviously reusable.
Do not remove files unless confirmed unused.
Do not delete useful logic. Move it first.
Do not rewrite the entire app.
Do not change database schema unless absolutely required.
Do not silently skip checks.
Do not claim checks passed unless they actually passed.

Start by reading all docs, inspecting the whole repository, then make a cleanup plan before editing. After that, implement the cleanup in safe batches and run verification.