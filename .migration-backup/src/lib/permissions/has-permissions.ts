import type { Role } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import type { PermissionKey } from "./permissions";

export async function hasPermission(role: Role, permissionKey: PermissionKey) {
  const rolePermission = await prisma.rolePermission.findFirst({
    where: {
      role,
      permission: {
        key: permissionKey,
      },
    },
  });

  return Boolean(rolePermission);
}