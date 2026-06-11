import type { Role } from "@prisma/client";

import { isOwnerRole } from "../../services/permissions/index.js";
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
