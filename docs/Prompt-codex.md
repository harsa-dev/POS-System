# POS System V3 Phase 5B: Restaurant Core POS Flow Hardening, Order/Table/Payment/Kitchen/Serving Audit, and File Structure Cleanup

## Context

Phase 1, Phase 2, Phase 3, Phase 4A, Phase 4B, and Phase 5A have already been implemented locally.

Current business modes:

* `restaurant`: active
* `retail`: active
* `raw-material`: active
* `custom-business`: planned / guarded only

Known Phase 5A result:

* Restaurant shared dashboard bridge was added.
* `dashboard-shell.tsx` now composes Restaurant and Raw Material dashboard bridges.
* POS fallback data was renamed from `pos-placeholder-data.ts` to `pos-sample-data.ts`.
* Visible “placeholder” wording was cleaned in Restaurant POS/menu/tables UI.
* No backend/API or Prisma changes were made in Phase 5A.
* Restaurant scoped TypeScript passed.
* Backend TypeScript passed.
* Vite production build passed with existing sourcemap warnings.
* `business-mode-switch-check.mjs` passed.
* pnpm commands remain blocked by local `EPERM lstat C:\Users\LENOVO`.
* Browser QA was not run.

This Phase 5B task is scoped to **Restaurant core operational flow only**, plus shared infrastructure only when Restaurant core flow requires it.

Do not work broadly on Retail or Raw Material.
Do not change Raw Material Phase 4A/4B behavior.
Do not implement Custom Business / Service.
Do not push, branch, commit, or open PR.
Work locally only.

---

## Main Goal

Harden Restaurant as a real POS operational mode.

This phase must focus on:

1. Restaurant POS / cashier flow.
2. Restaurant order creation and order status transitions.
3. Restaurant table state and table-order sync.
4. Restaurant payment flow.
5. Restaurant kitchen / KDS flow.
6. Restaurant serving flow.
7. Restaurant menu/category flow.
8. Restaurant shift cashier flow if present.
9. Restaurant backend/API contracts.
10. Restaurant Prisma alignment only if needed.
11. Restaurant guards, permissions, and route safety.
12. Restaurant file structure and fat file splitting.
13. Restaurant duplicate/hardcode cleanup.
14. Restaurant UI polish for core operational screens.
15. Restaurant docs and verification.

This phase is incomplete if it only changes naming, copy, docs, or shared dashboard wiring.

---

## Scope Boundary

Focus only on:

```txt id="rs5v8j"
artifacts/pos-system/src/app/workspace/restaurant
artifacts/pos-system/src/features/restaurant
artifacts/pos-system/src/features/orders only if Restaurant order flow uses it
artifacts/pos-system/src/features/payments only if Restaurant payment flow uses it
artifacts/pos-system/src/features/tables only if Restaurant table flow uses it
artifacts/pos-system/src/features/shared only if Restaurant core flow requires shared helpers/components
artifacts/pos-system/src/config related to Restaurant routes/modules/status/permissions
artifacts/pos-system/src/lib/api/helpers used by Restaurant core flow
artifacts/api-server Restaurant/order/payment/table/menu/kitchen/serving/shift routes and services
Prisma schema only if Restaurant core flow requires alignment
docs related to Restaurant and V3 phases
scripts/checks related to Restaurant
```

Do not modify Retail/Raw Material unless:

* a shared helper used by Restaurant is broken
* a shared type/config must remain compatible
* business mode contract needs a Restaurant correction

If shared files are touched, explain why.

---

## Required First Steps

Before editing:

1. Read all Restaurant docs.
2. Read V3 canonical business mode docs.
3. Read Phase 5A Restaurant hardening docs.
4. Inspect Restaurant workspace files.
5. Inspect Restaurant feature folder.
6. Inspect POS/cashier files.
7. Inspect menu/category files.
8. Inspect order files.
9. Inspect table files.
10. Inspect payment files.
11. Inspect kitchen/KDS files.
12. Inspect serving files.
13. Inspect shift cashier files if present.
14. Inspect Restaurant API clients.
15. Inspect Restaurant backend routes/services.
16. Inspect Prisma schema for Restaurant/order/table/menu/payment/inventory/shift/audit models.
17. Inspect Restaurant route guards and role permissions.
18. Write a short audit plan before changing code.

Search terms:

