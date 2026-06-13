# Raw Material Permission Hardening

Status: implemented.

This document records Phase 2 of the Raw Material backend phase plan.

## Goal

Replace broad `ALL_ROLES` route authorization with Raw Material action permissions.

No Prisma schema change.
No migration.
No stock behavior change.
No route response contract change.

## Permission helper

Implemented file:

```txt
artifacts/api-server/src/services/raw-material/raw-material.permissions.ts
```

Exports:

```txt
RAW_MATERIAL_PERMISSIONS
RawMaterialPermission
getRawMaterialPermissionRoles()
requireRawMaterialPermission()
```

## Permission keys

```txt
raw-material.view
raw-material.supplier.manage
raw-material.storage.manage
raw-material.intake.create
raw-material.intake.update
raw-material.weighing.record
raw-material.batch.manage
raw-material.processing.manage
raw-material.kandang.manage
raw-material.stock.adjust
raw-material.stock.transfer
raw-material.stock.consume
```

## Role groups

```txt
VIEW_ROLES      = OWNER, MANAGER, ADMIN, OPERATOR, STAFF, VIEWER
OPERATE_ROLES   = OWNER, MANAGER, ADMIN, OPERATOR, STAFF
STOCK_ROLES     = OWNER, MANAGER, ADMIN, OPERATOR
APPROVAL_ROLES  = OWNER, MANAGER, ADMIN
```

## Route mapping

### Core raw material routes

File:

```txt
artifacts/api-server/src/routes/raw-material.ts
```

Mapping:

```txt
GET    /raw-material/suppliers                    -> raw-material.view
POST   /raw-material/suppliers                    -> raw-material.supplier.manage
PATCH  /raw-material/suppliers/:id                -> raw-material.supplier.manage
DELETE /raw-material/suppliers/:id                -> raw-material.supplier.manage

GET    /raw-material/storage-locations            -> raw-material.view
POST   /raw-material/storage-locations            -> raw-material.storage.manage
PATCH  /raw-material/storage-locations/:id        -> raw-material.storage.manage
DELETE /raw-material/storage-locations/:id        -> raw-material.storage.manage

GET    /raw-material/intakes                      -> raw-material.view
POST   /raw-material/intakes                      -> raw-material.intake.create
PATCH  /raw-material/intakes/:id                  -> raw-material.intake.update
DELETE /raw-material/intakes/:id                  -> raw-material.intake.update

GET    /raw-material/weighings                    -> raw-material.view
POST   /raw-material/weighings                    -> raw-material.weighing.record
PATCH  /raw-material/weighings/:id                -> raw-material.weighing.record
DELETE /raw-material/weighings/:id                -> raw-material.weighing.record

GET    /raw-material/batches                      -> raw-material.view
POST   /raw-material/batches                      -> raw-material.batch.manage
PATCH  /raw-material/batches/:id                  -> raw-material.batch.manage
DELETE /raw-material/batches/:id                  -> raw-material.batch.manage
```

### Processing routes

File:

```txt
artifacts/api-server/src/routes/raw-material-processing.ts
```

Mapping:

```txt
GET   /raw-material/processing-runs               -> raw-material.view
POST  /raw-material/processing-runs               -> raw-material.processing.manage
PATCH /raw-material/processing-runs/:id           -> raw-material.processing.manage
POST  /raw-material/processing-runs/:id/cancel    -> raw-material.processing.manage
```

### Kandang pen routes

File:

```txt
artifacts/api-server/src/routes/raw-material-pens.ts
```

Mapping:

```txt
GET    /raw-material/pens                         -> raw-material.view
POST   /raw-material/pens                         -> raw-material.kandang.manage
PATCH  /raw-material/pens/:id                     -> raw-material.kandang.manage
DELETE /raw-material/pens/:id                     -> raw-material.kandang.manage
```

### Stock movement routes

File:

```txt
artifacts/api-server/src/routes/raw-material-stock-movements.ts
```

Mapping:

```txt
GET  /raw-material/stock-movements                    -> raw-material.view
POST /raw-material/stock-movements/adjust             -> raw-material.stock.adjust
POST /raw-material/stock-movements/transfer           -> raw-material.stock.transfer
POST /raw-material/stock-movements/consume-processing -> raw-material.stock.consume
```

## Notes

`raw-material.stock.adjust` is intentionally stricter than transfer and consumption.
Manual adjustment is mapped to `APPROVAL_ROLES` because it can arbitrarily change stock without operational source context.

`raw-material.batch.manage` and `raw-material.processing.manage` are mapped to `STOCK_ROLES` because batch and processing operations can affect inventory state and traceability.

Read endpoints remain available to VIEW_ROLES.

## Next phase

Proceed to Phase 3:

```txt
Workflow guards and domain invariants.
```

Focus:

```txt
intake status guards
batch quality guards
processing status guards
kandang health/feed guards
stock mutation guard helpers
```
