import type { RestaurantBusinessContext } from "./get-restaurant-for-user.js";

/**
 * Temporary bridge while the database schema still stores tenant ownership in
 * restaurantId columns.
 *
 * New backend code should pass around businessId from BusinessContext.
 * Database queries can translate that businessId to the legacy restaurantId
 * shape through this helper until a real schema migration is planned.
 */
export function getLegacyRestaurantIdFromBusiness(
  businessContext: RestaurantBusinessContext,
) {
  return businessContext.businessId;
}

export function createRestaurantScopeWhere(
  businessContext: RestaurantBusinessContext,
) {
  return {
    restaurantId: getLegacyRestaurantIdFromBusiness(businessContext),
  };
}

export function createRestaurantIdWhere(
  businessContext: RestaurantBusinessContext,
) {
  return {
    id: getLegacyRestaurantIdFromBusiness(businessContext),
  };
}
