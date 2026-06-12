# Inventory Backend Repository Note

A small repository helper file now exists under `services/inventory/inventory.repository.ts`.

It centralizes the legacy restaurant scope shape while the system is still in the Business bridge phase:

```ts
{ restaurantId: businessContext.restaurantId }
```

This keeps future inventory repository/service code from accidentally writing `Business.id` into legacy `restaurantId` columns.
