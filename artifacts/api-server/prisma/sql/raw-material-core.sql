-- Idempotent Raw Material core database baseline.
-- This file is intentionally executed through raw-material:db:apply via prisma db execute.
-- Keep scoped repair SQL out of Prisma migration history.

ALTER TYPE "BusinessType" ADD VALUE IF NOT EXISTS 'RAW_MATERIAL';
ALTER TYPE "BusinessMode" ADD VALUE IF NOT EXISTS 'RAW_MATERIAL';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RawMaterialSupplierCategory') THEN
    CREATE TYPE "RawMaterialSupplierCategory" AS ENUM ('FEED', 'LIVESTOCK', 'PACKAGING', 'RAW_GOODS');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RawMaterialStorageType') THEN
    CREATE TYPE "RawMaterialStorageType" AS ENUM ('DRY', 'COLD', 'OPEN_YARD', 'KANDANG_SUPPORT');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RawMaterialUnit') THEN
    CREATE TYPE "RawMaterialUnit" AS ENUM ('KG', 'SACK', 'CRATE', 'HEAD', 'LITER', 'PCS');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RawMaterialIntakeStatus') THEN
    CREATE TYPE "RawMaterialIntakeStatus" AS ENUM ('DRAFT', 'INSPECTION', 'ACCEPTED', 'PARTIALLY_REJECTED', 'REJECTED', 'CANCELLED');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RawMaterialBatchQualityStatus') THEN
    CREATE TYPE "RawMaterialBatchQualityStatus" AS ENUM ('INSPECTION', 'ACCEPTED', 'REJECTED', 'QUARANTINED');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RawMaterialProcessingStatus') THEN
    CREATE TYPE "RawMaterialProcessingStatus" AS ENUM ('PLANNED', 'RUNNING', 'COMPLETED', 'CANCELLED');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RawMaterialKandangHealthStatus') THEN
    CREATE TYPE "RawMaterialKandangHealthStatus" AS ENUM ('STABLE', 'MONITORING', 'CRITICAL');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RawMaterialStockMovementType') THEN
    CREATE TYPE "RawMaterialStockMovementType" AS ENUM ('IN', 'OUT', 'ADJUSTMENT', 'TRANSFER_IN', 'TRANSFER_OUT', 'PRODUCTION_USAGE', 'WASTE', 'CORRECTION');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RawMaterialStockMovementReason') THEN
    CREATE TYPE "RawMaterialStockMovementReason" AS ENUM ('PURCHASE', 'RECEIVING', 'MANUAL_ADJUSTMENT', 'STOCK_COUNT', 'CORRECTION', 'TRANSFER_IN', 'TRANSFER_OUT', 'PRODUCTION_USAGE', 'WASTE', 'DAMAGED', 'EXPIRED', 'RETURN');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RawMaterialStockMovementSource') THEN
    CREATE TYPE "RawMaterialStockMovementSource" AS ENUM ('MANUAL', 'INTAKE', 'BATCH', 'PROCESSING_RUN', 'TRANSFER', 'STOCK_COUNT', 'SYSTEM');
  END IF;
END $$;

ALTER TYPE "RawMaterialSupplierCategory" ADD VALUE IF NOT EXISTS 'FEED';
ALTER TYPE "RawMaterialSupplierCategory" ADD VALUE IF NOT EXISTS 'LIVESTOCK';
ALTER TYPE "RawMaterialSupplierCategory" ADD VALUE IF NOT EXISTS 'PACKAGING';
ALTER TYPE "RawMaterialSupplierCategory" ADD VALUE IF NOT EXISTS 'RAW_GOODS';

ALTER TYPE "RawMaterialStorageType" ADD VALUE IF NOT EXISTS 'DRY';
ALTER TYPE "RawMaterialStorageType" ADD VALUE IF NOT EXISTS 'COLD';
ALTER TYPE "RawMaterialStorageType" ADD VALUE IF NOT EXISTS 'OPEN_YARD';
ALTER TYPE "RawMaterialStorageType" ADD VALUE IF NOT EXISTS 'KANDANG_SUPPORT';

