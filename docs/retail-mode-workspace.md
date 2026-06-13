# Retail Business Mode Workspace - POS System V3

## 0. Project Context

Project ini adalah POS System portfolio berbasis Next.js, TypeScript, Prisma, PostgreSQL, Tailwind, dan pnpm.

Status terakhir project:

- V2 sudah punya pondasi POS restaurant/F&B: cashier, KDS, serving, orders, payments, inventory, analytics, employees, settings.
- V3 mulai masuk ke architecture cleanup.
- Sudah ada business mode selection lewat `/select-mode`.
- Mode disimpan di `localStorage` dengan key `currentBusinessMode`.
- Route guard berada di `components/core/route-guard/business-mode.ts`.
- Struktur mulai dipisah menjadi:
  - `components/core`
  - `components/shared`
  - `features/fnb/core-system/...`
  - `features/shared/...`

Target dokumen ini: menyiapkan workspace untuk **Business Mode: Retail**, tanpa merusak F&B mode yang sudah ada.

---

## 1. Retail Mode Goal

Retail Mode adalah mode POS untuk toko barang fisik seperti:

- minimarket kecil
- toko sembako
- toko baju
- toko aksesoris
- toko elektronik kecil
- toko perlengkapan harian

Retail Mode tidak punya kitchen, serving, table, atau status masakan.

Retail Mode fokus pada:

- product catalog
- barcode/SKU
- inventory stock
- cashier checkout
- payment
- return/refund
- purchase/restock
- supplier
- sales analytics
- shift cashier
- invoice/receipt

---

## 2. Hard Boundary: Retail vs F&B

### F&B Mode punya:

- menu item
- recipe
- kitchen display system
- table management
- serving flow
- dining order status
- food preparation status

### Retail Mode punya:

- product item
- SKU/barcode
- category/brand
- supplier
- stock quantity
- purchase price
- selling price
- discount
- return/refund
- purchase/restock

### Rule penting

Jangan campur logic Retail ke folder F&B.

Tidak boleh:

```txt
features/fnb/core-system/retail
features/fnb/core-system/products-retail
features/fnb/core-system/cashier-retail
```

Harus:

```txt
features/retail/core-system/...
```

---

## 3. Recommended Folder Structure

```txt
src/
  app/
    (dashboard)/
      dashboard/
        retail/
          page.tsx
          cashier/
            page.tsx
          products/
            page.tsx
          inventory/
            page.tsx
          purchases/
            page.tsx
          suppliers/
            page.tsx
          returns/
            page.tsx
          reports/
            page.tsx
          settings/
            page.tsx

  features/
    retail/
      core-system/
        cashier/
          components/
          hooks/
          services/
          schemas/
          types.ts
          index.ts
        products/
          components/
          hooks/
          services/
          schemas/
          types.ts
          index.ts
        inventory/
          components/
          hooks/
          services/
          schemas/
          types.ts
          index.ts
        purchases/
          components/
          hooks/
          services/
          schemas/
          types.ts
          index.ts
        suppliers/
          components/
          hooks/
          services/
          schemas/
          types.ts
          index.ts
        returns/
          components/
          hooks/
          services/
          schemas/
          types.ts
          index.ts
        reports/
          components/
          hooks/
          services/
          schemas/
          types.ts
          index.ts
      shared/
        retail-navigation.ts
        retail-permissions.ts
        retail-constants.ts
        retail-utils.ts
```

---

## 4. Retail Navigation

Retail sidebar/dashboard menu should include:

1. Retail Dashboard
2. Cashier
3. Products
4. Inventory
5. Purchases / Restock
6. Suppliers
7. Returns / Refunds
8. Sales Reports
9. Shift Reports
10. Settings

Do not show F&B-only routes in Retail Mode:

- KDS
- Serving
- Tables
- Menu Recipe

---

## 5. Business Mode Config

Recommended business mode values:

```ts
export type BusinessMode = "fnb" | "retail" | "service" | "warehouse";
```

Retail mode metadata:

