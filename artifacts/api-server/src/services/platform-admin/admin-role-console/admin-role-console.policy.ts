import { Role } from "@prisma/client";

export const ADMIN_ROLE_CONSOLE_READ_ROLES: Role[] = [Role.OWNER, Role.ADMIN];

export const ADMIN_ROLE_CONSOLE_POLICY = {
  capability: "platform-admin.admin-role-console.read",
  mode: "read-only",
  allowedRoles: ADMIN_ROLE_CONSOLE_READ_ROLES,
  blockedRoutes: [
    "POST /api/internal/admin-console/*",
    "PATCH /api/internal/admin-console/*",
    "DELETE /api/internal/admin-console/*",
  ],
} as const;
