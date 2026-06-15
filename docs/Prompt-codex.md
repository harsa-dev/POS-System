# POS System V3 Phase 6A: Retail Mode Deep Hardening, Flow Completion, Shared Dashboard Wiring, Prisma/API Alignment, and Structure Cleanup

## Context

Phase 1, Phase 2, Phase 3, Phase 4A, Phase 4B, Phase 5A, and Phase 5B have already been implemented locally.

Current business modes:

* `restaurant`: active
* `retail`: active
* `raw-material`: active
* `custom-business`: planned / guarded only

Raw Material status:

* Phase 4A cleaned Raw Material naming, route wiring, shared dashboard restrictions, and planned/unsupported states.
* Phase 4B wired Raw Material shared dashboards to prefer real `GET /raw-material/summary` backend API where applicable.
* Procurement cashflow, supplier invoice hold, financial reports, HPP/COGS remain planned/unsupported for Raw Material because the schema does not exist yet.
* Phase 4C will later focus only on Raw Material file cleanup and structure splitting.

Restaurant status:

* Phase 5A added Restaurant shared dashboard bridge and cleaned sample/placeholder wording.
* Phase 5B hardened Restaurant core POS flow.
* Restaurant POS now uses canonical `restaurantClient` for order creation, tables, and open orders.
* Dine-in table selection is guarded in frontend and backend.
* Kitchen, serving, and order completion share centralized Restaurant action rules.
* Phase 5C will later continue Restaurant fallback/core-system cleanup.

This Phase 6A task is scoped to **Retail mode only**, plus shared infrastructure only when Retail needs it.

Do not work broadly on Restaurant or Raw Material.
Do not change Raw Material Phase 4A/4B behavior.
Do not change Restaurant Phase 5A/5B behavior.
Do not implement full Custom Business / Service.
Do not push, branch, commit, or open PR.
Work locally only.

---

## Main Goal

Make Retail mode feel like a real, clean, guarded, maintainable, and testable business mode.

This includes:

1. Retail frontend flow hardening.
2. Retail backend/API polish.
3. Retail Prisma/database alignment if needed.
4. Retail shared dashboard wiring.
5. Retail route guard and access guard tightening.
6. Retail feature limiting.
7. Retail folder/file structure cleanup.
8. Retail naming cleanup.
9. Retail duplicate/hardcoded code cleanup.
10. Retail fat file split.
11. Retail edge case handling.
12. Retail docs update.
13. Retail verification.

This phase is incomplete if Retail still behaves like demo UI, uses fake production data, leaks Restaurant/Raw Material copy, has fat mixed-responsibility files, or shows unsupported dashboards as active.

---

## Scope Boundary

Focus only on:

```txt
artifacts/pos-system/src/features/retail
artifacts/pos-system/src/app routes related to retail
artifacts/pos-system/src/config related to retail mode/modules/routes
artifacts/pos-system/src/lib helpers used by retail
artifacts/pos-system/src/components used by retail
artifacts/pos-system/src/features/shared only when Retail dashboard wiring needs it
artifacts/api-server routes/services/controllers related to retail
Prisma schema only if Retail requires real backend alignment
docs related to Retail and V3 business modes
scripts/checks related to Retail
```

Do not modify unrelated Restaurant/Raw Material logic unless:

* Retail imports shared code that has a bug.
* Shared dashboard wiring needs a reusable mode-aware helper.
* Business mode contract needs a Retail correction.
* Route guard logic must be corrected for Retail.

If you touch shared files, explain why.

---

## Required First Steps

Before editing:

1. Read all docs related to V3, Retail, business modes, shared dashboards, API, database, and phase notes.
2. Inspect the Retail feature folder.
3. Inspect Retail routes.
4. Inspect Retail navigation/sidebar/module registry.
5. Inspect Retail API clients.
6. Inspect Retail backend/API routes and services.
7. Inspect Prisma schema for retail/product/inventory/sales/order/payment/customer/stock-related models.
8. Inspect shared dashboards and how they should receive Retail context.
9. Inspect business mode guard logic for Retail.
10. Inspect scripts/checks related to Retail.
11. Write a short audit plan before changing code.

Search terms:

```txt
retail
retail mode
retail workspace
retail-interactive-workspace
product
products
sku
barcode
category
customer
customers
cart
checkout
cashier
sales
sale
transaction
order
orders
payment
payments
invoice
receipt
inventory
stock
stock movement
discount
tax
refund
return
supplier
variant
unit
price
cost
margin
low stock
out of stock
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
role
permission
restaurant
raw-material
warehouse
fnb
service
custom-business
sample
mock
placeholder
```

If old names like `warehouse`, `fnb`, `service`, or Restaurant/Raw Material copy still appear in active Retail runtime code, fix them.
Historical docs can mention old names only if they clearly say they are legacy.

---

## Retail Product Definition

Retail mode should represent an operational retail POS / store management workflow.

Expected domain areas:

1. Product list
2. Product categories
3. Stock level
4. Stock movement
5. Cart / checkout
6. Sales transactions
7. Payment handling
8. Receipt/invoice
9. Customer context if already present
10. Discount/tax if already present
11. Return/refund if already present
12. Inventory low-stock/out-of-stock status
13. Shared dashboard analytics/reporting if already supported

Do not invent a massive retail ERP.
Complete and harden what already exists.

If a feature does not exist yet, do not build it fully unless it is a small guard/state/helper needed to make the current flow coherent.

---

# Part 1: Retail Flow Audit

Audit current Retail flow end-to-end.

Check:

## Entry Flow

* User selects Retail from `/select-mode`.
* Correct mode ID is stored: `retail`.
* User is redirected to correct Retail dashboard/workspace.
* Refresh keeps valid mode.
* Invalid mode redirects safely.
* Old `warehouse` value does not become active runtime mode.
* Old `fnb` value does not affect Retail.
* Old `service` value does not affect Retail.
* `custom-business` planned mode does not reuse Retail UI.

## Route Flow

* Direct Retail route works when selected mode is `retail`.
* Direct Retail route redirects safely when no mode is selected.
* Direct Retail route redirects safely when selected mode is `restaurant`.
* Direct Retail route redirects safely when selected mode is `raw-material`.
* Direct Retail route redirects safely when selected mode is `custom-business`.
* `next` param behavior is safe and predictable if used.
* No active route should use old/legacy mode naming.

## Navigation Flow

* Sidebar shows only Retail-relevant modules.
* Sidebar order matches canonical registry.
* Sidebar role permissions match actual access.
* No Restaurant/Raw Material/Custom Business modules leak into Retail.
* No FNB/Warehouse/Service active labels appear.
* Unsupported Retail features are hidden, disabled, or marked planned.

## Data Flow

* Product data loads safely.
* Product category data loads safely if present.
* Stock data loads safely.
* Sales/order data loads safely if present.
* Payment data loads safely if present.
* Customer data loads safely if present.
* Empty states are handled.
* API error states are handled.
* Malformed API envelope is handled.
* Slow loading state is handled if applicable.
* Duplicate submit is prevented where there are forms/actions.

---

# Part 2: Retail Edge Cases

Add guards, states, and validation for these edge cases where the current app supports the flow:

1. No products.
2. No categories.
3. No customers.
4. No transactions/orders.
5. Product out of stock.
6. Product below minimum stock.
7. Product deleted/unavailable while selected.
8. Category deleted/unavailable.
9. Invalid quantity.
10. Quantity is zero.
11. Quantity exceeds stock.
12. Invalid price.
13. Invalid discount/tax if supported.
14. Empty cart checkout.
15. Duplicate checkout submit.
16. Payment missing.
17. Payment failed.
18. Payment already paid.
19. Unsupported payment method.
20. Refund/return unsupported but visible.
21. API returns empty array.
22. API returns error envelope.
23. API returns malformed envelope.
24. User opens Retail route with wrong selected mode.
25. User refreshes after selecting Retail.
26. User manually sets `currentBusinessMode` to `warehouse`.
27. User manually sets `currentBusinessMode` to `retail`.
28. User manually sets `currentBusinessMode` to invalid random string.
29. Planned Custom Business must not reuse Retail UI.
30. Retail shared dashboard must not show Restaurant/Raw Material copy.

Do not create fake UI just to claim edge cases are handled.
Use real guards, empty states, validation, and safe fallbacks.

---

# Part 3: Retail Prisma / Database Alignment

Inspect Prisma schema and backend models related to Retail.

Check whether Retail currently has proper persistence for:

* retail business/store entity if separate from generic business
* products
* product categories
* SKUs/barcodes if present
* product variants if present
* stock level
* stock movement
* sales transactions/orders
* cart/checkout if persisted
* payments
* customers
* discounts/tax/settings
* refunds/returns if present
* audit logs
* ownership/tenant/business scope

If Prisma models already exist:

* verify API/services use them correctly
* verify frontend types match backend response
* verify request schemas match database constraints
* verify nullable fields are handled
* verify ownership/tenant filtering exists if applicable
* verify role checks match operations

If Prisma models do not exist but Retail frontend pretends data is real:

* do not add a massive schema blindly
* document the mismatch
* add Prisma only if necessary to make Retail mode coherent and testable
* keep schema changes minimal and scoped
* explain every Prisma change

Allowed Prisma alignment only if needed:

* product/category relation correction
* stock movement relation correction
* order/payment status enum correction
* missing relation needed by existing Retail flow
* nullable field correction if current API already depends on it
* minimal retail transaction model only if current active Retail UI claims persisted transaction support and no equivalent exists

Rules:

* Do not break Restaurant or Raw Material schema.
* Do not rename broad shared models without strong reason.
* Do not create destructive migrations.
* Do not add nullable chaos just to make things pass.
* Do not add schema fields that are not used by current Retail flow.
* If migration is required, document exact command and risk.
* If environment cannot run Prisma generate/migrate, report it honestly.

---

# Part 4: Retail Backend/API Hardening

Audit and improve backend/API only for Retail-related flow.

Check:

## API Design

* endpoints match frontend calls
* endpoint names match behavior
* request payload matches frontend
* response shape matches frontend
* response envelope is consistent
* status codes are correct
* errors are safe

## Validation

* route params validated
* body validated
* product ID validated
* category ID validated
* quantity validated
* price validated
* stock movement type validated
* payment method/status validated
* discount/tax validated if present
* customer ID validated if present

## Security / Guarding

* no invalid mode accepted
* no old `warehouse` or `service` mode accepted as active API mode
* no client mode trusted blindly
* ownership/tenant filter exists if architecture has owner/business/store IDs
* role permission checks exist where role system applies
* unsafe internal errors are not leaked

## Service Structure

* route handler should not contain too much business logic
* repeated mapper logic should be extracted
* repeated response/error logic should use shared helper if already available
* checkout/sale creation should be consistent
* stock movement writes should be consistent
* payment update logic should be consistent
* audit log write should be consistent if used

Do not rewrite all backend.
Only harden Retail-related backend/API.

---

# Part 5: Retail Shared Dashboard Wiring

Wire Retail mode into shared dashboards according to existing shared dashboard context.

Inspect shared dashboards such as:

* Sales Analytics
* Customers & Partners
* Inventory Management
* Cashflow
* Financial Reports
* Invoice Generator
* Shift Cashier Reports
* Team Management
* Employee Performance
* Approvals
* Audit Log
* Platform Monitoring
* Any shared dashboard registry/module system

For each shared dashboard, decide Retail behavior:

1. Supported and useful for Retail
2. Supported but with Retail-specific labels/data mapping
3. Not supported and should be hidden/disabled for Retail
4. Planned only and should show clear state

Expected examples:

## Sales Analytics

Retail should likely be supported if sales/order data exists.
It should show:

* sales revenue
* transaction count
* average transaction value
* top products
* product/category performance
* payment totals if available

## Inventory Management

Retail should likely be supported.
It should show:

* product stock
* low stock
* out of stock
* stock movement
* SKU/barcode/product context if available

## Cashflow

Retail may be supported if payment/sales data exists.
It should show:

* cash/card/QRIS/transfer revenue
* refunds if available
* daily sales cashflow
* not Restaurant table/order copy

## Financial Reports

Retail may be supported if revenue/cost/margin data exists.
It should not fake profit if cost/margin data is missing.
If only revenue exists, label it clearly as revenue summary.

## Invoice Generator

Retail may support receipt/invoice generation if sales/payment data exists.
Do not show Restaurant table copy or Raw Material supplier invoice copy.

## Shift Cashier Reports

Retail may be supported if cashier shift exists.
If not wired, hide or mark planned.

## Customers & Partners

Retail may map to customers/loyalty/buyers if customer entity exists.
If no customer entity, hide or show limited context.

Rules:

* Do not show Restaurant/Raw Material dashboard copy in Retail.
* Do not fake data.
* Do not wire unsupported dashboards just to make sidebar full.
* Shared dashboard visibility must be mode-aware.
* Shared dashboard labels must be context-aware.
* Shared dashboard empty states must be context-aware.
* Retail should only see dashboards that make business sense.

If a shared dashboard needs mode-specific adapter:

* create a clean adapter/helper
* keep adapter config typed
* do not hardcode mode checks everywhere
* avoid giant switch statements inside UI components

---

# Part 6: Retail Guarding, Limiting, and Permissions

Tighten access control for Retail.

Audit:

* route guard
* sidebar visibility
* feature visibility
* role permissions
* planned/unsupported dashboard visibility
* direct URL access
* API access if backend has auth/roles

Expected role examples if shared role system exists:

* OWNER: broad access
* MANAGER: broad operational access, maybe limited settings
* CASHIER: cashier/checkout/payment access
* STAFF: inventory/product access if present
* ADMIN-like roles only if already present

Rules:

* unsupported Retail features should not appear as active.
* role-limited modules should be hidden or disabled consistently.
* direct route access should not bypass UI guard.
* backend should still validate mutations.
* shared dashboards must check whether Retail supports them.
* planned features should be clearly marked, not broken.
* do not copy Restaurant/Raw Material permission assumptions into Retail.

If role system exists:

* define which roles can access Retail modules.
* align sidebar role permissions with backend role permissions where possible.
* if uncertain, use conservative access and document it.

---

# Part 7: Retail File Structure Cleanup

Clean Retail folder structure.

Preferred structure:

```txt
features/retail/
  components/
    dashboard/
    products/
    inventory/
    checkout/
    transactions/
    payments/
    customers/
    shared/
  hooks/
  services/
  schemas/
  types/
  utils/
  constants/
  config/
```

Only create folders that are actually used.

Move files if needed:

* components into `components`
* local hooks into `hooks`
* API clients/services into `services`
* Zod/form schemas into `schemas`
* domain types into `types`
* formatting/domain helpers into `utils`
* labels/status/routes/config into `config` or `constants`

Rules:

* no giant dumping file
* no vague `utils.ts` if domain-specific
* no `warehouse` naming in active Retail runtime
* no `placeholder` naming if file is active production route
* no Restaurant/Raw Material logic inside Retail
* no Retail-specific logic inside global shared unless truly shared

If `retail-interactive-workspace.tsx` is active runtime and still large:

* rename it if the name is misleading
* split it into smaller files
* remove demo/interactive wording unless it is truly preview/demo-only
* preserve behavior

---

# Part 8: Retail Fat File Split

Identify and split Retail fat files.

Known candidate:

* `retail-interactive-workspace.tsx`

Also search for other large Retail files.

For each fat file:

1. identify responsibilities
2. extract constants
3. extract helper functions
4. extract child components
5. extract hooks if stateful logic is reusable
6. extract schemas/types if useful
7. update imports
8. preserve visible behavior
9. run Retail typecheck

Extraction examples:

* `retail-workspace.tsx`
* `retail-dashboard-header.tsx`
* `retail-metric-cards.tsx`
* `retail-product-grid.tsx`
* `retail-product-table.tsx`
* `retail-cart-panel.tsx`
* `retail-checkout-summary.tsx`
* `retail-inventory-table.tsx`
* `retail-low-stock-alerts.tsx`
* `retail-payment-panel.tsx`
* `retail-empty-state.tsx`
* `retail-status-badge.tsx`
* `retail-stock.helpers.ts`
* `retail-price.helpers.ts`
* `retail-dashboard-metrics.ts`
* `retail-routes.config.ts`

Do not over-split into tiny useless files.

---

# Part 9: Retail Naming Cleanup

Canonical naming:

* Mode ID: `retail`
* User label: `Retail`
* Folder: `features/retail`
* Route slug: keep existing canonical route if docs define it, otherwise use consistent V3 route
* Type name examples:

  * `RetailMode`
  * `RetailProduct`
  * `RetailCategory`
  * `RetailCartItem`
  * `RetailTransaction`
  * `RetailPayment`
  * `RetailStockMovement`

Avoid:

* `warehouse` as active name
* `service`
* `fnb`
* `restaurant` naming in Retail files unless comparing mode boundaries
* `raw-material` naming in Retail files unless comparing mode boundaries
* `placeholder` for active workspace
* `interactive` if file is active production route and not demo-specific
* `data.ts`
* `helper.ts`
* `utils.ts`
* `temp`
* `old`
* `final`

