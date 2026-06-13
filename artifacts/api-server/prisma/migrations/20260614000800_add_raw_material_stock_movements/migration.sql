CREATE TYPE "RawMaterialStockMovementType" AS ENUM (
  'IN',
  'OUT',
  'ADJUSTMENT',
  'TRANSFER_IN',
  'TRANSFER_OUT',
  'PRODUCTION_USAGE',
  'WASTE',
  'CORRECTION'
);

CREATE TYPE "RawMaterialStockMovementReason" AS ENUM (
  'BATCH_CREATION',
  'MANUAL_ADJUSTMENT',
  'TRANSFER',
  'PROCESSING_USAGE',
  'WASTE',
  'CORRECTION',
  'OPENING_BALANCE'
);

CREATE TYPE "RawMaterialStockMovementSource" AS ENUM (
  'MANUAL',
  'INTAKE',
  'BATCH',
  'PROCESSING_RUN',
  'TRANSFER',
  'SYSTEM'
);

CREATE TABLE "RawMaterialStockMovement" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "batchId" TEXT NOT NULL,
  "sourceStorageLocationId" TEXT,
  "targetStorageLocationId" TEXT,
  "type" "RawMaterialStockMovementType" NOT NULL,
  "reason" "RawMaterialStockMovementReason" NOT NULL DEFAULT 'MANUAL_ADJUSTMENT',
  "source" "RawMaterialStockMovementSource" NOT NULL DEFAULT 'MANUAL',
  "sourceId" TEXT,
  "quantity" DOUBLE PRECISION NOT NULL,
  "beforeQuantity" DOUBLE PRECISION,
  "afterQuantity" DOUBLE PRECISION,
  "note" TEXT,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "RawMaterialStockMovement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RawMaterialStockMovement_businessId_idx" ON "RawMaterialStockMovement"("businessId");
CREATE INDEX "RawMaterialStockMovement_batchId_idx" ON "RawMaterialStockMovement"("batchId");
CREATE INDEX "RawMaterialStockMovement_type_idx" ON "RawMaterialStockMovement"("type");
CREATE INDEX "RawMaterialStockMovement_reason_idx" ON "RawMaterialStockMovement"("reason");
CREATE INDEX "RawMaterialStockMovement_source_idx" ON "RawMaterialStockMovement"("source");
CREATE INDEX "RawMaterialStockMovement_sourceId_idx" ON "RawMaterialStockMovement"("sourceId");
CREATE INDEX "RawMaterialStockMovement_createdAt_idx" ON "RawMaterialStockMovement"("createdAt");
CREATE INDEX "RawMaterialStockMovement_sourceStorageLocationId_idx" ON "RawMaterialStockMovement"("sourceStorageLocationId");
CREATE INDEX "RawMaterialStockMovement_targetStorageLocationId_idx" ON "RawMaterialStockMovement"("targetStorageLocationId");
CREATE INDEX "RawMaterialStockMovement_businessId_type_idx" ON "RawMaterialStockMovement"("businessId", "type");
CREATE INDEX "RawMaterialStockMovement_businessId_reason_idx" ON "RawMaterialStockMovement"("businessId", "reason");
CREATE INDEX "RawMaterialStockMovement_source_sourceId_idx" ON "RawMaterialStockMovement"("source", "sourceId");

ALTER TABLE "RawMaterialStockMovement"
  ADD CONSTRAINT "RawMaterialStockMovement_businessId_fkey"
  FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RawMaterialStockMovement"
  ADD CONSTRAINT "RawMaterialStockMovement_batchId_fkey"
  FOREIGN KEY ("batchId") REFERENCES "RawMaterialBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "RawMaterialStockMovement"
  ADD CONSTRAINT "RawMaterialStockMovement_sourceStorageLocationId_fkey"
  FOREIGN KEY ("sourceStorageLocationId") REFERENCES "RawMaterialStorageLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "RawMaterialStockMovement"
  ADD CONSTRAINT "RawMaterialStockMovement_targetStorageLocationId_fkey"
  FOREIGN KEY ("targetStorageLocationId") REFERENCES "RawMaterialStorageLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "RawMaterialStockMovement"
  ADD CONSTRAINT "RawMaterialStockMovement_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
