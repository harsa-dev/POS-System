import type { BusinessContext } from "../../lib/business-context/business-context.types.js";

export function inventoryBusinessScope(businessContext: BusinessContext) {
  return { businessId: businessContext.businessId };
}

export function inventoryItemScopedWhere(
  businessContext: BusinessContext,
  id: string,
) {
  return {
    id,
    ...inventoryBusinessScope(businessContext),
  };
}