ALTER TYPE "RawMaterialUnit" ADD VALUE IF NOT EXISTS 'KG';
ALTER TYPE "RawMaterialUnit" ADD VALUE IF NOT EXISTS 'SACK';
ALTER TYPE "RawMaterialUnit" ADD VALUE IF NOT EXISTS 'CRATE';
ALTER TYPE "RawMaterialUnit" ADD VALUE IF NOT EXISTS 'HEAD';
ALTER TYPE "RawMaterialUnit" ADD VALUE IF NOT EXISTS 'LITER';
ALTER TYPE "RawMaterialUnit" ADD VALUE IF NOT EXISTS 'PCS';

ALTER TYPE "RawMaterialIntakeStatus" ADD VALUE IF NOT EXISTS 'DRAFT';
ALTER TYPE "RawMaterialIntakeStatus" ADD VALUE IF NOT EXISTS 'INSPECTION';
ALTER TYPE "RawMaterialIntakeStatus" ADD VALUE IF NOT EXISTS 'ACCEPTED';
ALTER TYPE "RawMaterialIntakeStatus" ADD VALUE IF NOT EXISTS 'PARTIALLY_REJECTED';
ALTER TYPE "RawMaterialIntakeStatus" ADD VALUE IF NOT EXISTS 'REJECTED';
ALTER TYPE "RawMaterialIntakeStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';

ALTER TYPE "RawMaterialBatchQualityStatus" ADD VALUE IF NOT EXISTS 'INSPECTION';
ALTER TYPE "RawMaterialBatchQualityStatus" ADD VALUE IF NOT EXISTS 'ACCEPTED';
ALTER TYPE "RawMaterialBatchQualityStatus" ADD VALUE IF NOT EXISTS 'REJECTED';
ALTER TYPE "RawMaterialBatchQualityStatus" ADD VALUE IF NOT EXISTS 'QUARANTINED';

ALTER TYPE "RawMaterialProcessingStatus" ADD VALUE IF NOT EXISTS 'PLANNED';
ALTER TYPE "RawMaterialProcessingStatus" ADD VALUE IF NOT EXISTS 'RUNNING';
ALTER TYPE "RawMaterialProcessingStatus" ADD VALUE IF NOT EXISTS 'COMPLETED';
ALTER TYPE "RawMaterialProcessingStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';

ALTER TYPE "RawMaterialKandangHealthStatus" ADD VALUE IF NOT EXISTS 'STABLE';
ALTER TYPE "RawMaterialKandangHealthStatus" ADD VALUE IF NOT EXISTS 'MONITORING';
ALTER TYPE "RawMaterialKandangHealthStatus" ADD VALUE IF NOT EXISTS 'CRITICAL';

ALTER TYPE "RawMaterialStockMovementType" ADD VALUE IF NOT EXISTS 'IN';
ALTER TYPE "RawMaterialStockMovementType" ADD VALUE IF NOT EXISTS 'OUT';
ALTER TYPE "RawMaterialStockMovementType" ADD VALUE IF NOT EXISTS 'ADJUSTMENT';
ALTER TYPE "RawMaterialStockMovementType" ADD VALUE IF NOT EXISTS 'TRANSFER_IN';
ALTER TYPE "RawMaterialStockMovementType" ADD VALUE IF NOT EXISTS 'TRANSFER_OUT';
ALTER TYPE "RawMaterialStockMovementType" ADD VALUE IF NOT EXISTS 'PRODUCTION_USAGE';
ALTER TYPE "RawMaterialStockMovementType" ADD VALUE IF NOT EXISTS 'WASTE';
ALTER TYPE "RawMaterialStockMovementType" ADD VALUE IF NOT EXISTS 'CORRECTION';