```txt id="i9fbzv"
restaurant
pos
cashier
checkout
cart
menu
menu item
category
order
orders
order status
WAITING_CASHIER_APPROVAL
WAITING_PAYMENT
PAID
PREPARING
READY
SERVED
COMPLETED
CANCELLED
REJECTED
payment
payments
payment status
table
tables
table status
kitchen
kds
serving
server
shift
receipt
invoice
tax
service charge
discount
recipe
stock
stock movement
inventory
audit
role
permission
OWNER
MANAGER
CASHIER
KITCHEN
SERVER
duplicate submit
loading
empty
error
sample
mock
placeholder
fnb
FNB
FnB
```

If old names like `fnb`, `FNB`, `FnB`, or active “placeholder” runtime wording still exist in Restaurant operational code, fix them.

---

# Part 1: Restaurant Operational Surface Classification

Classify every Restaurant operational surface:

1. Real and persisted.
2. Real read-only.
3. Local sample/demo fallback.
4. Planned.
5. Unsupported and should be hidden/disabled.

Classify at least:

* POS/cashier
* menu items
* categories
* cart
* order creation
* order list
* order status transition
* payment
* receipt/invoice
* tables
* table lock/status
* kitchen/KDS
* serving
* shift cashier
* inventory/recipe deduction
* stock movement
* settings/tax/service charge
* audit log

Rules:

* Do not show sample data as real persisted data.
* If a write action is local-only, label it honestly or wire it properly.
* If a workflow is unsupported, hide/disable/mark planned.
* If a workflow is real, ensure API/backend/Prisma alignment.

---

# Part 2: POS / Cashier Flow Hardening

Audit and harden Restaurant POS/cashier flow.

Check:

* menu loading
* category/filter/search
* item availability
* cart add/remove/update quantity
* invalid quantity
* duplicate add
* cart empty checkout
* discount/tax/service charge handling if present
* payment method selection
* table selection if dine-in flow exists
* customer note/order note if present
* duplicate checkout submit
* loading state during checkout
* error state during checkout
* success state after checkout
* order created with correct initial status
* payment created or pending according to method
* table status updated if table is used
* inventory/recipe deduction if implemented
* audit log if implemented

Required fixes:

* prevent duplicate checkout submit
* guard empty cart
* validate quantity
* validate selected payment method
* validate selected table if required
* handle menu item unavailable
* handle API error envelope
* handle malformed API envelope
* keep cashier UI clear and consistent
* remove hardcoded route/status strings if repeated

Do not fake successful checkout.

---

# Part 3: Order Flow and Status Transition Hardening

Audit order flow.

Expected Restaurant order flow may include:

```txt id="7dl8bq"
WAITING_CASHIER_APPROVAL
→ WAITING_PAYMENT
→ PAID
→ PREPARING
→ READY
→ SERVED
→ COMPLETED

Alternative terminal states:
CANCELLED
REJECTED
```

Check:

* current enum/status values
* frontend status labels
* backend status validation
* allowed transitions
* role permissions per transition
* invalid transition handling
* terminal state handling
* duplicate status update submit
* stale order state
* order not found
* order belongs to wrong restaurant/business
* order items missing
* order total mismatch
* API response shape

Required fixes:

* centralize allowed transitions if duplicated
* centralize status labels/badge variants if duplicated
* enforce invalid transition guard on backend if backend supports transitions
* enforce UI disabled state for invalid actions
* use safe error copy
* do not loosen status types

---

# Part 4: Table Flow and Table-Order Sync

Audit table flow.

Check:

* table list loading
* table empty state
* table status labels
* table status transitions
* table occupied/available/cleaning state
* table lock when order created
* table release when order completed/cancelled if supported
* table unavailable/deleted handling
* order linked to table
* direct table action role permission
* stale table state after order update
* UI not showing impossible actions

Required fixes:

* centralize table status config if duplicated
* prevent selecting occupied/unavailable table when not allowed
* prevent table/order state mismatch where current code supports prevention
* update UI labels and disabled states
* keep backend checks if table mutation exists

---

# Part 5: Payment Flow Hardening

Audit payment flow.

Check:

* payment method config
* payment method enabled/disabled state
* cash/QRIS/card/transfer handling if present
* payment amount validation
* payment status validation
* paid/pending/failed/refunded/cancelled states if present
* duplicate payment submit
* payment already paid
* missing payment
* order total mismatch
* receipt/invoice generation if present
* shift cashier effect if cash payment exists

Required fixes:

