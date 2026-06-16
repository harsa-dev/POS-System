POS System V3 Phase 6B: API Contract Integrity, Shared Dashboard Architecture, Business Mode Generalization, Prisma Schema Alignment, and Anti-Spaghetti Cleanup
Context

Do not return a success report if the work only makes typecheck/build pass. This phase is about correctness of contracts, schema, permissions, shared dashboard architecture, and business-mode relationships. Green checks are required, but green checks alone are not enough.

If a bridge exists only because the naming, API contract, or dashboard support contract is wrong, delete the bridge and fix the source contract. Do not decorate bad architecture with helper functions.

Phase 1 through Phase 6A have already been implemented locally.

Current business modes:

restaurant: active
retail: active
raw-material: active
custom-business: planned / guarded only

Recent state:

Backend TypeScript passed after fixing real errors in shared dashboard/customer/inventory/invoice files.
Frontend scoped TypeScript passed for Restaurant, Retail, Raw Material, and Service.
Frontend production build passed.
pnpm workspace commands are still blocked by local environment permission: EPERM: operation not permitted, lstat 'C:\Users\LENOVO'.
Some shared dashboard, permission, auth, mode, and registry logic has changed a lot.
There may still be API contract drift, hardcoded logic, duplicate code, hidden bridge spaghetti, Prisma schema mismatch, and mode-to-mode relationship bugs.

This Phase 6B task is a strict architecture integrity pass.

Do not create a branch.
Do not commit.
Do not push.
Do not open PR.
Work locally only.

Main Goal

Make the codebase structurally honest.

This phase must find and fix:

API contract drift.
Hardcoded mode/dashboard/permission/API/status values.
Repeated code.
Spaghetti bridge/adapters that hide bad architecture.
Shared dashboard to business-mode relationship bugs.
Business-mode to business-mode relationship bugs.
Auth/permission/role drift.
Prisma schema/client/API mismatch.
TypeScript errors that were hidden, avoided, or worked around.
Duplicate features/files.
Fake compatibility bridges.
Over-specialized shared code.
Mode-specific logic leaking into shared code.
Shared code importing mode internals incorrectly.
Runtime routes or dashboards that contradict the canonical business mode contract.

This phase is not done until the structure is actually clean, not merely green.

Non-Negotiable Principles
Do not hide red code.
Do not silence TypeScript.
Do not use fake bridges just to pass checks.
Do not create alias maps that normalize bad architecture.
Do not keep spaghetti bridge chains.
Do not let shared dashboard code depend on random mode-specific assumptions.
Do not let mode-specific code leak into shared unless it is an intentional typed adapter boundary.
Do not leave API response contracts implicit.
Do not leave frontend and backend DTOs drifting.
Do not make Prisma schema changes blindly.
Do not create destructive migrations.
Do not claim checks passed unless they actually passed.

Forbidden unless there is absolutely no alternative and documented clearly:

any
as any
as unknown as
@ts-ignore
@ts-expect-error

Also forbidden:

const legacyModeMap = {
  fnb: "restaurant",
  warehouse: "raw-material",
  service: "custom-business",
};

Old mode handling may exist only at the single documented storage migration boundary.

Canonical Business Mode Contract

Canonical mode IDs:

restaurant
retail
raw-material
custom-business

Rules:

restaurant, retail, and raw-material are active.
custom-business is planned/guarded only.
fnb, warehouse, and service are not active runtime mode IDs.
No API should accept old IDs as active mode IDs.
No shared dashboard should treat old IDs as normal modes.
No route should depend on old IDs.
No permission config should include old IDs as active modes.
No frontend state should silently normalize old IDs except the documented storage-boundary repair.
Part 1: Full Documentation and Source Audit

Before editing:

Read all V3 docs.
Read Phase 4A, 4B, 5A, 5B, and 6A docs.
Inspect all business mode contracts/configs.
Inspect all API clients.
Inspect all backend DTOs/mappers/services/routes.
Inspect Prisma schema.
Inspect shared dashboard shell/bridge/adapter files.
Inspect auth/session/permission files.
Inspect route guards.
Inspect sidebar/module registry.
Inspect shared helpers.
Inspect all mode-specific shared-dashboard integrations.

Search globally for:

restaurant
retail
raw-material
custom-business
fnb
FNB
FnB
warehouse
service
businessMode
currentBusinessMode
dashboard
shared dashboard
bridge
adapter
contract
DTO
dto
mapper
schema
zod
api
client
response
envelope
permission
role
auth
session
guard
route
sidebar
registry
module
hardcoded
mock
sample
placeholder
preview
legacy
TODO
FIXME
any
as any
as unknown as
@ts-ignore
@ts-expect-error

Do not edit before you understand the current architecture.

Part 2: API Contract Audit

Audit every frontend API client and matching backend endpoint.