ALTER TYPE "RawMaterialStockMovementReason" ADD VALUE IF NOT EXISTS 'PURCHASE';
ALTER TYPE "RawMaterialStockMovementReason" ADD VALUE IF NOT EXISTS 'RECEIVING';
ALTER TYPE "RawMaterialStockMovementReason" ADD VALUE IF NOT EXISTS 'MANUAL_ADJUSTMENT';
ALTER TYPE "RawMaterialStockMovementReason" ADD VALUE IF NOT EXISTS 'STOCK_COUNT';
ALTER TYPE "RawMaterialStockMovementReason" ADD VALUE IF NOT EXISTS 'CORRECTION';
ALTER TYPE "RawMaterialStockMovementReason" ADD VALUE IF NOT EXISTS 'TRANSFER_IN';
ALTER TYPE "RawMaterialStockMovementReason" ADD VALUE IF NOT EXISTS 'TRANSFER_OUT';
ALTER TYPE "RawMaterialStockMovementReason" ADD VALUE IF NOT EXISTS 'PRODUCTION_USAGE';
ALTER TYPE "RawMaterialStockMovementReason" ADD VALUE IF NOT EXISTS 'WASTE';
ALTER TYPE "RawMaterialStockMovementReason" ADD VALUE IF NOT EXISTS 'DAMAGED';
ALTER TYPE "RawMaterialStockMovementReason" ADD VALUE IF NOT EXISTS 'EXPIRED';
ALTER TYPE "RawMaterialStockMovementReason" ADD VALUE IF NOT EXISTS 'RETURN';

ALTER TYPE "RawMaterialStockMovementSource" ADD VALUE IF NOT EXISTS 'MANUAL';
ALTER TYPE "RawMaterialStockMovementSource" ADD VALUE IF NOT EXISTS 'INTAKE';
ALTER TYPE "RawMaterialStockMovementSource" ADD VALUE IF NOT EXISTS 'BATCH';
ALTER TYPE "RawMaterialStockMovementSource" ADD VALUE IF NOT EXISTS 'PROCESSING_RUN';
ALTER TYPE "RawMaterialStockMovementSource" ADD VALUE IF NOT EXISTS 'TRANSFER';
ALTER TYPE "RawMaterialStockMovementSource" ADD VALUE IF NOT EXISTS 'STOCK_COUNT';
ALTER TYPE "RawMaterialStockMovementSource" ADD VALUE IF NOT EXISTS 'SYSTEM';

