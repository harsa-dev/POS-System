# Shared Inventory Mode Framework

This document records the backend upgrade that prepares shared inventory for multiple business modes without pretending every mode is already fully implemented.

## Backend API checklist used

From `docs/04-backend-api.md`, inventory backend changes should follow this checklist:

1. Route reads request only.
2. Route resolves authenticated user.
3. Route resolves business context.
4. Route calls service/policy layer.
5. Route returns standard `successResponse` / `handleApiError` output.
6. Route does not own heavy business rules.
7. Route does not own transaction logic.
8. Route does not duplicate permission logic.
9. Route does not mutate stock directly.
10. Backend validates business rules instead of trusting frontend state.

## New backend capability endpoint

```txt
GET /api/inventory-capabilities
```

Returns current business inventory policy:

```ts
type InventoryCapabilitiesResponse = {
  businessId: string;
  restaurantId: string;
  businessMode: string;
  policy: InventoryModePolicy;
};
```

## Current policy registry

```txt
services/inventory/inventory.mode-policy.ts
```

Supported policy keys:

```txt
restaurant
retail
service
livestock
```

Current production mode remains Restaurant. Other modes are framework-ready only.

## Why this exists

Inventory is a shared module, but different business models use inventory differently:

- Restaurant uses ingredient and recipe-backed stock.
- Retail needs SKU-oriented sellable stock later.
- Service businesses need supplies/tools/consumables.
- Livestock businesses need feed, medicine, tools, and barn supplies.

The policy registry gives frontend and future backend workflows a single place to ask:

```txt
What kind of inventory behavior does this business mode support?
```

## Guardrails

1. Do not add random `if businessMode` checks across routes.
2. Use `getInventoryModePolicy()` when frontend/backend needs mode capability information.
3. Do not claim unsupported modes are production-ready.
4. Do not change schema casually just to make policy prettier.
5. Keep Restaurant mode stable before expanding other modes.
6. Keep legacy `restaurantId` scope until migration is planned.
7. Keep stock mutations inside movement workflow.
8. Keep policy additive and backward-compatible.

## Frontend usage later

Frontend inventory dashboard should call:

```txt
GET /api/inventory-capabilities
GET /api/inventory-dashboard
```

Then it can decide labels, visible cards, action names, and unsupported feature states from the policy instead of hardcoding one Restaurant-only dashboard forever.