Rename misleading files/functions/variables.

After renaming:

* update imports
* update docs
* run Retail typecheck

---

# Part 10: Retail Hardcode and Duplicate Cleanup

Remove Retail hardcodes and repeated logic.

Centralize repeated:

* Retail route paths
* Retail module IDs
* Retail dashboard labels
* product status labels
* stock status labels
* stock movement labels
* payment method labels
* payment status labels
* transaction status labels if present
* low-stock threshold logic
* price/currency formatting
* empty state copy if repeated
* API endpoints if repeated
* table column configs if repeated
* card metric configs if repeated

Do not centralize one-off text.

Avoid scattered checks like:

```ts
mode === "retail"
path.includes("retail")
status === "LOW_STOCK"
paymentStatus === "PAID"
quantity <= 0
```

Prefer typed helpers/configs when repeated:

```ts
isRetailMode(mode)
RETAIL_ROUTES
RETAIL_STOCK_STATUS_CONFIG
getRetailStockStatus()
formatRetailPrice()
canRetailRoleAccessModule()
```

---

# Part 11: Frontend Polish for Retail

Polish Retail UI.

Focus:

* dashboard clarity
* product list/table readability
* product category/filter/search clarity
* cart clarity
* checkout summary clarity
* payment state clarity
* inventory stock visibility
* low-stock/out-of-stock visibility
* transaction history clarity
* empty states
* loading states
* error states
* form validation messages
* disabled states
* duplicate submit prevention
* responsive layout
* consistent badges
* consistent buttons
* context-aware shared dashboard copy

Do not redesign the whole app.
Polish existing UI so Retail feels intentional and operational.

---

# Part 12: Tests and Verification

Run Retail-specific checks first.

Try pnpm if available:

```bash
pnpm --filter @workspace/pos-system run typecheck:retail
pnpm retail:check
pnpm business-mode:check
```

If pnpm is blocked by `EPERM lstat C:\Users\LENOVO`, use local commands:

```bash
tsc -p artifacts/pos-system/tsconfig.retail.json --noEmit
```

Also run:

```bash
cd artifacts/pos-system
vite build
```

Run backend check if backend touched:

```bash
tsc -p artifacts/api-server/tsconfig.json --noEmit
```

Run Prisma checks only if Prisma touched:

```bash
npx prisma validate
npx prisma generate
```

If Prisma commands are blocked by environment:

* report the exact issue
* do not claim they passed

Run business mode switch check:

```bash
node scripts/business-mode-switch-check.mjs
```

Run sidebar parity if Retail navigation/sidebar/module registry was touched.

Important:

* do not claim full frontend typecheck passed if it times out
* separate passed/failed/blocked/timed-out checks
* separate pre-existing issues from issues caused by this phase

---

# Part 13: Manual QA Checklist

Provide exact manual QA steps for Retail.

Must include:

## Mode selection

1. Open `/select-mode`.
2. Select Retail.
3. Confirm selected mode is stored as `retail`.
4. Confirm app redirects to Retail dashboard/workspace.
5. Refresh and confirm Retail stays active.

## Invalid mode

1. Clear `currentBusinessMode`.
2. Open Retail route directly.
3. Confirm safe redirect.
4. Set `currentBusinessMode` to `warehouse`.
5. Refresh and confirm it does not become active runtime mode.
6. Set `currentBusinessMode` to `retail`.
7. Refresh and confirm it works.
8. Set random invalid value.
9. Confirm safe redirect.

## Retail workspace

1. Open Retail dashboard/workspace.
2. Check product list.
3. Check category/filter/search if present.
4. Check inventory/stock section.
5. Check cart/checkout section if present.
6. Check payment section if present.
7. Check transaction/order section if present.
8. Check empty states.
9. Check loading/error state if possible.
10. Try invalid quantity if form exists.
11. Try duplicate submit if form exists.
12. Confirm no Restaurant/Raw Material copy appears.
13. Confirm no FNB/Warehouse/Service active label appears.

## Product/stock flow

1. Open product list.
2. Check available products.
3. Check out-of-stock product.
4. Check low-stock state if present.
5. Try quantity greater than stock if checkout exists.
6. Confirm stock labels are clear.

