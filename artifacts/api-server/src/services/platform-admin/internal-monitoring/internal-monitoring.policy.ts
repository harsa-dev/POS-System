import { Role } from "@prisma/client";

export const INTERNAL_MONITORING_READ_ROLES: Role[] = [Role.OWNER, Role.ADMIN];

export const INTERNAL_MONITORING_POLICY = {
  capability: "platform-admin.internal-monitoring.read",
  mode: "read-only",
  allowedRoles: INTERNAL_MONITORING_READ_ROLES,
  blockedMutations: [
    "POST /api/internal/*",
    "PATCH /api/internal/*",
    "DELETE /api/internal/*",
    "PATCH /api/internal/alerts/:alertId/acknowledge",
  ],
} as const;