* centralize payment status/method labels if duplicated
* disable invalid payment actions
* prevent duplicate payment submit
* validate payment amount if input exists
* do not show unsupported payment methods as active
* avoid fake payment success

---

# Part 6: Kitchen / KDS Flow Hardening

Audit kitchen/KDS flow.

Check:

* kitchen queue loads only relevant statuses
* PAID orders appear for kitchen if expected
* PREPARING orders appear correctly
* READY orders are removed or moved appropriately
* Start Cooking action
* Mark Ready action
* duplicate kitchen action submit
* invalid status action
* role permission for KITCHEN
* non-kitchen roles blocked/hidden where appropriate
* order item display clarity
* empty kitchen queue state
* API errors

Required fixes:

* disable invalid KDS actions
* prevent duplicate action submit
* handle order already preparing/ready
* centralize kitchen status/action config if duplicated
* ensure KDS does not show Retail/Raw Material copy or stale FNB labels

---

# Part 7: Serving Flow Hardening

Audit serving flow.

Check:

* serving queue loads READY orders
* Mark Served action if present
* Complete order action if present
* duplicate serving action submit
* invalid status action
* role permission for SERVER/MANAGER/OWNER if applicable
* served/completed terminal behavior
* table release/cleaning transition if supported
* empty serving queue state
* API errors

Required fixes:

* disable invalid serving actions
* prevent duplicate action submit
* handle order already served/completed
* centralize serving status/action config if duplicated
* ensure serving does not show stale FNB labels

---

# Part 8: Menu and Category Flow Hardening

Audit menu/category flow.

Check:

* menu list loading
* category list loading
* empty menu state
* empty category state
* unavailable item state
* invalid price
* invalid stock/availability
* duplicate menu submit
* category deleted/unavailable
* menu item search/filter
* image/media handling if present
* recipe connection if present
* route/action permissions

Required fixes:

* validate forms if forms exist
* disable invalid actions
* centralize menu/category labels/config if duplicated
* split large menu files if they mix list, form, filter, and API logic
* avoid sample data pretending to be real

---

# Part 9: Shift Cashier Flow Hardening

If shift cashier exists, audit:

* shift open
* shift close
* expected cash
* actual cash
* cash difference
* cash payments during shift
* no active shift
* duplicate open/close submit
* cashier role permission
* shift required before cash checkout if current flow expects it
* shift report shared dashboard wiring

Required fixes:

* guard no active shift if necessary
* prevent duplicate submit
* validate cash numbers
* keep shift report context Restaurant-specific
* hide shift features if not wired

If shift cashier does not exist in current Restaurant flow:

* document it as not present/planned
* do not invent it fully

---

# Part 10: Backend/API Contract Audit

Audit Restaurant backend/API contracts.

Check:

* order endpoints
* payment endpoints
* menu endpoints
* table endpoints
* kitchen/KDS endpoints
* serving endpoints
* shift endpoints if present
* shared dashboard endpoint
* DTOs/mappers
* validation schemas
* error envelopes
* status codes
* permission guards
* ownership/tenant scoping

Required:

* frontend calls must match backend endpoints
* backend must validate route params/body
* backend must reject invalid status transitions if endpoint mutates status
* backend must not trust client-provided restaurant/business ID blindly
* backend errors must not leak internal stack/DB messages
* response envelope should be consistent with frontend parser
* touched APIs should remain type-safe

Do not rewrite all backend.
Fix only Restaurant core flow issues.

---

# Part 11: Prisma / Database Alignment

Inspect Prisma only for Restaurant flow.

Check:

* enum values match frontend/backend status types
* OrderStatus values match allowed transitions
* PaymentStatus values match UI/API
* TableStatus values match UI/API
* relation between Order and Table if used
* relation between Order and Payment if used
* relation between MenuItem and Category if used
* relation between MenuItem and Recipe/Inventory if used
* relation between Shift and User/Restaurant if used
* audit log relation if used
* nullable fields handled safely

Only change Prisma if:

* current Restaurant flow is broken because schema is wrong
* TypeScript/build fails because schema/client contract is wrong
* API cannot safely implement current Restaurant flow without minimal schema alignment

Do not:

* broad schema rewrite
* destructive migration
* unrelated Retail/Raw Material schema changes
* add unused fields
* add schema just because it looks nice

If Prisma touched:

* run validate/generate if environment allows
* document migration risk

---

# Part 12: Restaurant File Structure Cleanup and Fat File Split

