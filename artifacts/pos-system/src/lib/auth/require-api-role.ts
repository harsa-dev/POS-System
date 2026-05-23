import { Role } from "@prisma/client";

import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function requireApiRole(
  allowedRoles: Role[],
) {
  const user = await getCurrentUser();

  if (!user) {
    return {
      error: {
        success: false,
        message: "Unauthorized",
        status: 401,
      },
    };
  }

  if (!allowedRoles.includes(user.role)) {
    return {
      error: {
        success: false,
        message: "Forbidden",
        status: 403,
      },
    };
  }

  return { user };
}