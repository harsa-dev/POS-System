# Ops Plane DB Foundation Phase

This phase prepares neutral database naming for the internal platform area.

Naming map:
- OpsPlane = internal platform area
- ROOT = top platform operator
- FINANCE = billing operator
- SUPPORT = support operator
- LedgerSnapshot = billing summary per business
- CaseItem = support item
- QueueItem = review queue item
- Signal = internal activity trail

The names are neutral on purpose, so they can be renamed later from one prefix.

## Planned Prisma models

- OpsPlaneProfile
- OpsPlaneScopeLink
- OpsPlaneSignal
- OpsPlaneQueueItem
- OpsPlaneCaseItem
- OpsPlaneLedgerSnapshot

## Relation targets

Existing User stays the human account source.
Existing Business stays the tenant source.
Existing Role enum stays business-scoped and must not receive platform values.

## Order

1. Add schema sync script.
2. Run schema sync locally.
3. Run Prisma generate.
4. Create migration locally.
5. Add read services.
6. Add server-side guards.
7. Add summary endpoints.

## Local commands

```bash
cd artifacts/api-server
pnpm tsx ./scripts/sync-ops-plane-prisma-schema.ts
pnpm prisma generate
pnpm prisma migrate dev --name add_ops_plane_foundation
```
