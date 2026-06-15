# V3 Phase 5B Restaurant Core Flow Hardening

## Status

Phase 5B hardens the active Restaurant operational flow without changing Retail, Raw Material, Custom Business, or Prisma schema.

## Operational Surface Classification

| Surface | Classification | Reason |
| --- | --- | --- |
| POS / cashier | Real and persisted with sample fallback | Active workspace reads Restaurant menu/tables/orders and creates Restaurant orders through `/api/restaurant/orders`. Static sample data is used only when reads fail before first load. |
| Menu items | Real and persisted | Restaurant menu workspace and POS menu catalog read backend menu items. Sellable POS items require availability, recipe, and stock readiness. |
| Categories | Real read-only in V3 workspace | Categories are derived from backend menu items in the active V3 menu workspace. Older feature modals still own category writes. |
| Cart | Local draft | Cart state stays local until submitted to the Restaurant order API. |
| Order creation | Real and persisted | POS checkout now submits through `restaurantClient.createOrder` using the Restaurant API payload contract. |
| Order list | Real read-only with status action for served completion | Orders workspace reads Restaurant active orders and allows only `SERVED -> COMPLETED`. |
| Order status transition | Real and persisted | Kitchen, serving, and completion actions use `restaurantClient.updateOrderStatus`. Backend transition guards remain source of truth. |
| Payment | Real for cash order payment; non-cash handoff partly external | Cash orders are created as paid by Restaurant backend. Non-cash orders create pending Restaurant orders and then request a payment link through the existing payment client. |
| Receipt / invoice | Planned / fallback dashboard context | Restaurant shared dashboard maps invoice surface to Restaurant receipt/payment context. Full receipt/invoice UX is not implemented in this phase. |
| Tables | Real and persisted | POS and table workspace read Restaurant tables. Dine-in checkout now blocks non-available tables in frontend and backend. |
| Table lock/status | Real and persisted | Restaurant order write marks assigned tables `OCCUPIED`; completion/cancellation moves dine-in tables to `CLEANING`; mark-clean uses existing table endpoint. |
| Kitchen / KDS | Real and persisted | Kitchen queue reads Restaurant queue and updates `PAID -> PREPARING -> READY`. |
| Serving | Real and persisted | Serving queue reads Restaurant queue and updates `READY -> SERVED`. |
| Shift cashier | Backend present, active workspace absent | Shift routes and cash effects exist, but no dedicated Restaurant V3 shift cashier workspace was added. |
| Inventory / recipe deduction | Real on paid Restaurant orders | Restaurant order write deducts recipe stock for paid orders and cancellation can restore stock. |
| Stock movement | Real backend behavior | Stock movements are created by Restaurant order write/cancellation services. |
| Settings / tax / service charge | Real backend; local POS preview uses static rates | Backend calculates final totals from settings. POS preview still displays local preview rates before submit. |
| Audit log | Real backend, no full viewer | Restaurant writes audit events for order, payment, workflow, cancellation, and reversal. |

## Decisions

- POS order creation now uses the canonical Restaurant API route instead of the generic legacy order route.
- POS open-order and table reads now use `restaurantClient` instead of generic order/table clients.
- Non-available dine-in tables are blocked before submit and rejected by backend write validation.
- Kitchen, serving, and order completion action targets now come from the Restaurant workspace status config.
- No Prisma schema changes were needed.
- Custom Business remains planned and guarded.

## Files Changed

- `artifacts/pos-system/src/app/workspace/restaurant/pos/pos-workspace-layout.tsx`
- `artifacts/pos-system/src/app/workspace/restaurant/pos/pos-order-payload.ts`
- `artifacts/pos-system/src/app/workspace/restaurant/pos/pos-order-draft.ts`
- `artifacts/pos-system/src/app/workspace/restaurant/pos/use-pos-tables.ts`
- `artifacts/pos-system/src/app/workspace/restaurant/pos/use-pos-open-orders.ts`
- `artifacts/pos-system/src/app/workspace/restaurant/pos/pos-table-status-panel.tsx`
- `artifacts/pos-system/src/app/workspace/restaurant/shared/restaurant-workspace-status.ts`
- `artifacts/pos-system/src/app/workspace/restaurant/kitchen/kitchen-orders-board.tsx`
- `artifacts/pos-system/src/app/workspace/restaurant/serving/serving-orders-board.tsx`
- `artifacts/pos-system/src/app/workspace/restaurant/orders/orders-workspace-board.tsx`
- `artifacts/api-server/src/routes/restaurant.ts`
- `artifacts/api-server/src/services/restaurant/restaurant.preview.ts`
- `artifacts/api-server/src/services/restaurant/restaurant.order-write.ts`

## Verification

Commands run:

- `pnpm --filter @workspace/pos-system run typecheck:restaurant` - blocked before repo script execution by `EPERM lstat C:\Users\LENOVO`.
- `pnpm restaurant:check` - blocked before repo script execution by `EPERM lstat C:\Users\LENOVO`.
- `pnpm business-mode:check` - blocked before repo script execution by `EPERM lstat C:\Users\LENOVO`.
- `tsc -p artifacts/pos-system/tsconfig.restaurant.json --noEmit` - passed.
- `tsc -p artifacts/api-server/tsconfig.json --noEmit` - passed.
- `node scripts/business-mode-switch-check.mjs` - passed.
- `vite build --config vite.config.ts` from `artifacts/pos-system` - passed with existing sourcemap warnings.

## Remaining Risks

- POS preview totals still use local static tax/service rates while backend final totals come from Restaurant settings.
- Non-cash payment still depends on the existing generic payment transaction client after Restaurant order creation.
- The older dashboard fallback components under `features/restaurant/core-system` still contain legacy generic API usage and should be consolidated after active V3 workspaces are stable.
- Restaurant shift cashier has backend routes but no dedicated V3 workspace.

## Manual QA Checklist

1. Open `/select-mode` and select Restaurant.
2. Open Restaurant POS.
3. Confirm menu, table snapshot, and open orders load.
4. Add a sellable menu item to cart.
5. Try checkout with an empty cart and confirm it is blocked.
6. Switch to dine-in and confirm occupied/reserved/cleaning tables cannot be selected.
7. Select an available table and submit a cash order.
8. Confirm the created order appears in open orders.
9. Confirm the selected table becomes occupied after refresh.
10. Open Kitchen workspace and move a paid order to preparing, then ready.
11. Open Serving workspace and move a ready order to served.
12. Open Orders workspace and complete a served order.
13. Confirm dine-in completion moves the table to cleaning.
14. Mark the cleaning table clean in Tables workspace.
15. Try invalid `currentBusinessMode` and old `fnb`; confirm safe canonical behavior.
