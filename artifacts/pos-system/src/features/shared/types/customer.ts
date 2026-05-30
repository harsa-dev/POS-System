export type Customer = {
  name: string;
  phone: string;
  email: string;
  address: string;
  totalSpending: number;
  transactions: number;
};

export type LoyaltyTierName = "Bronze" | "Silver" | "Gold" | "Platinum";

export type LoyaltyTierSetting = {
  icon: string;
  tierName: LoyaltyTierName;
  calculationPeriod: string;
  minimumSpending: number;
  automaticDiscount: string;
};
