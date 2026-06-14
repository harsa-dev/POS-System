export type BusinessType = "restaurant" | "retail" | "custom-business" | "raw-material";

export type BusinessMode = "restaurant" | "retail" | "custom-business" | "raw-material";

export type BusinessContext<TBusiness = unknown> = {
  /** Generic tenant/business scope used by every business mode. */
  businessId: string;
  /** Legacy restaurant-scoped services still read this while migrating to businessId. */
  restaurantId: string;
  businessType: BusinessType;
  businessMode: BusinessMode;
  businessName: string;
  business: TBusiness;
};
