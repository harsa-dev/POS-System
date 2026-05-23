import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/get-current-user";
import type { PermissionKey } from "./permissions";
import { hasPermission } from "./has-permission";

export async function requirePermission(permissionKey: PermissionKey) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const allowed = await hasPermission(user.role, permissionKey);

  if (!allowed) {
    redirect("/unauthorized");
  }

  return user;
}
