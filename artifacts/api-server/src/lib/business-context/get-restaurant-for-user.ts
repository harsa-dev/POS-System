import type { Restaurant, Role } from "@prisma/client";
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
import { resolveBusinessIdFromRestaurant } from "./resolve-business-id.js";
import {
  getRequestedBusinessMode,
  type ApiBusinessMode,
} from "./requested-business-mode.js";

export type RestaurantScopedUser = {
  id: string;
  role: Role;
  restaurantId: string | null;
};

export type RestaurantBusinessContext = BusinessContext<Restaurant> & {
  restaurant: Restaurant;
};

const requestedModeContextMap = {
  restaurant: {
    businessType: "restaurant",
    businessMode: "restaurant",
  },
  retail: {
    businessType: "retail",
    businessMode: "retail",
  },
  "raw-material": {
    businessType: "livestock",
    businessMode: "livestock",
  },
  "custom-business": {
    businessType: "service",
    businessMode: "service",
  },
} as const satisfies Record<
  ApiBusinessMode,
  {
    businessType: BusinessType;
    businessMode: BusinessMode;
  }
>;

function resolveRequestedContextMode(requestedMode: ApiBusinessMode | null) {
  return requestedModeContextMap[requestedMode ?? "restaurant"];
}

export function createRestaurantBusinessContext(
  restaurant: Restaurant,
  requestedMode: ApiBusinessMode | null = null,
): RestaurantBusinessContext {
  const businessId = resolveBusinessIdFromRestaurant(restaurant);
  const contextMode = resolveRequestedContextMode(requestedMode);

  return {
    businessId,
    businessType: contextMode.businessType,
    businessMode: contextMode.businessMode,
    businessName: restaurant.name,
    restaurantId: restaurant.id,
    business: restaurant,
    restaurant,
  };
}

export async function getRestaurantForUser(user: RestaurantScopedUser) {
  return prisma.restaurant.findFirst({
    where: isOwnerRole(user.role)
      ? { ownerId: user.id }
      : { id: user.restaurantId ?? "" },
  });
}

export async function requireRestaurantForUser(user: RestaurantScopedUser) {
  const restaurant = await getRestaurantForUser(user);

  if (!restaurant) {
    throw new AppError({
      statusCode: 404,
      code: errorCodes.restaurantNotFound,
      message: "Restaurant not found.",
    });
  }

  return restaurant;
}

export async function getBusinessContextForUser(user: RestaurantScopedUser) {
  const restaurant = await getRestaurantForUser(user);

  if (!restaurant) {
    return null;
  }

  return createRestaurantBusinessContext(restaurant);
}

export async function requireBusinessContextForUser(user: RestaurantScopedUser) {
  const restaurant = await getRestaurantForUser(user);

  if (!restaurant) {
    throw new AppError({
      statusCode: 404,
      code: errorCodes.businessNotFound,
      message: "Business not found.",
    });
  }

  return createRestaurantBusinessContext(restaurant);
}

export async function getBusinessContextForRequest(
  req: Request,
  user: RestaurantScopedUser,
) {
  const restaurant = await getRestaurantForUser(user);

  if (!restaurant) {
    return null;
  }

  return createRestaurantBusinessContext(restaurant, getRequestedBusinessMode(req));
}

export async function requireBusinessContextForRequest(
  req: Request,
  user: RestaurantScopedUser,
) {
  const restaurant = await getRestaurantForUser(user);

  if (!restaurant) {
    throw new AppError({
      statusCode: 404,
      code: errorCodes.businessNotFound,
      message: "Business not found.",
    });
  }

  return createRestaurantBusinessContext(restaurant, getRequestedBusinessMode(req));
}
