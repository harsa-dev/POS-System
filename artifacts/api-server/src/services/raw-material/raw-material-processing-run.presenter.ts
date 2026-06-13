import type { RawMaterialBatch, RawMaterialProcessingRun } from "@prisma/client";

import type { RawMaterialProcessingRunDto } from "./raw-material-processing-run.types.js";

export type RawMaterialProcessingRunWithBatch = RawMaterialProcessingRun & {
  inputBatch: Pick<RawMaterialBatch, "lotCode" | "materialName">;
};

function roundPercent(value: number) {
  return Math.round(value * 100) / 100;
}

export function toRawMaterialProcessingRunDto(
  run: RawMaterialProcessingRunWithBatch,
): RawMaterialProcessingRunDto {
  const totalOutputQuantity = run.outputQuantity + run.byproductQuantity;
  const lossQuantity = Math.max(run.inputQuantity - totalOutputQuantity - run.wasteQuantity, 0);
  const yieldPercent = run.inputQuantity > 0
    ? roundPercent((run.outputQuantity / run.inputQuantity) * 100)
    : 0;

  return {
    id: run.id,
    businessId: run.businessId,
    runNumber: run.runNumber,
    inputBatchId: run.inputBatchId,
    inputBatchLotCode: run.inputBatch.lotCode,
    inputMaterialName: run.inputBatch.materialName,
    outputName: run.outputName,
    inputQuantity: run.inputQuantity,
    outputQuantity: run.outputQuantity,
    byproductQuantity: run.byproductQuantity,
    wasteQuantity: run.wasteQuantity,
    totalOutputQuantity,
    yieldPercent,
    lossQuantity,
    status: run.status,
    startedAt: run.startedAt ? run.startedAt.toISOString() : null,
    completedAt: run.completedAt ? run.completedAt.toISOString() : null,
    notes: run.notes,
    createdAt: run.createdAt.toISOString(),
    updatedAt: run.updatedAt.toISOString(),
  };
}