Find and split Restaurant fat files.

Candidates:

* POS workspace files
* cashier hooks/components
* menu workspace files
* order workspace files
* table workspace files
* payment workspace files
* kitchen workspace files
* serving workspace files

A fat file is suspicious if it:

* mixes UI, fetch, state, constants, formatting, and business logic
* contains several unrelated components
* has large inline arrays/configs
* repeats status checks
* repeats API parsing
* repeats JSX sections
* has long conditional chains

Preferred structure:

```txt id="wi3e6d"
features/restaurant/
  components/
    pos/
    menu/
    orders/
    tables/
    payments/
    kitchen/
    serving/
    shifts/
    shared/
  hooks/
  services/
  schemas/
  types/
  utils/
  constants/
  config/
```

Extraction examples:

* `restaurant-pos-workspace.tsx`
* `pos-menu-grid.tsx`
* `pos-cart-panel.tsx`
* `pos-payment-panel.tsx`
* `pos-checkout-summary.tsx`
* `use-restaurant-pos.ts`
* `restaurant-order-status.config.ts`
* `restaurant-order-transitions.ts`
* `restaurant-table-status.config.ts`
* `restaurant-payment-methods.config.ts`
* `kitchen-order-card.tsx`
* `serving-order-card.tsx`
* `restaurant-empty-state.tsx`

Rules:

* split only when useful
* no giant `utils.ts`
* no shared code importing from Restaurant unless intentionally mode adapter
* no Restaurant-specific logic dumped into global shared
* preserve behavior

---

# Part 13: Hardcoded/Duplicate Cleanup

Remove repeated hardcoded logic.

Centralize repeated:

* order statuses
* allowed transitions
* status labels
* badge variants
* table statuses
* payment statuses
* payment methods
* role permissions
* route paths
* API endpoints if repeated
* currency/date formatters
* tax/service charge logic if repeated
* empty/loading/error copy if repeated
* queue action labels

Do not centralize one-off strings.

---

# Part 14: Frontend/UI Polish

Polish Restaurant operational UI.

Focus:

* POS clarity
* cart clarity
* checkout summary
* table status visibility
* order status badges
* payment state
* kitchen queue
* serving queue
* empty states
* loading states
* error states
* disabled states
* duplicate submit feedback
* responsive layout if obvious
* consistent button labels
* no stale placeholder/FNB copy

Do not redesign the whole app.

---

# Part 15: Verification

Run Restaurant-focused checks.

Try pnpm first if environment allows:

```bash id="l54z4l"
pnpm --filter @workspace/pos-system run typecheck:restaurant
pnpm restaurant:check
pnpm business-mode:check
```

If pnpm is blocked by `EPERM lstat C:\Users\LENOVO`, use local commands:

```bash id="xj2gg5"
tsc -p artifacts/pos-system/tsconfig.restaurant.json --noEmit
```

Also run:

```bash id="yi6ljs"
cd artifacts/pos-system
vite build
```

If backend touched:

```bash id="u4q747"
tsc -p artifacts/api-server/tsconfig.json --noEmit
```

If Prisma touched:

```bash id="jp6w21"
npx prisma validate
npx prisma generate
```

Run:

```bash id="rf6gzn"
node scripts/business-mode-switch-check.mjs
```

Run sidebar parity if Restaurant navigation/sidebar/module registry was touched.

Important:

* do not claim full frontend typecheck passed if it times out
* separate passed/failed/blocked/timed-out checks
* separate pre-existing issues from issues caused by this phase

---

# Part 16: Manual QA Checklist

Provide exact manual QA steps.

## Mode and route

1. Open `/select-mode`.
2. Select Restaurant.
3. Confirm `currentBusinessMode` is `restaurant`.
4. Refresh.
5. Open Restaurant route directly.
6. Set invalid `currentBusinessMode`.
7. Set old `fnb`.
8. Confirm safe behavior.

## POS/Cashier

1. Open Restaurant POS.
2. Check menu loading.
3. Add item to cart.
4. Change quantity.
5. Remove item.
6. Try checkout with empty cart.
7. Try invalid quantity.
8. Select payment method.
9. Select table if required.
10. Submit checkout.
11. Try duplicate submit.
12. Confirm success/error behavior.

## Orders

1. Open orders.
2. Check empty state.
3. Check status badges.
4. Try valid status transition.
5. Try invalid status transition if possible.
6. Confirm terminal states behave correctly.

## Tables

