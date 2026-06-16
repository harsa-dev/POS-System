POS System V3 Phase 6C: Prisma Schema Integrity, Migration Safety, API Contract Alignment, and Type Drift Cleanup
Context

Phase 1 through Phase 6B have already been implemented locally.

Current business modes:

restaurant: active
retail: active
raw-material: active
custom-business: planned / guarded only

Recent Phase 6B result:

Shared dashboard bridge drift was partially fixed.
Route pages now render through DashboardShell.
dashboard-shell.tsx selects one active mode adapter.
Retail shared dashboard API was moved to shared apiClient.
Backend TypeScript passed.
Scoped frontend TypeScript passed for Restaurant, Retail, Raw Material, and Service.
Frontend production build passed.
Full frontend tsconfig.json still has broader registry/UI contract errors.
Retail Prisma delegate casts remain.
Prisma schema was not changed.
Prisma validate/generate/migrate was not fully audited.
There are still risks around schema/API/client drift.

This Phase 6C task is specifically about Prisma schema, database migration safety, generated client usage, backend service contracts, frontend API contract alignment, and removing unsafe Prisma/type workarounds.

Do not push, branch, commit, or open PR.
Work locally only.

Main Goal

Make the database contract honest.

This phase must inspect and fix:

Prisma schema correctness.
Prisma client generation assumptions.
Migration/deploy safety.
Backend Prisma delegate casts.
Backend service queries vs schema fields.
Backend DTOs vs Prisma result shape.
Frontend API clients vs backend DTOs.
Business-mode-specific schema coverage.
Nullable/optional field drift.
Enum/status drift.
Ownership/tenant/business scoping.
Unsafe as unknown as Prisma delegate workarounds.
Fake schema assumptions hidden in frontend or backend code.

This phase is incomplete if Prisma schema is only glanced at and not compared against actual backend/frontend contracts.

Strict Scope

You may inspect and modify:

prisma schema files
migration files
Prisma client usage
artifacts/api-server routes/services/controllers/repositories
artifacts/api-server DTOs/mappers/validators
artifacts/pos-system API clients/types only if they depend on backend contracts
business-mode contract files only if schema/API mode drift requires it
docs related to schema/API/migration
scripts related to Prisma/typecheck/migration

Do not broadly refactor UI.
Do not add new product features.
Do not implement full Custom Business / Service.
Do not rewrite the database.
Do not change Restaurant/Retail/Raw Material flows unless required by schema/API correctness.

Non-Negotiable Rules
Do not modify Prisma schema just because migrate/deploy fails.
First classify whether failure is environment, missing env, DB unavailable, schema invalid, migration drift, generated client issue, or real code/schema mismatch.
Do not create destructive migrations.
Do not rename existing models/fields unless absolutely required.
Do not add unused fields.
Do not add nullable fields as a lazy escape hatch.
Do not use any.
Do not use as any.
Do not use as unknown as.
Do not use @ts-ignore.
Do not use @ts-expect-error.
Do not hide red code just to pass typecheck.
Do not keep Prisma delegate casts if proper typing/schema/service design can fix them.
Do not claim Prisma passed unless the command actually passed.
Do not accept old mode IDs fnb, warehouse, or service as active DB/API mode values.
Part 1: Read Docs and Inspect Current Schema

Before editing:

Read all V3 schema/database/API docs.
Read Phase 4A, 4B, 5A, 5B, 6A, and 6B docs.
Inspect Prisma schema file(s).
Inspect migration folders.
Inspect generated Prisma client assumptions.
Inspect backend services that use Prisma.
Inspect frontend API clients that depend on Prisma-backed backend responses.
Inspect business-mode-specific backend routes.
Inspect all unsafe Prisma delegate casts.
Write a short audit plan before editing.

Search globally:

prisma
schema.prisma
migrate
migration
generate
PrismaClient
Prisma.
delegate
findMany
findFirst
findUnique
create
update
upsert
delete
include
select
as unknown as
as any
any
RawMaterial
Restaurant
Retail
Supplier
Product
Order
Payment
Invoice
Inventory
StockMovement
Shift
Audit
businessId
restaurantId
storeId
ownerId
tenant
mode
businessMode
raw-material
restaurant
retail
custom-business
fnb
warehouse
service
Part 2: Prisma Command and Environment Classification

Run Prisma-related checks carefully.

Try:

npx prisma validate
npx prisma generate
npx prisma migrate status

If this repo uses workspace-specific Prisma commands, inspect package scripts and use the correct commands.