CREATE TABLE IF NOT EXISTS "RawMaterialSupplier" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "contactPerson" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "address" TEXT,
  "category" "RawMaterialSupplierCategory" NOT NULL DEFAULT 'RAW_GOODS',
  "reliabilityScore" INTEGER NOT NULL DEFAULT 0,
  "leadTimeDays" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RawMaterialSupplier_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RawMaterialSupplier_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "RawMaterialStorageLocation" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" "RawMaterialStorageType" NOT NULL DEFAULT 'DRY',
  "capacityKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "usedKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "temperatureCelsius" DOUBLE PRECISION,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RawMaterialStorageLocation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RawMaterialStorageLocation_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "RawMaterialIntake" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "referenceNumber" TEXT NOT NULL,
  "supplierId" TEXT NOT NULL,
  "targetStorageLocationId" TEXT NOT NULL,
  "materialName" TEXT NOT NULL,
  "unit" "RawMaterialUnit" NOT NULL DEFAULT 'KG',
  "receivedQuantity" DOUBLE PRECISION NOT NULL,
  "acceptedQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "rejectedQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "qualityStatus" "RawMaterialIntakeStatus" NOT NULL DEFAULT 'INSPECTION',
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RawMaterialIntake_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RawMaterialIntake_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "RawMaterialIntake_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "RawMaterialSupplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "RawMaterialIntake_targetStorageLocationId_fkey" FOREIGN KEY ("targetStorageLocationId") REFERENCES "RawMaterialStorageLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "RawMaterialWeighing" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "referenceNumber" TEXT NOT NULL,
  "intakeId" TEXT NOT NULL,
  "stationName" TEXT NOT NULL,
  "grossKg" DOUBLE PRECISION NOT NULL,
  "tareKg" DOUBLE PRECISION NOT NULL,
  "netKg" DOUBLE PRECISION NOT NULL,
  "operatorName" TEXT NOT NULL,
  "measuredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RawMaterialWeighing_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RawMaterialWeighing_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "RawMaterialWeighing_intakeId_fkey" FOREIGN KEY ("intakeId") REFERENCES "RawMaterialIntake"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "RawMaterialBatch" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "lotCode" TEXT NOT NULL,
  "intakeId" TEXT NOT NULL,
  "storageLocationId" TEXT NOT NULL,
  "materialName" TEXT NOT NULL,
  "unit" "RawMaterialUnit" NOT NULL DEFAULT 'KG',
  "quantity" DOUBLE PRECISION NOT NULL,
  "remainingQuantity" DOUBLE PRECISION NOT NULL,
  "qualityStatus" "RawMaterialBatchQualityStatus" NOT NULL DEFAULT 'INSPECTION',
  "expiryDate" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RawMaterialBatch_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RawMaterialBatch_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "RawMaterialBatch_intakeId_fkey" FOREIGN KEY ("intakeId") REFERENCES "RawMaterialIntake"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "RawMaterialBatch_storageLocationId_fkey" FOREIGN KEY ("storageLocationId") REFERENCES "RawMaterialStorageLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "RawMaterialProcessingRun" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "runNumber" TEXT NOT NULL,
  "inputBatchId" TEXT NOT NULL,
  "outputName" TEXT NOT NULL,
  "inputQuantity" DOUBLE PRECISION NOT NULL,
  "outputQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "byproductQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "wasteQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "status" "RawMaterialProcessingStatus" NOT NULL DEFAULT 'PLANNED',
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RawMaterialProcessingRun_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RawMaterialProcessingRun_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "RawMaterialProcessingRun_inputBatchId_fkey" FOREIGN KEY ("inputBatchId") REFERENCES "RawMaterialBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "RawMaterialKandangPen" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "flockName" TEXT NOT NULL,
  "capacity" INTEGER NOT NULL DEFAULT 0,
  "occupancy" INTEGER NOT NULL DEFAULT 0,
  "feedBatchId" TEXT,
  "healthStatus" "RawMaterialKandangHealthStatus" NOT NULL DEFAULT 'STABLE',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RawMaterialKandangPen_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RawMaterialKandangPen_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "RawMaterialKandangPen_feedBatchId_fkey" FOREIGN KEY ("feedBatchId") REFERENCES "RawMaterialBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "RawMaterialStockMovement" (
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
  "beforeQuantity" DOUBLE PRECISION NOT NULL,
  "afterQuantity" DOUBLE PRECISION NOT NULL,
  "note" TEXT,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RawMaterialStockMovement_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RawMaterialStockMovement_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "RawMaterialStockMovement_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "RawMaterialBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "RawMaterialStockMovement_sourceStorageLocationId_fkey" FOREIGN KEY ("sourceStorageLocationId") REFERENCES "RawMaterialStorageLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "RawMaterialStockMovement_targetStorageLocationId_fkey" FOREIGN KEY ("targetStorageLocationId") REFERENCES "RawMaterialStorageLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "RawMaterialStockMovement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "RawMaterialSupplier_businessId_name_key" ON "RawMaterialSupplier"("businessId", "name");
CREATE INDEX IF NOT EXISTS "RawMaterialSupplier_businessId_idx" ON "RawMaterialSupplier"("businessId");
CREATE INDEX IF NOT EXISTS "RawMaterialSupplier_category_idx" ON "RawMaterialSupplier"("category");
CREATE INDEX IF NOT EXISTS "RawMaterialSupplier_isActive_idx" ON "RawMaterialSupplier"("isActive");
CREATE INDEX IF NOT EXISTS "RawMaterialSupplier_reliabilityScore_idx" ON "RawMaterialSupplier"("reliabilityScore");

