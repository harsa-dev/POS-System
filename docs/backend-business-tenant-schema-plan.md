# Backend Business Tenant Schema Plan

## Goal

Prepare the backend schema for `businessId` without immediately renaming every existing `restaurantId` column.

The current database is restaurant-scoped. The next architecture should become business-scoped, where Restaurant is one business type, and future modules such as Retail, Service, or Livestock can share the same business tenant concept.

## Rule

Do not immediately rename all `restaurantId` columns to `businessId`.

That would touch too many operational tables at once:

- User
- Restaurant
- MenuItem
- Category
- InventoryItem
- Order
- Payment through Order
- Invoice
- DiningTable
- Shift
- Attendance
- AttendanceSetting
- AuditLog

Instead, use a bridge phase.

## Phase 1: Add Business model

Add this model near `Session` / `Restaurant` in `schema.prisma`:

```prisma
model Business {
  id        String       @id @default(cuid())
  name      String
  type      BusinessType @default(RESTAURANT)
  mode      BusinessMode @default(RESTAURANT)
  ownerId   String
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt

  owner      User        @relation("BusinessOwner", fields: [ownerId], references: [id], onDelete: Cascade)
  restaurant Restaurant?

  @@index([ownerId])
  @@index([type])
  @@index([mode])
}
```

Add this relation to `User`:

```prisma
ownedBusinesses Business[] @relation("BusinessOwner")
```

Add this bridge to `Restaurant`:

```prisma
businessId String? @unique
business   Business? @relation(fields: [businessId], references: [id], onDelete: SetNull)

@@index([businessId])
```

Add these enums:

```prisma
enum BusinessType {
  RESTAURANT
}

enum BusinessMode {
  RESTAURANT
}
```

## Phase 2: Backfill existing restaurants

After migration, create one Business row for each existing Restaurant and link `Restaurant.businessId`.

Use a small script instead of relying on fragile SQL matching by name.

Recommended script behavior:

1. Find all restaurants where `businessId` is null.
2. For each restaurant, create Business with:
   - name = restaurant.name
   - type = RESTAURANT
   - mode = RESTAURANT
   - ownerId = restaurant.ownerId
3. Update restaurant.businessId = business.id.

## Phase 3: New code rule

New backend code should use:

```ts
businessContext.businessId
```

Legacy database queries that still hit restaurant-scoped tables should use:

```ts
businessContext.restaurantId
```

or:

```ts
createRestaurantScopeWhere(businessContext)
```

## Phase 4: Later migration

Only after Restaurant and Retail are both stable, consider gradually moving shared tables from `restaurantId` to `businessId`.

Do this table by table, not all at once.

Suggested order:

1. AuditLog
2. InventoryItem
3. StockMovement through inventory relation
4. Invoice
5. Shift
6. Attendance
7. Menu/Product tables
8. Orders last

Orders should be last because they are the most workflow-sensitive table.
