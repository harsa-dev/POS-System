# Raw Material Typecheck Cleanup

Status: implemented.

This document records Phase 7 of the Raw Material backend phase plan.

## Goal

Confirm that the Raw Material backend lane compiles cleanly against generated Prisma types and keep global non-Raw-Material errors out of this lane.

## Scope

Included:

```txt
artifacts/api-server/src/routes/raw-material.ts
artifacts/api-server/src/routes/raw-material-pens.ts
artifacts/api-server/src/routes/raw-material-processing.ts
artifacts/api-server/src/routes/raw-material-stock-movements.ts
artifacts/api-server/src/routes/raw-material-summary.ts
artifacts/api-server/src/services/raw-material/
```

Excluded:

```txt
artifacts/api-server/src/routes/misc.ts
artifacts/api-server/src/services/financial-reports/
artifacts/api-server/src/services/inventory/
artifacts/api-server/src/services/orders/
artifacts/api-server/src/services/retail/
artifacts/api-server/src/services/sales-analytics/
```

Those files still belong to separate cleanup lanes.

## Raw Material issues resolved before this checkpoint

### Pen health status export mismatch

Problem:

```txt
src/routes/raw-material-pens.ts imported RawMaterialPenHealthStatus from services/raw-material/index.js,
but the barrel did not export the type.
```

Resolution:

```txt
raw-material-pens.ts imports RawMaterialPenHealthStatus directly from raw-material-pen.types.js.
```

### Batch quality status query mismatch

Problem:

```txt
src/routes/raw-material.ts passed query.qualityStatus as string | undefined,
but batch filtering expects RawMaterialBatchQualityStatus | undefined.
```

Resolution:

```txt
raw-material-batch.repository.ts normalizes query qualityStatus into the Prisma enum before applying it to where.
```

### Audit client cast mismatch

Problem:

```txt
src/services/raw-material/raw-material.audit.ts cast PrismaClient directly to RawMaterialAuditClient.
```

Resolution:

```txt
The default audit client now casts through unknown before RawMaterialAuditClient.
```

## Service export surface cleanup

File updated:

```txt
artifacts/api-server/src/services/raw-material/index.ts
```

Added stable exports for:

```txt
raw-material.permissions.ts
raw-material.audit.ts
raw-material.summary.ts
```

This keeps Raw Material public service imports stable without forcing routes or future modules to reach into private file paths.

## Local validation status

The user reported the Raw Material lane as safe after rerunning API server typecheck.

Remaining global typecheck errors are non-Raw-Material and intentionally out of scope for this phase.

## Non-goals

```txt
No Prisma schema change.
No migration.
No route behavior change.
No frontend contract change.
No non-Raw-Material fixes.
```

## Next phase

Proceed to Phase 8:

```txt
Stock mutation hardening.
```