```ts
export const retailModeConfig = {
  id: "retail",
  label: "Retail Store",
  description: "POS mode for physical product stores, stock-based sales, suppliers, purchases, and returns.",
  defaultRoute: "/dashboard/retail",
  requiredModules: [
    "cashier",
    "products",
    "inventory",
    "purchases",
    "suppliers",
    "returns",
    "reports",
    "settings"
  ]
};
```

---

## 6. Retail User Roles

Reuse global roles where possible:

```txt
OWNER
MANAGER
CASHIER
STAFF
```

If current schema only has:

```txt
OWNER, MANAGER, CASHIER, KITCHEN, SERVER
```

Then do not immediately destroy the enum. Add Retail gradually.

Recommended next enum:

```prisma
enum Role {
  OWNER
  MANAGER
  CASHIER
  STAFF
  KITCHEN
  SERVER
}
```

Retail permission example:

| Module | OWNER | MANAGER | CASHIER | STAFF |
|---|---:|---:|---:|---:|
| Dashboard | Yes | Yes | Limited | Limited |
| Cashier | Yes | Yes | Yes | No |
| Products | Yes | Yes | View only | View only |
| Inventory | Yes | Yes | No | View only |
| Purchases | Yes | Yes | No | No |
| Suppliers | Yes | Yes | No | No |
| Returns | Yes | Yes | Limited | No |
| Reports | Yes | Yes | No | No |
| Settings | Yes | Limited | No | No |

---

## 7. Retail Core Business Flow

### 7.1 Product Setup Flow

```txt
Create Category
→ Create Supplier
→ Create Product
→ Add SKU/barcode
→ Set purchase price
→ Set selling price
→ Set stock quantity
→ Set low stock threshold
→ Product active
```

### 7.2 Cashier Sales Flow

```txt
Open Shift
→ Scan/Search Product
→ Add to Cart
→ Apply Discount if allowed
→ Select Payment Method
→ Confirm Payment
→ Reduce Stock
→ Generate Receipt
→ Save Sale Transaction
→ Update Cashflow/Sales Report
```

### 7.3 Restock Flow

```txt
Create Purchase/Restock Record
→ Select Supplier
→ Add Products
→ Input Quantity and Cost
→ Confirm Purchase
→ Increase Stock
→ Create Stock Movement
→ Update Inventory Valuation
```

### 7.4 Return/Refund Flow

```txt
Find Sale Transaction
→ Select Returned Item
→ Validate Return Eligibility
→ Input Return Reason
→ Refund Payment if needed
→ Restore Stock if item resellable
→ Create Return Record
→ Create Stock Movement
→ Update Sales Report
```

---

## 8. Retail Database Planning

Do not blindly rename existing F&B models unless necessary. Prefer adding retail-safe models or making existing product model more generic.

Recommended models:

```prisma
model RetailProduct {
  id              String   @id @default(cuid())
  restaurantId    String
  name            String
  sku             String?  @unique
  barcode         String?  @unique
  categoryId      String?
  supplierId      String?
  brand           String?
  purchasePrice   Decimal
  sellingPrice    Decimal
  stockQuantity   Int      @default(0)
  lowStockAlert   Int      @default(5)
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model RetailSupplier {
  id           String   @id @default(cuid())
  restaurantId String
  name         String
  phone        String?
  email        String?
  address      String?
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model RetailSale {
  id              String   @id @default(cuid())
  restaurantId    String
  cashierId       String
  shiftId         String?
  saleNumber      String   @unique
  subtotal        Decimal
  discountTotal   Decimal  @default(0)
  taxTotal        Decimal  @default(0)
  grandTotal      Decimal
  paymentStatus   PaymentStatus
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model RetailSaleItem {
  id             String  @id @default(cuid())
  saleId         String
  productId      String
  quantity       Int
  unitPrice      Decimal
  discountAmount Decimal @default(0)
  total          Decimal
}

model RetailPurchase {
  id           String   @id @default(cuid())
  restaurantId String
  supplierId   String?
  purchaseNo   String   @unique
  totalCost    Decimal
  status       PurchaseStatus
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model RetailReturn {
  id           String   @id @default(cuid())
  restaurantId String
  saleId       String
  reason       String
  refundAmount Decimal
  restock      Boolean  @default(true)
  createdAt    DateTime @default(now())
}
```

