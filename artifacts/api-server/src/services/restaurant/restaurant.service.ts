import type { RestaurantRepository } from "./restaurant.repository.js";
import { restaurantRepository } from "./restaurant.repository-provider.js";
import type { RestaurantBusinessScope } from "./restaurant.types.js";

export class RestaurantService {
  constructor(private readonly repository: RestaurantRepository = restaurantRepository) {}

  getDashboardSummary(scope: RestaurantBusinessScope) {
    return this.repository.getDashboardSummary(scope);
  }

  listMenuItems(scope: RestaurantBusinessScope) {
    return this.repository.listMenuItems(scope);
  }

  listTables(scope: RestaurantBusinessScope) {
    return this.repository.listTables(scope);
  }

  listActiveOrders(scope: RestaurantBusinessScope) {
    return this.repository.listActiveOrders(scope);
  }

  listKitchenQueue(scope: RestaurantBusinessScope) {
    return this.repository.listKitchenQueue(scope);
  }

  listServingQueue(scope: RestaurantBusinessScope) {
    return this.repository.listServingQueue(scope);
  }
}

export const restaurantService = new RestaurantService();
