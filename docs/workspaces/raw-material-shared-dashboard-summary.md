# Raw Material Shared Dashboard Backend Summary

Status: implemented.

This document records Phase 6 of the Raw Material backend phase plan.

## Goal

Expose a read-only backend summary endpoint for Raw Material shared dashboards.

No Prisma schema change.
No migration.
No stock mutation.
No frontend contract change in this phase.

## Implemented files

```txt
artifacts/api-server/src/services/raw-material/raw-material.summary.ts
artifacts/api-server/src/routes/raw-material-summary.ts
artifacts/api-server/src/routes/index.ts
```

## Endpoint

```txt
GET /raw-material/summary
```

The route is registered through the main API router.

It uses:

```txt
requireBusinessMode(["raw-material"])
requireRawMaterialPermission(..., raw-material.view)
requireBusinessContextForRequest(...)
```

## Response source

```txt
api-server-prisma-raw-material-summary
```

## Summary sections

```txt
business
suppliers
storage
intakes
weighings
batches
processing
kandang
stockMovements
latestActivity
```

## Included metrics

### Suppliers

```txt
total
active
inactive
averageReliabilityScore
```

### Storage

```txt
activeLocations
capacityKg
usedKg
availableKg
usageRate
```

### Intakes

```txt
total
receivedQuantity
acceptedQuantity
rejectedQuantity
acceptanceRate
qualityDistribution
```

### Weighings

```txt
total
netKg
```

### Batches

```txt
total
active
quantity
remainingQuantity
consumedQuantity
nearExpiry
qualityDistribution
```

Near expiry is currently calculated as active batches expiring within 14 days.

### Processing

```txt
totalRuns
inputQuantity
outputQuantity
byproductQuantity
wasteQuantity
yieldRate
statusDistribution
```

### Kandang

```txt
totalPens
activePens
capacity
occupancy
occupancyRate
healthDistribution
```

### Stock movements

```txt
total
byType
byReason
latest
```

### Latest activity

The latest activity is selected from:

```txt
latest intake
latest batch update
latest processing run update
latest stock movement
```

## Non-goals

This phase does not:

```txt
change frontend shared dashboard bridge
change raw material API contract file
write dashboard-specific cache tables
add migrations
mutate stock
change existing CRUD endpoint behavior
```

Frontend API-first sync remains Phase 9.

## Next phase

Proceed to Phase 7:

```txt
Prisma delegate and typecheck cleanup.
```

Since scoped Raw Material typecheck errors were already fixed earlier, Phase 7 should focus on confirming the new summary endpoint and raw-material lane remain clean.
