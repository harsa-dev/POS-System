import type { Role } from "@prisma/client";

export type RawMaterialWeighingActor = Readonly<{
  id: string;
  role: Role;
}>;

export type RawMaterialWeighingDto = Readonly<{
  id: string;
  businessId: string;
  referenceNumber: string;
  intakeId: string;
  intakeReferenceNumber: string;
  materialName: string;
  stationName: string;
  grossKg: number;
  tareKg: number;
  netKg: number;
  operatorName: string;
  measuredAt: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}>;
