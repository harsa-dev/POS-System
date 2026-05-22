import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function requireRole(
  allowedRoles: string[]
) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!allowedRoles.includes(user.role)) {
    redirect("/dashboard");
  }

  return user;
}