import type { BusinessContext } from "../../lib/business-context/business-context.types.js";

export function inventoryRestaurantScope(businessContext: BusinessContext) {
  return { restaurantId: businessContext.restaurantId };
}

export function inventoryItemScopedWhere(
  businessContext: BusinessContext,
  id: string
) {
  return {
    id,
    ...inventoryRestaurantScope(businessContext),
  };
}
