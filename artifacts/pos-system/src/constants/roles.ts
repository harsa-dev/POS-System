// ---------------------------------------------------------------------------
// Role constants — single source of truth for business role strings
// ---------------------------------------------------------------------------
export const ROLES = {
  OWNER: "OWNER",
  MANAGER: "MANAGER",
  ADMIN: "ADMIN",
  OPERATOR: "OPERATOR",
  STAFF: "STAFF",
  VIEWER: "VIEWER",
} as const;

export type RoleName = (typeof ROLES)[keyof typeof ROLES];

/** Roles that can be assigned to business members (excludes OWNER) */
export const EMPLOYEE_ROLES: RoleName[] = [
  ROLES.MANAGER,
  ROLES.ADMIN,
  ROLES.OPERATOR,
  ROLES.STAFF,
  ROLES.VIEWER,
];

export const ROLE_LABELS: Record<RoleName, string> = {
  OWNER: "Owner",
  MANAGER: "Manager",
  ADMIN: "Admin",
  OPERATOR: "Operator",
  STAFF: "Staff",
  VIEWER: "Viewer",
};

/** Tailwind badge classes for each role */
export const ROLE_COLORS: Record<RoleName, string> = {
  OWNER: "bg-red-100 text-red-700",
  MANAGER: "bg-blue-100 text-blue-700",
  ADMIN: "bg-indigo-100 text-indigo-700",
  OPERATOR: "bg-violet-100 text-violet-700",
  STAFF: "bg-emerald-100 text-emerald-700",
  VIEWER: "bg-slate-100 text-slate-700",
};
