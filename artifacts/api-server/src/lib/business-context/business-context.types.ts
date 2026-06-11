export type BusinessType = "restaurant";

export type BusinessMode = "restaurant";

export type BusinessContext<TBusiness = unknown> = {
  businessId: string;
  businessType: BusinessType;
  businessMode: BusinessMode;
  businessName: string;

  /**
   * Backward-compatible alias while the database still uses restaurantId.
   * New code should prefer businessId, but existing restaurant-scoped queries
   * can keep using restaurantId until the schema migration is planned.
   */
  restaurantId: string;

  business: TBusiness;
};
