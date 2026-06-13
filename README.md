# Business Scope Phase 2 Replacements

Apply after `business_scope_phase1_replacements.zip`.

Focus:
- remove backend `restaurantId` scope from operational routes
- move tables, shifts, payments, invoices, misc/settings/recipes, events, inventory scope to `businessId`
- remove cashflow repository/service `restaurantId` bridge
- keep roles general: OWNER, MANAGER, ADMIN, OPERATOR, STAFF, VIEWER
- no new limiting/quota/mode restriction layer

Run after overwrite:

```bash
cd artifacts/api-server
pnpm prisma generate
pnpm build
```

If build still fails, run a repo search for:
- `restaurantId`
- `restaurant`
- `CASHIER`
- `KITCHEN`
- `SERVER`

Next likely files:
- services/financial-reports/*
- services/sales-analytics/*
- services/inventory/* besides repository
- scripts/*
- frontend API DTOs/types
