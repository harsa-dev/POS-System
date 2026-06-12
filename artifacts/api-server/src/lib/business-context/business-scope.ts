import type { RestaurantBusinessContext } from "./get-restaurant-for-user.js";

/**
 * Temporary bridge while the database schema still stores tenant ownership in
 * restaurantId columns.
 *
 * BusinessContext.businessId may point to the new Business.id once the tenant
 * bridge has been backfilled. Legacy operational tables still store the
 * Restaurant.id in restaurantId columns, so database queries must use the
 * backward-compatible restaurantId alias until those tables are migrated.
 */
export function getLegacyRestaurantIdFromBusiness(
  businessContext: RestaurantBusinessContext,
) {
  return businessContext.restaurantId;
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
