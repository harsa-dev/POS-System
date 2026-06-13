CREATE TYPE "RawMaterialBatchQualityStatus" AS ENUM ('INSPECTION', 'ACCEPTED', 'REJECTED', 'QUARANTINED');

CREATE TABLE "RawMaterialBatch" (
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
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RawMaterialBatch_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RawMaterialBatch_businessId_lotCode_key" ON "RawMaterialBatch"("businessId", "lotCode");
CREATE INDEX "RawMaterialBatch_businessId_idx" ON "RawMaterialBatch"("businessId");
CREATE INDEX "RawMaterialBatch_intakeId_idx" ON "RawMaterialBatch"("intakeId");
CREATE INDEX "RawMaterialBatch_storageLocationId_idx" ON "RawMaterialBatch"("storageLocationId");
CREATE INDEX "RawMaterialBatch_qualityStatus_idx" ON "RawMaterialBatch"("qualityStatus");
CREATE INDEX "RawMaterialBatch_expiryDate_idx" ON "RawMaterialBatch"("expiryDate");
CREATE INDEX "RawMaterialBatch_isActive_idx" ON "RawMaterialBatch"("isActive");
CREATE INDEX "RawMaterialBatch_materialName_idx" ON "RawMaterialBatch"("materialName");

ALTER TABLE "RawMaterialBatch"
  ADD CONSTRAINT "RawMaterialBatch_businessId_fkey"
  FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RawMaterialBatch"
  ADD CONSTRAINT "RawMaterialBatch_intakeId_fkey"
  FOREIGN KEY ("intakeId") REFERENCES "RawMaterialIntake"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "RawMaterialBatch"
  ADD CONSTRAINT "RawMaterialBatch_storageLocationId_fkey"
  FOREIGN KEY ("storageLocationId") REFERENCES "RawMaterialStorageLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
