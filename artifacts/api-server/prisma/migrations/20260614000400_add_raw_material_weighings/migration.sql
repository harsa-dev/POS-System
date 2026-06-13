CREATE TABLE "RawMaterialWeighing" (
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
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RawMaterialWeighing_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RawMaterialWeighing_businessId_referenceNumber_key" ON "RawMaterialWeighing"("businessId", "referenceNumber");
CREATE INDEX "RawMaterialWeighing_businessId_idx" ON "RawMaterialWeighing"("businessId");
CREATE INDEX "RawMaterialWeighing_intakeId_idx" ON "RawMaterialWeighing"("intakeId");
CREATE INDEX "RawMaterialWeighing_stationName_idx" ON "RawMaterialWeighing"("stationName");
CREATE INDEX "RawMaterialWeighing_operatorName_idx" ON "RawMaterialWeighing"("operatorName");
CREATE INDEX "RawMaterialWeighing_measuredAt_idx" ON "RawMaterialWeighing"("measuredAt");
CREATE INDEX "RawMaterialWeighing_netKg_idx" ON "RawMaterialWeighing"("netKg");

ALTER TABLE "RawMaterialWeighing"
  ADD CONSTRAINT "RawMaterialWeighing_businessId_fkey"
  FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RawMaterialWeighing"
  ADD CONSTRAINT "RawMaterialWeighing_intakeId_fkey"
  FOREIGN KEY ("intakeId") REFERENCES "RawMaterialIntake"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
