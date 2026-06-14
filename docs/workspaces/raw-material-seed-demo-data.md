# Raw Material Demo Seed Data

Status: implemented.

This document records the Retail-style Raw Material Phase 4 seed lane.

## Goal

Provide deterministic demo data for active `RAW_MATERIAL` businesses.

This makes Raw Material summary, list hydration, workflow preview, and future smoke tests easier to validate without hand-inserting records.

## Implemented files

```txt
artifacts/api-server/scripts/seed-raw-material-demo-data.ts
artifacts/api-server/package.json
```

## Command

```bash
pnpm --filter @workspace/api-server run raw-material:seed
```

The script loads `.env` from the API server working directory before importing Prisma.

## Scope

The script seeds every active business with:

```txt
Business.mode = RAW_MATERIAL
Business.isActive = true
```

If no active Raw Material business exists, the script exits safely and prints:

```txt
No active RAW_MATERIAL business found. Create/select a Raw Material business first.
```

## Seeded data

Per active Raw Material business:

```txt
3 suppliers
3 storage locations
3 intakes
3 weighings
3 batches
1 planned processing run
2 kandang pens
3 initial receiving stock movements
```

## Suppliers

```txt
Nusantara Feed Mills
Agro Prima Commodities
Cold Chain Protein Supply
```

These cover feed-grade raw material, grain/raw goods, and cold-chain protein supply.

## Storage locations

```txt
RM-DRY-01   Feed Dry Storage          DRY
RM-COLD-01  Protein Cold Holding      COLD
RM-KDG-01   Kandang Support Rack      KANDANG_SUPPORT
```

Storage `usedKg` is seeded to match demo batch quantities:

```txt
RM-DRY-01   5,550 kg
RM-COLD-01  980 kg
RM-KDG-01   0 kg
```

## Intakes and weighings

```txt
RMI-DEMO-FEED-001      Broiler Starter Feed
RMI-DEMO-CORN-001      Ground Corn
RMI-DEMO-PROTEIN-001   Protein Meal
```

Each intake has a matching weighing record:

```txt
RMW-DEMO-FEED-001
RMW-DEMO-CORN-001
RMW-DEMO-PROTEIN-001
```

## Batches

```txt
RMB-DEMO-FEED-001      3,150 kg accepted
RMB-DEMO-CORN-001      2,400 kg accepted
RMB-DEMO-PROTEIN-001   980 kg accepted
```

All seeded batches are active and accepted.

## Processing run

```txt
RMP-DEMO-MIX-001
```

The processing run is seeded as `PLANNED` only.

No stock is consumed by the seed script.

## Kandang pens

```txt
KDG-A01   Starter Flock A   STABLE
KDG-B01   Grower Flock B    MONITORING
```

Both pens reference active accepted KG batches as feed batches.

## Stock movements

Each seeded batch gets one deterministic receiving movement:

```txt
type    = IN
reason  = RECEIVING
source  = INTAKE
```

These records provide initial ledger visibility for dashboards and smoke tests.

## Idempotency

The script uses deterministic IDs:

```txt
raw-material-${businessId}-${seedId}
```

It also uses PostgreSQL `ON CONFLICT` for stable upsert behavior.

Re-running the script updates the same demo rows instead of creating duplicates.

## Non-goals

```txt
No Prisma schema change.
No migration.
No frontend change.
No generated API client change.
No stock workflow execution through service routes.
No non-Raw-Material data mutation.
```

## Validation

Run:

```bash
pnpm --filter @workspace/api-server run raw-material:seed
```

Then inspect:

```txt
GET /raw-material/summary
GET /raw-material/suppliers
GET /raw-material/storage-locations
GET /raw-material/intakes
GET /raw-material/batches
GET /raw-material/pens
GET /raw-material/stock-movements
```

## Next lane

Proceed to:

```txt
Raw Material Phase 8F - scoped smoke test + CI gate
```

or, if UI hydration is preferred first:

```txt
Raw Material Phase 7C - workflow read delegate
Raw Material Phase 5 - frontend list/workflow API wiring
```
