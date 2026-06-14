import type {
  Business,
  BusinessMode as PrismaBusinessMode,
  BusinessType as PrismaBusinessType,
  Restaurant,
  Role,
} from "@prisma/client";
import type { Request } from "express";

import { isOwnerRole } from "../../services/permissions/index.js";
import { AppError } from "../errors/app-error.js";
import { errorCodes } from "../errors/error-codes.js";
import { prisma } from "../prisma.js";
import type {
  BusinessContext,
  BusinessMode,
  BusinessType,
} from "./business-context.types.js";

export type BusinessScopedUser = {
  id: string;
  role: Role;
  businessId: string | null;
};

export type BusinessWithModeProfile = Business & {
  restaurant: Restaurant | null;
};

export type ResolvedBusinessContext = BusinessContext<BusinessWithModeProfile>;

const businessTypeMap: Record<PrismaBusinessType, BusinessType> = {
  RESTAURANT: "restaurant",
  RETAIL: "retail",
  SERVICE: "custom-business",
  LIVESTOCK: "raw-material",
  RAW_MATERIAL: "raw-material",
};

const businessModeMap: Record<PrismaBusinessMode, BusinessMode> = {
  RESTAURANT: "restaurant",
  RETAIL: "retail",
  SERVICE: "custom-business",
  LIVESTOCK: "raw-material",
  RAW_MATERIAL: "raw-material",
};

export function createBusinessContext(
  business: BusinessWithModeProfile,
): ResolvedBusinessContext {
  return {
    businessId: business.id,
    restaurantId: business.restaurant?.id ?? business.id,
    businessType: businessTypeMap[business.type],
    businessMode: businessModeMap[business.mode],
    businessName: business.name,
    business,
  };
}

export async function getBusinessForUser(user: BusinessScopedUser) {
  return prisma.business.findFirst({
    where: isOwnerRole(user.role)
      ? { ownerId: user.id, isActive: true }
      : { id: user.businessId ?? "", isActive: true },
    include: {
      restaurant: true,
    },
  });
}

export async function requireBusinessForUser(user: BusinessScopedUser) {
  const business = await getBusinessForUser(user);

  if (!business) {
    throw new AppError({
      statusCode: 404,
      code: errorCodes.businessNotFound,
      message: "Business not found.",
    });
  }

  return business;
}

export async function getBusinessContextForUser(user: BusinessScopedUser) {
  const business = await getBusinessForUser(user);

  if (!business) {
    return null;
  }

  return createBusinessContext(business);
}

export async function requireBusinessContextForUser(user: BusinessScopedUser) {
  const business = await requireBusinessForUser(user);

  return createBusinessContext(business);
}

export async function getBusinessContextForRequest(
  _req: Request,
  user: BusinessScopedUser,
) {
  return getBusinessContextForUser(user);
}

export async function requireBusinessContextForRequest(
  _req: Request,
  user: BusinessScopedUser,
) {
  return requireBusinessContextForUser(user);
}
