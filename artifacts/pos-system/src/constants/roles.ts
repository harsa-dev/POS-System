// ---------------------------------------------------------------------------
// Role constants — single source of truth for role strings
// ---------------------------------------------------------------------------
export const ROLES = {
  OWNER: "OWNER",
  MANAGER: "MANAGER",
  CASHIER: "CASHIER",
  KITCHEN: "KITCHEN",
  SERVER: "SERVER",
} as const;

export type RoleName = (typeof ROLES)[keyof typeof ROLES];

/** Roles that can be assigned to employees (excludes OWNER) */
export const EMPLOYEE_ROLES: RoleName[] = [
  ROLES.MANAGER,
  ROLES.CASHIER,
  ROLES.KITCHEN,
  ROLES.SERVER,
];

export const ROLE_LABELS: Record<RoleName, string> = {
  OWNER: "Owner",
  MANAGER: "Manager",
  CASHIER: "Cashier",
  KITCHEN: "Kitchen",
  SERVER: "Server",
};

/** Tailwind badge classes for each role */
export const ROLE_COLORS: Record<RoleName, string> = {
  OWNER: "bg-red-100 text-red-700",
  MANAGER: "bg-blue-100 text-blue-700",
  CASHIER: "bg-violet-100 text-violet-700",
  KITCHEN: "bg-orange-100 text-orange-700",
  SERVER: "bg-emerald-100 text-emerald-700",
};