Scope includes:

Restaurant API clients and backend routes.
Retail API clients and backend routes.
Raw Material API clients and backend routes.
Shared dashboard API clients and backend routes.
Auth/session/user endpoints.
Permission/role-related endpoints.
Invoice/payment/order/inventory/customer/shared surfaces if used by dashboards.

For each API pair, check:

Frontend Client
endpoint path
HTTP method
request payload type
response type
error handling
envelope parsing
null/empty behavior
mode ID usage
auth/session dependency
Backend Endpoint
route path
route params
request body schema
response DTO
response envelope
status codes
permission guard
business mode guard
ownership/tenant filtering
error handling
mapper output
Contract Drift Checks
frontend expects field backend does not return
backend returns field frontend ignores but should use
frontend sends field backend rejects
backend accepts unsafe fields frontend should not send
response envelope mismatch
nullable mismatch
enum mismatch
status mismatch
mode ID mismatch
DTO name does not match behavior
mapper output does not match client type
API path hardcoded in multiple places

Required fixes:

create/align typed API contracts where useful
centralize repeated response envelope parsing
align frontend types with backend DTOs
align backend DTOs with real Prisma data
remove duplicate mappers
remove fake client-side fallbacks pretending to be real
ensure error responses are safe and predictable

Do not loosen types just to pass.

Part 3: Shared Dashboard Architecture Audit

The shared dashboard relationship with business modes must be clean.

Audit:

dashboard shell
dashboard registry
shared dashboard adapters
Restaurant bridge
Retail bridge if present
Raw Material bridge
Custom Business planned behavior
dashboard support matrices
unavailable/planned states
sample fallback states
mode-specific context builders

Goal:

one clear architecture
no bridge spaghetti
no nested bridges that shadow each other
no generic fallback overriding a mode-specific adapter
no mode-specific copy in the wrong mode
no unsupported dashboard displayed as active
no planned dashboard pretending to be real
no fake sample data pretending to be backend-backed

Preferred architecture:

central dashboard ID contract
central mode support matrix
typed mode adapter registry
one dashboard shell resolution flow
mode adapters that return context/support state
shared unavailable/planned state renderer
explicit sample fallback badge if fallback is used

Example contract shape if useful:

type SharedDashboardSupport =
  | "supported"
  | "read-only"
  | "sample-fallback"
  | "preview"
  | "planned"
  | "unsupported";

type BusinessModeDashboardAdapter = {
  mode: BusinessModeId;
  getSupport(dashboardId: SharedDashboardId): SharedDashboardSupport;
  getContext(dashboardId: SharedDashboardId): DashboardContext | null;
  getUnavailableReason(dashboardId: SharedDashboardId): string | null;
};

Do not force this exact design if the repo has a better existing structure.

Required:

simplify bridge chains
remove unnecessary bridge layers
replace bridge spaghetti with typed registry/config
avoid direct mode checks scattered across UI
avoid giant untyped switch statements
keep mode-specific logic behind typed adapter boundaries
document intentional differences per mode
Part 4: Business Mode Relationship Audit

Compare all 4 modes:

Restaurant
Retail
Raw Material
Custom Business planned

For each mode compare:

Mode Identity
canonical ID
label
route base
default route
storage behavior
guard behavior
active/planned status
Feature Support
POS/cashier
order/transaction
inventory
payment
customer/partner
invoice
cashflow
financial report
analytics
staff/team
audit
monitoring
procurement
HPP/COGS
Shared Dashboard Support

Classify every shared dashboard as:

supported
read-only
sample-fallback
preview
planned
unsupported
Runtime Relationship

Check:

mode switching
wrong-mode direct route
shared dashboard direct route
old storage values
mode-specific sidebar
permissions
API mode guard
planned mode access

Required:

make relationship rules explicit
remove inconsistent behavior
generalize common behavior
keep real business differences mode-specific
do not make every mode support every dashboard just because shared code can render it
Part 5: Auth and Permission Audit

Audit auth and permission deeply.

Check:

auth session shape
current user type
role union/enum
role labels
permission matrix
sidebar permission config
route guard permission config
API middleware permission config
business mode access permission
shared dashboard permission
planned feature permission
direct URL bypass
unauthenticated behavior
unauthorized behavior
forbidden behavior

Required:

UI permission and backend permission must not contradict each other
hidden sidebar item must not be accessible through direct route if unsupported
direct route must not bypass planned/unsupported gating
auth/session null must not crash
old mode IDs must not bypass permissions
permission denied UI should be clear
API forbidden/unauthorized responses should be safe and consistent
duplicate role arrays should be centralized

Do not create fake “allow all” permissions just to make UI work.

Part 6: Prisma Schema and Migration Safety Audit

Audit Prisma schema carefully.

Check:

schema validity
model names vs API/domain names
enum values vs frontend/backend unions
nullable fields vs API contracts
relation fields vs service queries
tenant/business/restaurant/store scoping
migration history
generated client expectations
seed/sample data assumptions
schema fields used by code but not existing
schema fields existing but wrongly typed in code
migration deploy blockers

Classify each DB issue:

Environment permission issue
Missing env var
Database unavailable
Prisma schema invalid
Prisma client not generated
Migration history drift
Real schema/code mismatch
Destructive migration risk
Existing planned-schema gap

Rules:

Do not change schema just because migrate fails.
Do not make destructive migrations.
Do not add unused fields.
Do not add nullable fields as a lazy escape hatch.
Do not break Restaurant/Retail/Raw Material.
If schema changes are required, keep them minimal and explain exactly why.
Run prisma validate and prisma generate if possible.
If migration cannot run, report exact blocker and safe next command.
Part 7: Hardcode Audit

Search and remove hardcoded values where they create drift.

Hardcode categories:

business mode IDs
dashboard IDs
route paths
API endpoint paths
localStorage keys
role names
permission names
status labels
badge variants
module IDs
sidebar labels
feature support flags
sample/preview labels
error messages repeated across files
response envelope keys
Prisma enum strings duplicated outside typed contracts

Centralize only repeated or contract-critical values.

Do not centralize one-off UI text.

Bad:

mode === "restaurant"
dashboardId === "cashflow"
localStorage.getItem("currentBusinessMode")
fetch("/api/restaurant/shared-dashboard/overview")
role === "OWNER"

Better:

BUSINESS_MODE_IDS.restaurant
SHARED_DASHBOARD_IDS.cashflow
BUSINESS_MODE_STORAGE_KEY
getRestaurantSharedDashboardPath(SHARED_DASHBOARD_IDS.overview)
ROLE_IDS.owner

But do not create helper noise for values used once.

Part 8: Duplicate Code Audit

Find repeated code.

Look for duplication in:

API clients
API envelope parsing
error parsing
dashboard support maps
bridge context builders
role arrays
permission checks
route guards
localStorage mode repair
sidebar item generation
status badge logic
sample fallback badges
unavailable/planned dashboard state
frontend loading/error/empty states
backend mapper functions
backend DTO builders
Prisma query filters
ownership guards

Required:

extract reusable helper/config only when duplication is real
keep helpers domain-specific
avoid global dumping grounds
avoid over-generalizing mode-specific business rules
remove duplicate files only when confirmed unused
if unsure, document as risk instead of deleting
Part 9: Anti-Bridge-Spaghetti Cleanup

Audit all bridge/adapter files.

Search:

bridge
adapter
compat
legacy
fallback
normalize
mapMode
legacyMode
modeMap

For every bridge:

identify why it exists
identify whether it is still needed
identify whether it hides bad naming/contract drift
identify whether it creates nested resolution chains
identify whether it shadows another adapter
identify whether it imports too much
identify whether it can be replaced by a typed registry/config

Allowed bridges:

one storage-boundary migration bridge for old localStorage mode values
one typed adapter registry per shared dashboard/domain if needed
one API mapper when converting backend DTO to frontend view model

Forbidden bridges:

old mode alias compatibility in normal runtime
bridge that only exists because names are wrong
bridge that returns fake data as real
bridge that hides unsupported dashboard as supported
bridge chain with multiple fallbacks where nobody knows source of truth
bridge that imports unrelated mode internals

Required:

remove unnecessary bridges
replace spaghetti with typed contract/config
document remaining intentional adapter boundaries
Part 10: Red Code and Hidden Error Audit

Search for hidden or suspicious error suppression:

any
as any
as unknown as
@ts-ignore
@ts-expect-error
eslint-disable
TODO fix type
temporary
hack
workaround
quick fix
fallback because type

For each:

remove it if possible
replace with proper type/schema/contract
document if truly unavoidable

No task is complete if type errors are just hidden.

Part 11: File-by-File Review Requirement

Perform a structured file-by-file review in the affected areas.

At minimum review:

features/shared
config
lib
components/core
components/shared
auth-related files
permission-related files
business-mode-related files
route guard files
shared dashboard files
backend shared-dashboard/auth/permission/mode files
Prisma schema

For each reviewed area, classify:

clean
fixed
needs later dedicated mode cleanup
deprecated/unused candidate
risky but unchanged

Do not claim the whole repo is clean unless you actually inspected it.

Part 12: Testing and Verification

Run checks after changes.

Try pnpm first:

pnpm --filter @workspace/pos-system run typecheck:restaurant
pnpm --filter @workspace/pos-system run typecheck:retail
pnpm --filter @workspace/pos-system run typecheck:raw-material
pnpm --filter @workspace/pos-system run typecheck:service
pnpm --filter @workspace/pos-system run build
pnpm typecheck
pnpm business-mode:check
pnpm restaurant:check
pnpm retail:check
pnpm raw-material:check

