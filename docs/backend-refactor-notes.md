# Backend Refactor Notes

## Scope

This note tracks backend refactor work done after the Business tenant bridge phase.

The active target is still Restaurant / F&B mode. The backend is being cleaned toward a modular monolith structure, not split into microservices.

## Docs checked

Relevant docs reviewed before implementation:

- `docs/04-backend-api.md`
- `docs/06-auth-permissions.md`
- `docs/appendices/status-transitions.md`
- `docs/appendices/implementation-rules.md`
- `docs/appendices/anti-patterns.md`

## Implemented

- Added centralized permission registry using `scope.resource.action` keys.
- Added order status transition rules.
- Extracted order status transition workflow into `services/orders/transition-order-status.service.ts`.
- Added thin route handler in `routes/orders-status.ts`.
- Mounted `orders-status` before legacy `orders` route.
- Exported order services through `services/orders/index.ts`.

## Checklist alignment

- Route handler reads request, checks auth/context, calls service, and returns response.
- Service layer owns transition validation, stock mutation, table side effects, transaction coordination, audit log creation, and realtime broadcast.
- Status transition checks current status and next status.
- Permission check uses the centralized permission registry.
- Business scope comes from authenticated user context, not request body.
- Inventory stock mutation creates stock movement records.
- Audit log is created in the same transaction as the status update.

## Not removed yet

`routes/orders.ts` still contains the legacy `PATCH /orders/:id/status` handler.

The new `routes/orders-status.ts` route is mounted before `orders.ts`, so the new handler is active. The legacy block should be removed in a later local cleanup once the full file can be safely edited and typechecked.

## Next cleanup target

- Remove the legacy status route block from `routes/orders.ts`.
- Extract create-order workflow from `routes/orders.ts` into an order creation service.
- Keep legacy runtime statuses until a dedicated schema/data migration introduces the documented V3 status names.
