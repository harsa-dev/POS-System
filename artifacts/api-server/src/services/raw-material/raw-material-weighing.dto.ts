import type { RawMaterialIntake, RawMaterialWeighing } from "@prisma/client";

import type { RawMaterialWeighingDto } from "./raw-material-weighing.types.js";

type RawMaterialWeighingWithIntake = RawMaterialWeighing & {
  intake: Pick<RawMaterialIntake, "id" | "referenceNumber" | "materialName">;
};

export function toRawMaterialWeighingDto(
  weighing: RawMaterialWeighingWithIntake,
): RawMaterialWeighingDto {
  return {
    id: weighing.id,
    businessId: weighing.businessId,
    referenceNumber: weighing.referenceNumber,
    intakeId: weighing.intakeId,
    intakeReferenceNumber: weighing.intake.referenceNumber,
    materialName: weighing.intake.materialName,
    stationName: weighing.stationName,
    grossKg: weighing.grossKg,
    tareKg: weighing.tareKg,
    netKg: weighing.netKg,
    operatorName: weighing.operatorName,
    measuredAt: weighing.measuredAt.toISOString(),
    notes: weighing.notes,
    createdAt: weighing.createdAt.toISOString(),
    updatedAt: weighing.updatedAt.toISOString(),
  };
}
