import type { BusinessContext } from "./business-context.types.js";

export function getBusinessIdFromScope(businessContext: BusinessContext) {
  return businessContext.businessId;
}

export function createBusinessScopeWhere(businessContext: BusinessContext) {
  return {
    businessId: getBusinessIdFromScope(businessContext),
  };
}

export function createBusinessIdWhere(businessContext: BusinessContext) {
  return {
    id: getBusinessIdFromScope(businessContext),
  };
}
