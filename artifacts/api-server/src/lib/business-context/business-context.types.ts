export type BusinessType = "restaurant" | "retail" | "service" | "livestock";

export type BusinessMode = "restaurant" | "retail" | "service" | "livestock";

export type BusinessContext<TBusiness = unknown> = {
  /** Generic tenant/business scope used by every business mode. */
  businessId: string;
  businessType: BusinessType;
  businessMode: BusinessMode;
  businessName: string;
  business: TBusiness;
};