CREATE UNIQUE INDEX IF NOT EXISTS "RawMaterialStorageLocation_businessId_code_key" ON "RawMaterialStorageLocation"("businessId", "code");
CREATE INDEX IF NOT EXISTS "RawMaterialStorageLocation_businessId_idx" ON "RawMaterialStorageLocation"("businessId");
CREATE INDEX IF NOT EXISTS "RawMaterialStorageLocation_type_idx" ON "RawMaterialStorageLocation"("type");
CREATE INDEX IF NOT EXISTS "RawMaterialStorageLocation_isActive_idx" ON "RawMaterialStorageLocation"("isActive");
CREATE INDEX IF NOT EXISTS "RawMaterialStorageLocation_usedKg_idx" ON "RawMaterialStorageLocation"("usedKg");
CREATE INDEX IF NOT EXISTS "RawMaterialStorageLocation_capacityKg_idx" ON "RawMaterialStorageLocation"("capacityKg");

CREATE UNIQUE INDEX IF NOT EXISTS "RawMaterialIntake_businessId_referenceNumber_key" ON "RawMaterialIntake"("businessId", "referenceNumber");
CREATE INDEX IF NOT EXISTS "RawMaterialIntake_businessId_idx" ON "RawMaterialIntake"("businessId");
CREATE INDEX IF NOT EXISTS "RawMaterialIntake_supplierId_idx" ON "RawMaterialIntake"("supplierId");
CREATE INDEX IF NOT EXISTS "RawMaterialIntake_targetStorageLocationId_idx" ON "RawMaterialIntake"("targetStorageLocationId");
CREATE INDEX IF NOT EXISTS "RawMaterialIntake_qualityStatus_idx" ON "RawMaterialIntake"("qualityStatus");
CREATE INDEX IF NOT EXISTS "RawMaterialIntake_receivedAt_idx" ON "RawMaterialIntake"("receivedAt");
CREATE INDEX IF NOT EXISTS "RawMaterialIntake_materialName_idx" ON "RawMaterialIntake"("materialName");

CREATE UNIQUE INDEX IF NOT EXISTS "RawMaterialWeighing_businessId_referenceNumber_key" ON "RawMaterialWeighing"("businessId", "referenceNumber");
CREATE INDEX IF NOT EXISTS "RawMaterialWeighing_businessId_idx" ON "RawMaterialWeighing"("businessId");
CREATE INDEX IF NOT EXISTS "RawMaterialWeighing_intakeId_idx" ON "RawMaterialWeighing"("intakeId");
CREATE INDEX IF NOT EXISTS "RawMaterialWeighing_stationName_idx" ON "RawMaterialWeighing"("stationName");
CREATE INDEX IF NOT EXISTS "RawMaterialWeighing_operatorName_idx" ON "RawMaterialWeighing"("operatorName");
CREATE INDEX IF NOT EXISTS "RawMaterialWeighing_measuredAt_idx" ON "RawMaterialWeighing"("measuredAt");
CREATE INDEX IF NOT EXISTS "RawMaterialWeighing_netKg_idx" ON "RawMaterialWeighing"("netKg");

CREATE UNIQUE INDEX IF NOT EXISTS "RawMaterialBatch_businessId_lotCode_key" ON "RawMaterialBatch"("businessId", "lotCode");
CREATE INDEX IF NOT EXISTS "RawMaterialBatch_businessId_idx" ON "RawMaterialBatch"("businessId");
CREATE INDEX IF NOT EXISTS "RawMaterialBatch_intakeId_idx" ON "RawMaterialBatch"("intakeId");
CREATE INDEX IF NOT EXISTS "RawMaterialBatch_storageLocationId_idx" ON "RawMaterialBatch"("storageLocationId");
CREATE INDEX IF NOT EXISTS "RawMaterialBatch_qualityStatus_idx" ON "RawMaterialBatch"("qualityStatus");
CREATE INDEX IF NOT EXISTS "RawMaterialBatch_expiryDate_idx" ON "RawMaterialBatch"("expiryDate");
CREATE INDEX IF NOT EXISTS "RawMaterialBatch_isActive_idx" ON "RawMaterialBatch"("isActive");
CREATE INDEX IF NOT EXISTS "RawMaterialBatch_materialName_idx" ON "RawMaterialBatch"("materialName");