If pnpm is blocked by EPERM lstat C:\Users\LENOVO, use local commands:

tsc -p artifacts/pos-system/tsconfig.restaurant.json --noEmit
tsc -p artifacts/pos-system/tsconfig.retail.json --noEmit
tsc -p artifacts/pos-system/tsconfig.raw-material.json --noEmit
tsc -p artifacts/pos-system/tsconfig.service.json --noEmit
tsc -p artifacts/api-server/tsconfig.json --noEmit

Run frontend build:

cd artifacts/pos-system
vite build

Run business mode script:

node scripts/business-mode-switch-check.mjs

Run sidebar parity script if available.

Run Prisma only if schema/client/migration touched:

npx prisma validate
npx prisma generate
npx prisma migrate status

If migration/deploy cannot run:

report exact command
report exact failure
classify blocker
do not claim success

Important:

do not claim full frontend typecheck passed if it timed out
do not claim migration passed if blocked
separate passed/failed/blocked/timed-out checks
separate pre-existing issues from introduced issues
Part 13: Documentation

Create or update:

docs/v3-phase-6b-contract-architecture-integrity.md

Include:

API contract findings
shared dashboard architecture decision
business mode relationship matrix
permission/auth decisions
Prisma/schema decisions
hardcode cleanup
duplicate cleanup
bridge cleanup
checks run
remaining risks
manual QA checklist

Docs must not overclaim.

If no docs are changed, explain why clearly.

Strict Rules
Do not implement full new product features.
Do not implement full Custom Business / Service.
Do not reintroduce fnb, warehouse, or service as active runtime IDs.
Do not create fake compatibility bridges.
Do not hide type errors.
Do not use any, cast hacks, or ignore comments.
Do not loosen types just to pass checks.
Do not create bridge spaghetti.
Do not let shared dashboard bridge chains shadow each other.
Do not show fake/sample data as real.
Do not leave unsupported dashboards active.
Do not let UI permission and backend permission contradict each other.
Do not change Prisma schema blindly.
Do not create destructive migrations.
Do not add unused Prisma fields.
Do not centralize one-off values.
Do not create giant utils.ts.
Do not delete useful code without confirming unused.
Do not claim checks passed unless they passed.
Do not push, branch, commit, or open PR.
Do not stop after fixing typecheck if architecture is still wrong.
Do not declare completion if API contracts, hardcodes, duplicates, bridges, permissions, shared dashboards, and Prisma were not inspected.
Completion Gate

This phase is not complete unless all of these are true:

Scoped TypeScript checks pass or blockers are honestly classified.
Backend TypeScript passes or blockers are honestly classified.
Frontend production build passes or blockers are honestly classified.
API contracts were audited and drift was fixed or documented.
Shared dashboard to business-mode relationship is explicit and typed.
Business-mode to business-mode behavior is compared and documented.
Hardcoded contract-critical values are removed or justified.
Duplicate cross-mode logic is removed or justified.
Bridge/adapters are simplified and intentional.
Prisma schema/client/API relationship is audited.
No red code is hidden with casts/ignore comments.
Remaining risks are specific, not vague.
Final Report Format

Return this exact report:

Phase 6B Contract & Architecture Integrity Report
1. Summary
2. Docs read
3. API contract audit

For each domain:

frontend client inspected
backend endpoint inspected
contract drift found
files changed
remaining risks
4. Shared dashboard architecture
files inspected
bridge/adapters removed
bridge/adapters kept
support matrix changes
mode-context behavior
remaining risks
5. Business mode relationship matrix

For each mode:

active/planned status
default route
dashboard support
permission behavior
data source behavior
known risks
6. Auth and permission audit
files inspected
bugs fixed
permission mismatches fixed
remaining risks
7. Route guard and mode switching audit
files inspected
edge cases handled
remaining risks
8. Prisma/schema audit
schema changed or not changed
schema/client drift found
migration/generate status
deploy blocker classification
remaining risks
9. Hardcode cleanup
hardcodes found
hardcodes removed
hardcodes intentionally kept and why
10. Duplicate code cleanup
duplicates found
duplicates removed/generalized
duplicates intentionally kept and why
11. Bridge/spaghetti cleanup
bridge files inspected
removed bridges
kept adapters and why
remaining risks
12. Red code / hidden error audit
casts/ignore comments found
fixed
intentionally kept and why
13. Files changed

For each:

path
what changed
why
14. Files moved/renamed/deleted

For each:

old path
new path if applicable
reason
15. Commands run

For each:

command
passed/failed/blocked/timed out
notes
16. Manual QA checklist
17. Remaining risks
18. Next recommended task

Give only one next task.

