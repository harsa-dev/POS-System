-- CreateEnum
CREATE TYPE "RawMaterialProcessingStatus" AS ENUM ('PLANNED', 'RUNNING', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "RawMaterialProcessingRun" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RawMaterialProcessingRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RawMaterialProcessingRun_businessId_runNumber_key" ON "RawMaterialProcessingRun"("businessId", "runNumber");

-- CreateIndex
CREATE INDEX "RawMaterialProcessingRun_businessId_idx" ON "RawMaterialProcessingRun"("businessId");

-- CreateIndex
CREATE INDEX "RawMaterialProcessingRun_inputBatchId_idx" ON "RawMaterialProcessingRun"("inputBatchId");

-- CreateIndex
CREATE INDEX "RawMaterialProcessingRun_status_idx" ON "RawMaterialProcessingRun"("status");

-- CreateIndex
CREATE INDEX "RawMaterialProcessingRun_startedAt_idx" ON "RawMaterialProcessingRun"("startedAt");

-- CreateIndex
CREATE INDEX "RawMaterialProcessingRun_completedAt_idx" ON "RawMaterialProcessingRun"("completedAt");

-- CreateIndex
CREATE INDEX "RawMaterialProcessingRun_outputName_idx" ON "RawMaterialProcessingRun"("outputName");

-- AddForeignKey
ALTER TABLE "RawMaterialProcessingRun" ADD CONSTRAINT "RawMaterialProcessingRun_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RawMaterialProcessingRun" ADD CONSTRAINT "RawMaterialProcessingRun_inputBatchId_fkey" FOREIGN KEY ("inputBatchId") REFERENCES "RawMaterialBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
