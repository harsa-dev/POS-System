import type { Role } from "@prisma/client";

export type RawMaterialActor = Readonly<{
  id: string;
  role: Role;
}>;

export type RawMaterialStorageLocationDto = Readonly<{
  id: string;
  businessId: string;
  code: string;
  name: string;
  type: string;
  capacityKg: number;
  usedKg: number;
  availableKg: number;
  usagePercent: number;
  temperatureCelsius: number | null;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}>;