Recommended enum:

```prisma
enum PurchaseStatus {
  DRAFT
  RECEIVED
  CANCELLED
}
```

Important: use `Decimal` for money, not `Float`. Apparently currency deserves not being mangled by binary decimals. Shocking.

---

## 9. Retail API Contract

Recommended API routes:

```txt
GET    /api/retail/products
POST   /api/retail/products
GET    /api/retail/products/[id]
PATCH  /api/retail/products/[id]
DELETE /api/retail/products/[id]

GET    /api/retail/inventory
POST   /api/retail/inventory/adjustment
GET    /api/retail/inventory/movements

GET    /api/retail/suppliers
POST   /api/retail/suppliers
PATCH  /api/retail/suppliers/[id]

POST   /api/retail/sales
GET    /api/retail/sales
GET    /api/retail/sales/[id]

POST   /api/retail/purchases
GET    /api/retail/purchases
PATCH  /api/retail/purchases/[id]/receive

POST   /api/retail/returns
GET    /api/retail/returns

GET    /api/retail/reports/summary
GET    /api/retail/reports/sales
GET    /api/retail/reports/inventory
```

---

## 10. Retail MVP Scope

Build Retail Mode in phases.

### Phase 1 - Workspace & Navigation

Goal: Retail mode can be selected and routed safely.

Tasks:

- Add Retail to business mode config.
- Add `/dashboard/retail` route.
- Add retail sidebar navigation.
- Hide F&B-only routes when Retail Mode is active.
- Ensure route guard respects `currentBusinessMode`.

Done when:

- User can select Retail Mode.
- User lands on `/dashboard/retail`.
- Sidebar only shows retail modules.
- No KDS/Serving/Table appears in Retail Mode.

### Phase 2 - Retail Products

Goal: manage product catalog.

Tasks:

- Add product list UI.
- Add create/edit product form.
- Add SKU/barcode fields.
- Add purchase price and selling price.
- Add active/inactive status.

Done when:

- Product can be created.
- Product can be edited.
- Product appears in cashier search.

### Phase 3 - Retail Cashier

Goal: sell products and reduce stock.

Tasks:

- Add product search/cart.
- Add quantity update.
- Add subtotal/discount/tax/grand total.
- Add payment method.
- Create sale transaction.
- Reduce stock atomically.

Done when:

- Cashier can complete sale.
- Stock decreases correctly.
- Sale appears in report.

### Phase 4 - Inventory & Restock

Goal: stock movement is traceable.

Tasks:

- Add inventory overview.
- Add manual stock adjustment.
- Add purchase/restock form.
- Add supplier relation.
- Add stock movement history.

Done when:

- Restock increases stock.
- Adjustment creates stock movement.
- Low stock products are visible.

### Phase 5 - Return/Refund

Goal: sales can be reversed safely.

Tasks:

- Find sale by sale number.
- Select returned items.
- Add return reason.
- Restore stock if resellable.
- Save refund amount.

Done when:

- Return record is saved.
- Stock restoration is correct.
- Sales report subtracts return/refund.

---

## 11. Strict Rules for Codex / AI Agent

When implementing Retail Mode, follow these rules:

1. Do not break existing F&B mode.
2. Do not move F&B files unless necessary.
3. Do not create fake placeholder pages with no business logic unless the task is only navigation setup.
4. Do not hard-code business mode checks across random components.
5. Centralize mode config.
6. Centralize retail navigation.
7. Use TypeScript types strictly.
8. Use Zod schemas for form/API validation.
9. Use Prisma transaction for stock-changing operations.
10. Use `Decimal` for money fields.
11. Do not use temporary fixes to silence TypeScript errors.
12. Do not ignore build/typecheck errors.
13. If schema migration is needed, update Prisma schema and migration properly.
14. If a current model already supports the use case, reuse it carefully instead of duplicating blindly.
15. All stock changes must create stock movement/audit trail.
16. Sales, returns, and purchases must be traceable.

