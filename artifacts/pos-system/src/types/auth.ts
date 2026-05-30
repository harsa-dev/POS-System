export type UserRole = "OWNER" | "MANAGER" | "CASHIER" | "KITCHEN" | "SERVER";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole | string;
  restaurantId?: string | null;
};