If commands fail, classify:

Environment permission issue
Missing .env
Missing DATABASE_URL
Database unavailable
Prisma schema invalid
Prisma client not generated
Migration history drift
Migration deploy blocked
Destructive migration warning
Real schema/code mismatch

Do not immediately edit schema.

Report exact command and exact failure.

If migrate deploy cannot run, do not force it.
If generate fails because schema is invalid, fix schema.
If validate passes but code fails, fix code/schema contract drift.

Part 3: Business Mode Schema Coverage Audit

Compare schema support across 4 modes:

Restaurant

Check schema coverage for:

Restaurant/business entity
user/roles
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
ownership scoping
Retail

Check schema coverage for:

retail store/business entity
products
categories
SKU/barcode if used
stock level
stock movement
sales/transactions/orders
payments
customers
invoices/receipts
refunds/returns if visible
ownership scoping
Raw Material

Check schema coverage for:

suppliers
intakes/batches
storage
stock movements
material master if claimed
minimum stock if claimed
procurement/purchase if claimed
supplier invoice if claimed
HPP/COGS if claimed
ownership scoping
Custom Business

Check schema coverage for:

planned/guarded only
no active runtime persistence pretending to be production
no service schema pretending to be active unless documented as planned infrastructure

For each mode, classify each schema area:

"real"
"read-only"
"sample-fallback"
"planned"
"unsupported"
"schema-missing-but-ui-claims-real"
"backend-uses-field-not-in-schema"
"frontend-expects-field-not-returned"

Required:

fix real mismatches
downgrade fake UI/API claims to planned/unsupported if schema does not exist
do not invent huge schema just to make dashboards look complete
document planned schema gaps
Part 4: Prisma Delegate Cast Cleanup

Search and fix unsafe Prisma delegate casts.

Search:

as unknown as
as any
PrismaClient[
delegate
modelDelegate

Known risk:

Retail Prisma delegate casts remain.

For each cast:

identify why it exists
identify actual Prisma model/delegate
check whether model exists in schema
check whether naming mismatch causes the cast
check whether service is too generic
replace with proper typed repository/service where possible

Preferred fixes:

mode-specific repository functions
typed service functions
explicit Prisma model access
typed DTO mappers
typed query args
narrow generic helper signatures
schema correction only if the schema is actually wrong

Do not replace as unknown as with as any.
Do not hide the cast in another helper.
Fix the actual typing issue.

If a cast is truly unavoidable:

keep it isolated
explain why
document risk
do not spread it
Part 5: Backend Service vs Prisma Schema Audit

Audit backend services against schema.

For each backend domain:

Restaurant
Retail
Raw Material
Shared Dashboard
Auth/User/Session
Permission/Role
Invoice
Inventory
Order
Payment
Audit

Check:

service queries only use fields that exist
include relations exist
select fields exist
enum values match Prisma enums
nullable fields are handled
decimal fields are converted safely
relation names match schema
create/update data matches schema
filters use correct ownership field
no business mode accepts legacy mode IDs
no unsafe user-controlled IDs bypass ownership filtering

Required:

fix schema/code mismatch
fix DTO mapper mismatch
fix unsafe null handling
fix enum drift
fix ownership/tenant filtering drift where obvious

Do not do broad service rewrite unless required.

Part 6: Frontend API Contract Alignment

Audit frontend API clients against backend DTOs.

For each frontend client:

path
method
request type
response type
envelope parser
fallback behavior
nullable assumptions
enum/status assumptions

Check:

frontend does not expect fields backend does not return
frontend does not send fields backend rejects
frontend does not treat sample fallback as persisted data
frontend handles null/empty safely
frontend uses shared envelope parser consistently
frontend does not duplicate backend DTO definitions incorrectly

Required:

align frontend types with backend DTOs
centralize contract-critical API paths if repeated
use shared envelope parsing
avoid casts
document intentional sample fallback
Part 7: Enum and Status Drift Audit

Audit enum/status values across:

Prisma enums
backend TypeScript unions
backend validators
frontend types
frontend configs
UI badge/status maps
route/action guards

Check:

business mode IDs
roles
order statuses
payment statuses
table statuses
inventory movement types
invoice statuses
stock statuses
shift statuses
dashboard support statuses

Required:

one source of truth where possible
no duplicated mismatched strings
no stale fnb, warehouse, service active values
no UI status value missing backend support
no backend enum value missing UI label where UI displays it

Do not loosen unions.

Part 8: Ownership / Tenant Scoping Audit

Audit database queries for tenant/business isolation.

Check all relevant services:

user access
restaurant data
retail data
raw material data
shared dashboard data
orders
payments
inventory
suppliers
invoices
audit logs

Check:

queries filter by correct business/restaurant/store/user scope
update/delete operations verify ownership
direct ID access does not bypass ownership
shared dashboards do not aggregate across unrelated business scope
auth user role is not trusted without business relation
frontend-provided business ID is not blindly trusted

Required:

fix obvious unscoped queries
document risky areas needing deeper auth review
do not create fake scoping with client-provided IDs only
Part 9: Migration File Audit

Inspect migrations if present.

Check:

migration names
schema drift
deleted/renamed tables
destructive operations
pending migrations
generated client mismatch
local-only migration issues
deploy safety

If migrations cannot run:

classify blocker
document safe next command
do not create new migration unless schema changed and environment allows it

If schema changed:

create only necessary migration if command can run
otherwise document exact manual command:
npx prisma migrate dev --name <name>
or project-specific equivalent

Do not fake migration success.

Part 10: Docs Update

Create or update:

docs/v3-phase-6c-prisma-schema-integrity.md

Include:

Prisma command results
environment blockers
schema coverage matrix per mode
unsafe casts removed or remaining
schema/API/frontend contract fixes
enum/status alignment
ownership/tenant scoping findings
migration safety findings
remaining risks
next recommended task

Docs must not overclaim.

Part 11: Verification

Run after changes:

tsc -p artifacts/pos-system/tsconfig.restaurant.json --noEmit
tsc -p artifacts/pos-system/tsconfig.retail.json --noEmit
tsc -p artifacts/pos-system/tsconfig.raw-material.json --noEmit
tsc -p artifacts/pos-system/tsconfig.service.json --noEmit
tsc -p artifacts/api-server/tsconfig.json --noEmit

Run frontend build:

cd artifacts/pos-system
vite build

Run business mode check:

node scripts/business-mode-switch-check.mjs

Run Prisma:

npx prisma validate
npx prisma generate
npx prisma migrate status

If repo needs workspace path, use the correct package/script after inspecting docs/scripts.

If pnpm remains blocked:

report it as environment blocker
use local binaries where possible

Important:

do not claim full frontend typecheck passed if timed out
do not claim Prisma/migrate passed if blocked
separate passed, failed, blocked, and timed-out checks
Completion Gate

This phase is not complete unless:

Prisma schema was actually inspected.
Prisma validate/generate/migrate status was attempted or blocker classified.
Backend services were compared against schema.
Frontend API clients were compared against backend DTOs.
Unsafe Prisma casts were removed or explicitly documented as unavoidable.
Enum/status drift was checked.
Ownership/tenant scoping was checked.
Planned schema gaps were documented.
No type errors were hidden.
No destructive migration was created.
Checks were run or blockers were classified honestly.
Final Report Format

Return this exact report:

Phase 6C Prisma Schema Integrity Report
1. Summary
2. Docs read
3. Prisma command results

For each:

command
passed/failed/blocked/timed out
classification
notes
4. Schema coverage matrix

For each mode:

Restaurant
Retail
Raw Material
Custom Business
Include:
real schema support
planned schema gaps
UI/API claims that were downgraded or fixed
remaining risks
5. Prisma delegate cast cleanup
casts found
casts removed
casts remaining and why
6. Backend service vs schema audit

For each domain:

files inspected
mismatch found
files changed
remaining risks
7. Frontend API contract alignment

For each client/domain:

files inspected
drift found
files changed
remaining risks
8. Enum/status alignment
enums/statuses inspected
drift fixed
remaining risks
9. Ownership/tenant scoping audit
files inspected
bugs fixed
risky areas documented
10. Migration safety audit
migrations inspected
destructive risk
pending blocker
safe next command
11. Prisma/schema changes
changed or not changed
exact changes
reason
migration/generate status
12. Files changed
13. Commands run

For each:

command
passed/failed/blocked/timed out
notes
14. Remaining risks
15. Next recommended task

Give only one next task.

This phase is incomplete if the report says “schema not changed” without proving that Prisma schema, migrations, backend services, frontend API clients, enums/statuses, and ownership scoping were actually compared.

Do not treat “Prisma schema not changed” as success. The goal is not to change schema. The goal is to prove whether schema, backend, and frontend contracts are aligned. If they are not aligned, fix the smallest correct source of truth.