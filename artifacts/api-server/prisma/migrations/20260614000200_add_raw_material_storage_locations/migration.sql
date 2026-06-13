CREATE TYPE "RawMaterialStorageType" AS ENUM ('DRY', 'COLD', 'OPEN_YARD', 'KANDANG_SUPPORT');

CREATE TABLE "RawMaterialStorageLocation" (
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
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RawMaterialStorageLocation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RawMaterialStorageLocation_businessId_code_key" ON "RawMaterialStorageLocation"("businessId", "code");
CREATE INDEX "RawMaterialStorageLocation_businessId_idx" ON "RawMaterialStorageLocation"("businessId");
CREATE INDEX "RawMaterialStorageLocation_type_idx" ON "RawMaterialStorageLocation"("type");
CREATE INDEX "RawMaterialStorageLocation_isActive_idx" ON "RawMaterialStorageLocation"("isActive");
CREATE INDEX "RawMaterialStorageLocation_usedKg_idx" ON "RawMaterialStorageLocation"("usedKg");
CREATE INDEX "RawMaterialStorageLocation_capacityKg_idx" ON "RawMaterialStorageLocation"("capacityKg");

ALTER TABLE "RawMaterialStorageLocation"
  ADD CONSTRAINT "RawMaterialStorageLocation_businessId_fkey"
  FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
