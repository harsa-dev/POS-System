import type { RawMaterialSupplier, Role } from "@prisma/client";

export type RawMaterialActor = Readonly<{
  id: string;
  role: Role;
}>;

export type RawMaterialSupplierDto = Readonly<{
  id: string;
  businessId: string;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  category: RawMaterialSupplier["category"];
  reliabilityScore: number;
  leadTimeDays: number;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}>;
