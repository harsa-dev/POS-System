import type { Role } from "@prisma/client";

import { isOwnerRole } from "../../services/permissions/index.js";
import { AppError } from "../errors/app-error.js";
import { errorCodes } from "../errors/error-codes.js";
import { prisma } from "../prisma.js";

export type RestaurantScopedUser = {
  id: string;
  role: Role;
  restaurantId: string | null;
};

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
