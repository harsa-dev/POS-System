CREATE TYPE "RawMaterialKandangHealthStatus" AS ENUM ('STABLE', 'MONITORING', 'CRITICAL');

CREATE TABLE "RawMaterialKandangPen" (
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
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RawMaterialKandangPen_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RawMaterialKandangPen_businessId_code_key" ON "RawMaterialKandangPen"("businessId", "code");
CREATE INDEX "RawMaterialKandangPen_businessId_idx" ON "RawMaterialKandangPen"("businessId");
CREATE INDEX "RawMaterialKandangPen_feedBatchId_idx" ON "RawMaterialKandangPen"("feedBatchId");
CREATE INDEX "RawMaterialKandangPen_healthStatus_idx" ON "RawMaterialKandangPen"("healthStatus");
CREATE INDEX "RawMaterialKandangPen_isActive_idx" ON "RawMaterialKandangPen"("isActive");
CREATE INDEX "RawMaterialKandangPen_flockName_idx" ON "RawMaterialKandangPen"("flockName");

ALTER TABLE "RawMaterialKandangPen"
  ADD CONSTRAINT "RawMaterialKandangPen_businessId_fkey"
  FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RawMaterialKandangPen"
  ADD CONSTRAINT "RawMaterialKandangPen_feedBatchId_fkey"
  FOREIGN KEY ("feedBatchId") REFERENCES "RawMaterialBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
