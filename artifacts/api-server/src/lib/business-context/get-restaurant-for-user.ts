import type { Restaurant, Role } from "@prisma/client";

import { isOwnerRole } from "../../services/permissions/index.js";
import { AppError } from "../errors/app-error.js";
import { errorCodes } from "../errors/error-codes.js";
import { prisma } from "../prisma.js";
import type { BusinessContext } from "./business-context.types.js";
import { resolveBusinessIdFromRestaurant } from "./resolve-business-id.js";

export type RestaurantScopedUser = {
  id: string;
  role: Role;
  restaurantId: string | null;
};

export type RestaurantBusinessContext = BusinessContext<Restaurant> & {
  businessType: "restaurant";
  businessMode: "restaurant";
  restaurant: Restaurant;
};

export function createRestaurantBusinessContext(
  restaurant: Restaurant,
): RestaurantBusinessContext {
  const businessId = resolveBusinessIdFromRestaurant(restaurant);

  return {
    businessId,
    businessType: "restaurant",
    businessMode: "restaurant",
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