CREATE UNIQUE INDEX IF NOT EXISTS "RawMaterialProcessingRun_businessId_runNumber_key" ON "RawMaterialProcessingRun"("businessId", "runNumber");
CREATE INDEX IF NOT EXISTS "RawMaterialProcessingRun_businessId_idx" ON "RawMaterialProcessingRun"("businessId");
CREATE INDEX IF NOT EXISTS "RawMaterialProcessingRun_inputBatchId_idx" ON "RawMaterialProcessingRun"("inputBatchId");
CREATE INDEX IF NOT EXISTS "RawMaterialProcessingRun_status_idx" ON "RawMaterialProcessingRun"("status");
CREATE INDEX IF NOT EXISTS "RawMaterialProcessingRun_startedAt_idx" ON "RawMaterialProcessingRun"("startedAt");
CREATE INDEX IF NOT EXISTS "RawMaterialProcessingRun_completedAt_idx" ON "RawMaterialProcessingRun"("completedAt");
CREATE INDEX IF NOT EXISTS "RawMaterialProcessingRun_outputName_idx" ON "RawMaterialProcessingRun"("outputName");

CREATE UNIQUE INDEX IF NOT EXISTS "RawMaterialKandangPen_businessId_code_key" ON "RawMaterialKandangPen"("businessId", "code");
CREATE INDEX IF NOT EXISTS "RawMaterialKandangPen_businessId_idx" ON "RawMaterialKandangPen"("businessId");
CREATE INDEX IF NOT EXISTS "RawMaterialKandangPen_feedBatchId_idx" ON "RawMaterialKandangPen"("feedBatchId");
CREATE INDEX IF NOT EXISTS "RawMaterialKandangPen_healthStatus_idx" ON "RawMaterialKandangPen"("healthStatus");
CREATE INDEX IF NOT EXISTS "RawMaterialKandangPen_isActive_idx" ON "RawMaterialKandangPen"("isActive");
CREATE INDEX IF NOT EXISTS "RawMaterialKandangPen_flockName_idx" ON "RawMaterialKandangPen"("flockName");

CREATE INDEX IF NOT EXISTS "RawMaterialStockMovement_businessId_idx" ON "RawMaterialStockMovement"("businessId");
CREATE INDEX IF NOT EXISTS "RawMaterialStockMovement_batchId_idx" ON "RawMaterialStockMovement"("batchId");
CREATE INDEX IF NOT EXISTS "RawMaterialStockMovement_sourceStorageLocationId_idx" ON "RawMaterialStockMovement"("sourceStorageLocationId");
CREATE INDEX IF NOT EXISTS "RawMaterialStockMovement_targetStorageLocationId_idx" ON "RawMaterialStockMovement"("targetStorageLocationId");
CREATE INDEX IF NOT EXISTS "RawMaterialStockMovement_type_idx" ON "RawMaterialStockMovement"("type");
CREATE INDEX IF NOT EXISTS "RawMaterialStockMovement_reason_idx" ON "RawMaterialStockMovement"("reason");
CREATE INDEX IF NOT EXISTS "RawMaterialStockMovement_source_idx" ON "RawMaterialStockMovement"("source");
CREATE INDEX IF NOT EXISTS "RawMaterialStockMovement_sourceId_idx" ON "RawMaterialStockMovement"("sourceId");
CREATE INDEX IF NOT EXISTS "RawMaterialStockMovement_createdAt_idx" ON "RawMaterialStockMovement"("createdAt");
CREATE INDEX IF NOT EXISTS "RawMaterialStockMovement_businessId_type_idx" ON "RawMaterialStockMovement"("businessId", "type");
CREATE INDEX IF NOT EXISTS "RawMaterialStockMovement_businessId_reason_idx" ON "RawMaterialStockMovement"("businessId", "reason");
CREATE INDEX IF NOT EXISTS "RawMaterialStockMovement_businessId_source_idx" ON "RawMaterialStockMovement"("businessId", "source");
CREATE INDEX IF NOT EXISTS "RawMaterialStockMovement_source_sourceId_idx" ON "RawMaterialStockMovement"("source", "sourceId");
