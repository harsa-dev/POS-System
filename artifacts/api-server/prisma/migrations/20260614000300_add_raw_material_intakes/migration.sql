CREATE TYPE "RawMaterialUnit" AS ENUM ('KG', 'SACK', 'CRATE', 'HEAD', 'LITER', 'PCS');

CREATE TYPE "RawMaterialIntakeStatus" AS ENUM (
  'DRAFT',
  'INSPECTION',
  'ACCEPTED',
  'PARTIALLY_REJECTED',
  'REJECTED',
  'CANCELLED'
);

CREATE TABLE "RawMaterialIntake" (
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
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RawMaterialIntake_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RawMaterialIntake_businessId_referenceNumber_key"
  ON "RawMaterialIntake"("businessId", "referenceNumber");

CREATE INDEX "RawMaterialIntake_businessId_idx" ON "RawMaterialIntake"("businessId");
CREATE INDEX "RawMaterialIntake_supplierId_idx" ON "RawMaterialIntake"("supplierId");
CREATE INDEX "RawMaterialIntake_targetStorageLocationId_idx" ON "RawMaterialIntake"("targetStorageLocationId");
CREATE INDEX "RawMaterialIntake_qualityStatus_idx" ON "RawMaterialIntake"("qualityStatus");
CREATE INDEX "RawMaterialIntake_receivedAt_idx" ON "RawMaterialIntake"("receivedAt");
CREATE INDEX "RawMaterialIntake_materialName_idx" ON "RawMaterialIntake"("materialName");

ALTER TABLE "RawMaterialIntake"
  ADD CONSTRAINT "RawMaterialIntake_businessId_fkey"
  FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RawMaterialIntake"
  ADD CONSTRAINT "RawMaterialIntake_supplierId_fkey"
  FOREIGN KEY ("supplierId") REFERENCES "RawMaterialSupplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "RawMaterialIntake"
  ADD CONSTRAINT "RawMaterialIntake_targetStorageLocationId_fkey"
  FOREIGN KEY ("targetStorageLocationId") REFERENCES "RawMaterialStorageLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
