-- Raw material supplier foundation.
-- This is intentionally limited to supplier master data only.

ALTER TYPE "BusinessType" ADD VALUE 'RAW_MATERIAL';
ALTER TYPE "BusinessMode" ADD VALUE 'RAW_MATERIAL';

CREATE TYPE "RawMaterialSupplierCategory" AS ENUM (
  'FEED',
  'LIVESTOCK',
  'PACKAGING',
  'RAW_GOODS'
);

CREATE TABLE "RawMaterialSupplier" (
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
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RawMaterialSupplier_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RawMaterialSupplier_businessId_name_key" ON "RawMaterialSupplier"("businessId", "name");
CREATE INDEX "RawMaterialSupplier_businessId_idx" ON "RawMaterialSupplier"("businessId");
CREATE INDEX "RawMaterialSupplier_category_idx" ON "RawMaterialSupplier"("category");
CREATE INDEX "RawMaterialSupplier_isActive_idx" ON "RawMaterialSupplier"("isActive");
CREATE INDEX "RawMaterialSupplier_reliabilityScore_idx" ON "RawMaterialSupplier"("reliabilityScore");

ALTER TABLE "RawMaterialSupplier"
  ADD CONSTRAINT "RawMaterialSupplier_businessId_fkey"
  FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
