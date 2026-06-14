import type { RestaurantRepository } from "./restaurant.repository.js";
import { restaurantPrismaRepository } from "./restaurant.prisma-repository.js";

export const restaurantRepository: RestaurantRepository = restaurantPrismaRepository;
