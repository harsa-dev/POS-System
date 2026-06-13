export type BusinessType = "restaurant" | "retail" | "service" | "livestock";

export type BusinessMode = "restaurant" | "retail" | "service" | "livestock";

export type BusinessContext<TBusiness = unknown> = {
  /**
   * Generic business scope used by new backend code.
   *
   * During the bridge phase this may still resolve to the Restaurant id when the
   * database row has not been linked to a Business row yet. After the schema is
   * fully migrated, this should point to Business.id.
   */
  businessId: string;
  businessType: BusinessType;
  businessMode: BusinessMode;
  businessName: string;

  /**
   * Backward-compatible alias while operational tables still use restaurantId.
   * New code should prefer businessId for ownership semantics, but database
   * queries against legacy restaurant-scoped tables can keep using restaurantId.
   */
  restaurantId: string;

  business: TBusiness;
};