1. Open tables.
2. Check available/occupied/cleaning states.
3. Select table for order if supported.
4. Confirm table state syncs with order.
5. Try unavailable table.

## Payments

1. Open payment flow.
2. Check payment method labels.
3. Try pending/paid state if possible.
4. Try duplicate payment submit.
5. Confirm paid order cannot be paid again.

## Kitchen/KDS

1. Open KDS.
2. Check empty queue.
3. Start cooking if order exists.
4. Mark ready.
5. Try duplicate action.
6. Confirm invalid actions are disabled.

## Serving

1. Open serving queue.
2. Check empty queue.
3. Mark served/complete if order exists.
4. Try duplicate action.
5. Confirm table/order state after serving if supported.

## Shared dashboards

1. Open Restaurant shared dashboards.
2. Confirm they show Restaurant context.
3. Confirm no Retail/Raw Material copy.
4. Confirm unsupported dashboards are hidden/disabled/planned.

---

# Part 17: Documentation

Create or update:

```txt id="g3egwr"
docs/v3-phase-5b-restaurant-core-flow-hardening.md
```

Include:

* operational surface classification
* POS/cashier decisions
* order transition decisions
* table sync decisions
* payment decisions
* kitchen/serving decisions
* backend/API decisions
* Prisma decisions
* file structure changes
* helpers/components created
* commands run
* remaining risks
* manual QA checklist

Docs must not overclaim.

---

## Strict Rules

1. Work only on Restaurant core operational flow unless shared infrastructure is required.
2. Do not modify Raw Material Phase 4B decisions.
3. Do not globally refactor Retail.
4. Do not implement Custom Business / Service.
5. Do not reintroduce FNB as active runtime naming.
6. Do not accept `fnb` as active API mode ID.
7. Do not use `any`, `as any`, `as unknown as`, `@ts-ignore`, or `@ts-expect-error`.
8. Do not create fake compatibility bridges.
9. Do not fake persisted POS/order/payment data.
10. Do not show sample data as real.
11. Do not leave active write buttons unwired unless clearly disabled/planned.
12. Do not add Prisma schema unless Restaurant genuinely needs it.
13. Do not create destructive migrations.
14. Do not leave fat Restaurant files untouched without a clear reason.
15. Do not create giant `utils.ts`.
16. Do not move Restaurant-specific logic into global shared unless truly shared.
17. Do not centralize one-off values.
18. Do not delete useful logic.
19. Do not silently skip checks.
20. Do not claim checks passed unless they passed.
21. Do not push, branch, commit, or open PR.

---

# Final Report Format

Return this exact report:

# Phase 5B Restaurant Core Flow Report

## 1. Summary

## 2. Docs read

## 3. Operational surface classification

For each surface:

* real / read-only / sample fallback / planned / unsupported
* reason

## 4. POS/cashier changes

* files inspected
* flow fixes
* edge cases handled
* remaining risks

## 5. Order flow changes

* status transitions
* validation
* role/guarding
* remaining risks

## 6. Table flow changes

* status sync
* table-order behavior
* remaining risks

## 7. Payment flow changes

* methods/statuses
* duplicate submit
* receipt/invoice behavior
* remaining risks

## 8. Kitchen/KDS changes

* queue behavior
* status actions
* role/guarding
* remaining risks

## 9. Serving changes

* queue behavior
* status actions
* role/guarding
* remaining risks

## 10. Menu/category changes

* availability
* validation
* file split
* remaining risks

## 11. Shift cashier changes

* supported/planned/unsupported
* behavior
* remaining risks

## 12. Backend/API changes

* endpoints touched
* validation
* response envelope
* permission/ownership
* remaining risks

## 13. Prisma/database decisions

* changed or not changed
* reason
* validate/generate status
* risks

## 14. Structure and naming changes

For each moved/renamed file:

* old path
* new path
* reason

## 15. Helpers/configs/components created

For each:

* file path
* purpose
* where used

## 16. Hardcoded/duplicate cleanup

* what was removed
* what was centralized
* why

## 17. Commands run

For each:

* command
* passed/failed/blocked/timed out
* notes

## 18. Manual QA checklist

## 19. Remaining risks

## 20. Next recommended task

Give only one next task.

This phase is incomplete if it only changes shared dashboard wiring, copy, or docs. It must inspect and harden Restaurant POS, orders, tables, payments, kitchen/KDS, serving, menu/category, backend/API contracts, and file structure.