---

## 12. Codex Task Prompt - Retail Workspace Setup

Use this prompt for Codex:

```txt
You are working on a Next.js + TypeScript + Prisma + PostgreSQL POS System portfolio project.

Current architecture already has POS System V3 cleanup with business mode selection. The app stores selected business mode in localStorage using the key `currentBusinessMode`. There is an existing F&B/restaurant mode under `features/fnb/core-system/...`. There are also shared dashboards under `features/shared/...`.

Your task is to prepare the workspace for a new Business Mode: Retail.

Main goal:
Add Retail Mode as a clean second business mode without breaking existing F&B mode.

Important rules:
- Do not mix Retail logic into `features/fnb`.
- Create Retail-specific structure under `features/retail/core-system`.
- Keep shared UI primitives in `components/shared` if reusable.
- Keep app shell/sidebar/topbar in `components/core`.
- Do not create fake enterprise placeholders.
- Do not silence TypeScript errors with `any` unless absolutely necessary and justified.
- Do not use temporary hacks.
- Run build/typecheck after implementation and fix real errors properly.

Tasks:
1. Inspect the current project structure.
2. Locate business mode config, route guard, dashboard shell, and sidebar/navigation files.
3. Add `retail` as a valid business mode.
4. Add Retail Mode card/option in `/select-mode` if the mode selector exists.
5. Add Retail default route: `/dashboard/retail`.
6. Create route page: `src/app/(dashboard)/dashboard/retail/page.tsx`.
7. Create route placeholders only for immediate MVP modules:
   - `/dashboard/retail/cashier`
   - `/dashboard/retail/products`
   - `/dashboard/retail/inventory`
   - `/dashboard/retail/purchases`
   - `/dashboard/retail/suppliers`
   - `/dashboard/retail/returns`
   - `/dashboard/retail/reports`
   - `/dashboard/retail/settings`
8. Create feature folders:
   - `src/features/retail/core-system/cashier`
   - `src/features/retail/core-system/products`
   - `src/features/retail/core-system/inventory`
   - `src/features/retail/core-system/purchases`
   - `src/features/retail/core-system/suppliers`
   - `src/features/retail/core-system/returns`
   - `src/features/retail/core-system/reports`
9. Create `src/features/retail/shared/retail-navigation.ts`.
10. Ensure Retail Mode sidebar does not show F&B-only routes like KDS, Serving, Tables, or Menu Recipe.
11. Ensure F&B mode still works exactly as before.
12. Add clear TODO comments only where database/API implementation is intentionally deferred.
13. Run the project typecheck/build command used in this repo.
14. Fix all errors properly before finishing.

Expected result:
- Retail Mode can be selected.
- User can enter `/dashboard/retail`.
- Retail sidebar/navigation appears.
- F&B routes are not shown in Retail Mode.
- No existing F&B functionality is broken.
- Project passes typecheck/build.

After finishing, report:
- Files created
- Files modified
- Any schema/database changes made
- Build/typecheck result
- Remaining TODOs
```

---

## 13. Recommended First Commit

```bash
git checkout -b feature/retail-mode-workspace

git add .
git commit -m "feat: prepare retail business mode workspace"
```

Do not merge to main before:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

If the repo does not have `typecheck`, inspect `package.json` and use the available script. Do not invent commands and then act surprised when npm refuses to obey.

---

## 14. Implementation Priority

Priority order:

1. Mode config
2. Route guard compatibility
3. Sidebar/navigation
4. Retail dashboard page
5. Retail feature folder structure
6. Retail MVP module pages
7. Product model/API
8. Cashier flow
9. Stock movement
10. Return/refund

Do not start with UI polish. Pretty dashboards without business logic are just digital wallpaper.
