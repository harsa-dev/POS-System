export type UserRole = "OWNER" | "MANAGER" | "ADMIN" | "OPERATOR" | "STAFF" | "VIEWER";

export type AppUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole | string;
  businessId?: string | null;
};

export type AuthUser = AppUser;
