import type { RawMaterialSupplier } from "@prisma/client";

import type { RawMaterialSupplierDto } from "./raw-material-supplier.types.js";

export function toRawMaterialSupplierDto(
  supplier: RawMaterialSupplier,
): RawMaterialSupplierDto {
  return {
    id: supplier.id,
    businessId: supplier.businessId,
    name: supplier.name,
    contactPerson: supplier.contactPerson,
    phone: supplier.phone,
    email: supplier.email,
    address: supplier.address,
    category: supplier.category,
    reliabilityScore: supplier.reliabilityScore,
    leadTimeDays: supplier.leadTimeDays,
    isActive: supplier.isActive,
    notes: supplier.notes,
    createdAt: supplier.createdAt.toISOString(),
    updatedAt: supplier.updatedAt.toISOString(),
  };
}