## Checkout/payment flow

1. Add product to cart if supported.
2. Change quantity.
3. Remove product.
4. Try empty checkout.
5. Select payment method if supported.
6. Submit checkout if supported.
7. Try duplicate submit.
8. Confirm success/error behavior.

## Shared dashboards

1. Open each shared dashboard visible in Retail.
2. Confirm dashboard is relevant to Retail.
3. Confirm unsupported dashboards are hidden, disabled, or show not-applicable/planned state.
4. Confirm copy uses product/sales/inventory/payment context where appropriate.
5. Confirm no Restaurant/Raw Material-only metric appears as Retail data.

---

# Part 14: Documentation

Update or create:

```txt
docs/v3-phase-6a-retail-hardening.md
```

Include:

* Retail current scope
* supported Retail modules
* planned/unsupported modules
* shared dashboard wiring decisions
* Prisma/backend decisions
* folder structure changes
* helpers/components created
* commands run
* remaining risks
* manual QA checklist

Update existing docs if they become outdated.

Docs must not claim Retail supports a dashboard or backend feature that does not exist.

---

## Strict Rules

1. Work only on Retail mode unless shared infrastructure is required.
2. Do not globally refactor Restaurant/Raw Material.
3. Do not change Raw Material Phase 4B persistence decisions.
4. Do not change Restaurant Phase 5B operational decisions.
5. Do not implement full Custom Business / Service.
6. Do not reintroduce `warehouse` as active runtime mode.
7. Do not reintroduce `fnb`.
8. Do not treat `service` as active mode.
9. Do not use `any`, `as any`, `as unknown as`, `@ts-ignore`, or `@ts-expect-error`.
10. Do not create fake compatibility bridges.
11. Do not add Prisma schema unless Retail genuinely needs it.
12. Do not create destructive database migrations.
13. Do not make shared dashboards show fake Retail data.
14. Do not show unsupported dashboards as active features.
15. Do not leave placeholder/demo/interactive naming on active Retail runtime files unless honestly documented.
16. Do not leave fat Retail files untouched without a clear reason.
17. Do not create giant `utils.ts`.
18. Do not move Retail-specific code into shared unless truly shared.
19. Do not let shared code import from Retail.
20. Do not centralize one-off values.
21. Do not delete useful logic.
22. Do not silently skip checks.
23. Do not claim checks passed unless they passed.
24. Do not push, commit, branch, or PR.

---

# Final Report Format

Return this exact report:

# Phase 6A Retail Report

## 1. Summary

## 2. Docs read

## 3. Retail audit

* files inspected
* routes inspected
* backend/API inspected
* shared dashboards inspected
* Prisma inspected

## 4. Flow fixes

* mode selection
* route guard
* sidebar/navigation
* data loading
* product flow
* stock flow
* checkout/payment flow
* transaction/order flow
* edge cases

## 5. Shared dashboard wiring

For each shared dashboard:

* supported / unsupported / planned
* behavior
* files changed
* reason

## 6. Prisma/database changes

* changed or not changed
* reason
* migration/generate status
* risks

## 7. Backend/API changes

* files changed
* validation changes
* response/error handling
* security/ownership/role checks
* product/stock/checkout/payment handling
* remaining risks

## 8. Frontend/UI changes

* files changed
* components split
* polish made
* loading/empty/error states
* remaining risks

## 9. Structure and naming changes

For each moved/renamed file:

* old path
* new path
* reason

## 10. Helpers/configs/components created

For each:

* file path
* purpose
* where used

## 11. Hardcoded/duplicate cleanup

* what was removed
* what was centralized
* why

## 12. Files deleted

For each:

* path
* why safe to delete

## 13. Commands run

For each:

* command
* passed/failed/blocked/timed out
* notes

## 14. Manual QA checklist

## 15. Remaining risks

## 16. Next recommended task

Give only one next task.

Tambahan galak di paling atas prompt:

```txt
This phase is incomplete if the final report does not prove Retail-specific inspection across products, stock, checkout/payment, shared dashboards, backend/API, Prisma, route guards, and file structure.
```

Dan ini buat mencegah kerja kosmetik doang:

```txt
Do not return a successful Phase 6A report if Retail fat files, demo/interactive runtime naming, product/stock edge cases, checkout/payment flow, and shared dashboard relevance were only mentioned but not actually inspected.
```
