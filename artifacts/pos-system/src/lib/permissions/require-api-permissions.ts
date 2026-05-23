import { getCurrentUser } from "@/lib/auth/get-current-user";
import type { PermissionKey } from "./permissions";
import { hasPermission } from "./has-permission";

export async function requireApiPermission(permissionKey: PermissionKey) {
  const user = await getCurrentUser();

  if (!user) {
    return {
      user: null,
      error: {
        status: 401,
        message: "Unauthorized",
      },
    };
  }

  const allowed = await hasPermission(user.role, permissionKey);

  if (!allowed) {
    return {
      user: null,
      error: {
        status: 403,
        message: "Forbidden",
      },
    };
  }

  return {
    user,
    error: null,
  };
}
