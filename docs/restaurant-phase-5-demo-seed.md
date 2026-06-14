# Restaurant Phase 5 - Demo Seed Data

Status: implemented
Scope owner: Restaurant business mode only

## Goal

Provide repeatable demo data for Restaurant workspace validation, dashboard preview, POS flow preview, kitchen queue, serving queue, table status, payment context, and cashflow-backed summaries.

The seed script is intentionally scoped to active `RESTAURANT` businesses. It does not create a business automatically.

## Command

```bash
pnpm --filter @workspace/api-server run restaurant:seed
```

Validate the backend Restaurant scope after changes:

```bash
pnpm --filter @workspace/api-server run typecheck:restaurant
```

## Implemented files

- `artifacts/api-server/scripts/seed-restaurant-demo-data.ts`
- `artifacts/api-server/package.json`
- `artifacts/api-server/tsconfig.restaurant.json`

## Seeded surfaces

The script seeds the following records per active Restaurant business:

- Restaurant profile settings.
- Categories: Coffee, Main Course, Dessert, Beverage.
- Inventory items: Arabica Beans, Fresh Milk, Chicken Breast, Rice, Chocolate Syrup, Takeaway Cup.
- Menu items: Hot Latte, Iced Mocha, Chicken Rice Bowl, Chocolate Pudding, Sparkling Water.
- Recipes linking menu items to inventory.
- Tables across available, occupied, cleaning, and reserved states.
- Orders across the Restaurant workflow:
  - `PENDING_PAYMENT`
  - `PAID`
  - `PREPARING`
  - `READY`
  - `SERVED`
  - `COMPLETED`
- Payment records for all seeded orders.
- Cashflow income entries for paid orders.

## Idempotency

The script uses deterministic IDs and conflict-safe updates.

Safe to rerun:

```bash
pnpm --filter @workspace/api-server run restaurant:seed
```

Seeded order items are refreshed for seeded order IDs only. The script does not clear user-created orders.

## Expected dashboard effect

After running the seed, these Restaurant endpoints should show non-empty data:

```text
GET /api/restaurant/dashboard
GET /api/restaurant/menu-items
GET /api/restaurant/tables
GET /api/restaurant/orders/active
GET /api/restaurant/kitchen
GET /api/restaurant/serving
GET /api/restaurant/shared-dashboard/overview
GET /api/restaurant/shared-dashboard/sales
GET /api/restaurant/shared-dashboard/inventory
GET /api/restaurant/shared-dashboard/cashflow
```

## Boundary

This phase does not implement write flows, cancellation, refund, OpenAPI generation, frontend API wiring, or smoke CI. Those remain planned in later phases.
