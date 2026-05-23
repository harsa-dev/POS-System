import { prisma } from "@/lib/db/prisma";

import { DEFAULT_ROLE_PERMISSIONS } from "./default-role-permissions";
import { PERMISSIONS } from "./permissions";

export async function syncPermissions() {
  const permissionEntries = Object.values(PERMISSIONS);

  for (const permissionKey of permissionEntries) {
    await prisma.permission.upsert({
      where: {
        key: permissionKey,
      },

      update: {},

      create: {
        key: permissionKey,
        description: permissionKey,
      },
    });
  }

  const allPermissions = await prisma.permission.findMany();

  for (const [role, permissions] of Object.entries(
    DEFAULT_ROLE_PERMISSIONS,
  )) {
    for (const permissionKey of permissions) {
      const permission = allPermissions.find(
        (item) => item.key === permissionKey,
      );

      if (!permission) continue;

      await prisma.rolePermission.upsert({
        where: {
          role_permissionId: {
            role: role as any,
            permissionId: permission.id,
          },
        },

        update: {},

        create: {
          role: role as any,
          permissionId: permission.id,
        },
      });
    }
  }
}