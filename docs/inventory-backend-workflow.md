# Inventory Backend Workflow

This document defines the backend contract for making the shared Inventory dashboard real and API-backed.

The current scope is backend-first. Frontend should consume these APIs instead of hardcoded inventory rows.

## Relevant Docs Checked

- `docs/04-backend-api.md`
- `docs/05-database-storage.md`
- `docs/06-auth-permissions.md`
- `docs/backend-structure.md`
- `docs/appendices/implementation-rules.md`

## Business Scope Rule

During the Business bridge phase:

```txt
businessContext.businessId = Business.id
businessContext.restaurantId = Restaurant.id
```

Inventory Prisma models still use `restaurantId`, so backend inventory queries and writes must use:

```ts
businessContext.restaurantId
```

Do not write `businessContext.businessId` into `InventoryItem.restaurantId`.

## Backend Endpoints

### `GET /api/inventory-dashboard`

Use this as the primary dashboard endpoint.

Returns:

```ts
type InventoryDashboardDto = {
  summary: {
    totalItems: number;
    lowStockItems: number;
    outOfStockItems: number;
    totalStockValue: number;
    ingredientItems: number;
    packagingItems: number;
    equipmentItems: number;
  };
  items: InventoryItemDto[];
  lowStockItems: InventoryItemDto[];
  recentMovements: StockMovement[];
};
```

Frontend should use this endpoint to replace hardcoded inventory dashboard rows.

### `GET /api/inventory-items`

Returns enriched inventory items.

Each item includes base Prisma fields plus:

```ts
type InventoryItemDto = {
  recipeCount: number;
  movementCount: number;
  stockStatus: "OUT_OF_STOCK" | "LOW_STOCK" | "IN_STOCK";
  isLowStock: boolean;
  isOutOfStock: boolean;
  stockValue: number;
};
```

This endpoint is still useful for dropdowns, recipe builders, and detailed inventory screens.

### `POST /api/inventory-items`

Creates a new inventory item.

Payload:

```ts
type CreateInventoryItemPayload = {
  name: string;
  sku?: string;
  type: "INGREDIENT" | "PACKAGING" | "EQUIPMENT";
  unit: "PCS" | "GRAM" | "KILOGRAM" | "LITER" | "ML" | "PACK" | "BOTTLE";
  openingStock?: number;
  currentStock?: number; // backward-compatible alias for openingStock
  minimumStock?: number;
  costPerUnit?: number;
};
```

Rules:

- `currentStock` is treated as opening stock only during creation.
- If opening stock is greater than zero, backend creates a `StockMovement` with type `IN`.
- Stock is never silently initialized without movement.
- Audit log is created.

### `PATCH /api/inventory-items/:id`

Updates item metadata.

Payload may include:

```ts
type UpdateInventoryItemPayload = {
  name?: string;
  sku?: string | null;
  type?: "INGREDIENT" | "PACKAGING" | "EQUIPMENT";
  unit?: "PCS" | "GRAM" | "KILOGRAM" | "LITER" | "ML" | "PACK" | "BOTTLE";
  minimumStock?: number;
  costPerUnit?: number;
  currentStock?: number;
};
```

Rules:

- Metadata update is allowed.
- `currentStock` is backward-compatible but converted into `ADJUSTMENT` movement.
- Backend creates audit log.
- Direct silent stock mutation is not allowed.

### `DELETE /api/inventory-items/:id`

Deletes an unused inventory item.

Rules:

- If item has recipes or stock movements, deletion is rejected with `409 CONFLICT`.
- This prevents accidental recipe breakage or stock history loss.

### `GET /api/inventory`

Lists stock movements.

Query params:

```ts
type ListStockMovementsQuery = {
  inventoryItemId?: string;
  limit?: number; // max 100
};
```

### `POST /api/inventory`

Creates a stock movement and updates current stock in one transaction.

Payload:

```ts
type CreateStockMovementPayload = {
  inventoryItemId: string;
  type: "IN" | "OUT" | "ADJUSTMENT";
  quantity: number;
  reason?:
    | "PURCHASE"
    | "RECIPE_USAGE"
    | "WASTE"
    | "EXPIRED"
    | "MANUAL_ADJUSTMENT"
    | "DAMAGED"
    | "RETURN";
  note?: string;
};
```

Rules:

- `IN` increases stock.
- `OUT` decreases stock.
- `ADJUSTMENT` sets stock to `quantity`.
- Stock cannot become negative.
- Movement and quantity update happen in one transaction.
- Audit log is created.

## Permission Rules

Backend uses permission keys:

```txt
shared.inventory.view
shared.inventory.adjust
```

Current MVP role map:

```txt
OWNER   -> view + adjust
MANAGER -> view + adjust
```

Other roles are rejected unless the permission map is intentionally changed.

## Frontend Wiring Plan

Frontend Inventory dashboard should stop using hardcoded rows.

Recommended frontend order:

1. Fetch `GET /api/inventory-dashboard`.
2. Map `items` into dashboard table rows.
3. Use `summary` for KPI cards.
4. Use `recentMovements` for movement/activity list.
5. Use `POST /api/inventory-items` for Add Item.
6. Use `POST /api/inventory` for Restock, Waste, Adjustment, and Manual Correction.
7. Disable or mark unsupported actions such as Import, Sync, and Advanced Analysis until backend support exists.

## Manual Smoke Test Checklist

1. Login as OWNER or MANAGER.
2. `GET /api/inventory-dashboard` returns summary/items/recentMovements.
3. `POST /api/inventory-items` with opening stock creates item + movement.
4. `GET /api/inventory` shows the opening stock movement.
5. `PATCH /api/inventory-items/:id` metadata update keeps stock stable.
6. `PATCH /api/inventory-items/:id` with `currentStock` creates adjustment movement.
7. `POST /api/inventory` with `IN` increases stock.
8. `POST /api/inventory` with `OUT` decreases stock.
9. `POST /api/inventory` rejects negative stock.
10. `DELETE /api/inventory-items/:id` rejects items with recipes or movements.
