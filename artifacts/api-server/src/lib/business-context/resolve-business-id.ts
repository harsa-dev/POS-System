type RestaurantBusinessBridge = {
  id: string;
  businessId?: string | null;
};

/**
 * Resolve the generic business id from a restaurant-scoped record.
 *
 * During the bridge phase, old databases may not have Restaurant.businessId yet.
 * In that case, we fall back to Restaurant.id so existing route behavior remains
 * stable while new code can start depending on BusinessContext.businessId.
 */
export function resolveBusinessIdFromRestaurant(
  restaurant: RestaurantBusinessBridge,
) {
  return restaurant.businessId ?? restaurant.id;
}
