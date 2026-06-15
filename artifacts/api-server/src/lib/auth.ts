import { createHash, randomBytes } from "node:crypto";
import type { Request, Response } from "express";
import type { Business, Role, User } from "@prisma/client";

import { prisma } from "./prisma.js";
import { AppError } from "./errors/app-error.js";
import { errorCodes } from "./errors/error-codes.js";
import { errorResponse } from "./responses/error-response.js";
import {
  getBusinessForUser,
  requireBusinessForUser,
  requireBusinessContextForUser,
  type BusinessScopedUser,
} from "./business-context/get-business-for-user.js";
import type { BusinessMode } from "./business-context/business-context.types.js";
import {
  hasPermission as roleHasPermission,
  requirePermission as requireRolePermission,
  rolePermissionMap,
  type PermissionKey,
} from "../services/permissions/index.js";

export type { Role, PermissionKey };
export {
  getBusinessForUser,
  requireBusinessForUser,
  requireBusinessContextForUser,
  type BusinessScopedUser,
};

export type AuthenticatedUser = User & {
  business: Business | null;
};

export type SafeCurrentUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  businessId: string | null;
  isActive: boolean;
  permissions: PermissionKey[];
  business: {
    id: string;
    name: string;
    type: Business["type"];
    mode: Business["mode"];
    isActive: boolean;
  } | null;
};

export const SESSION_COOKIE_NAME = "session";
export const SESSION_MAX_AGE_MS = 60 * 60 * 24 * 7 * 1000;

const hashPackage = "bcrypt" + "js";

async function loadHasher() {
  return import(hashPackage);
}

function getSessionExpiresAt(now = new Date()) {
  return new Date(now.getTime() + SESSION_MAX_AGE_MS);
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSessionToken(userId: string) {
  const now = new Date();
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashSessionToken(token);

  await prisma.$transaction([
    prisma.session.deleteMany({
      where: {
        userId,
        expiresAt: {
          lte: now,
        },
      },
    }),
    prisma.session.create({
      data: {
        tokenHash,
        userId,
        expiresAt: getSessionExpiresAt(now),
      },
    }),
  ]);

  return token;
}

export async function verifySessionToken(token: string) {
  const tokenHash = hashSessionToken(token);

  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: {
      user: {
        include: { business: true },
      },
    },
  });

  if (!session) return null;

  if (session.expiresAt <= new Date()) {
    await prisma.session.deleteMany({
      where: { id: session.id },
    });

    return null;
  }

  return {
    sessionId: session.id,
    userId: session.userId,
    user: session.user,
  };
}

export async function revokeSessionToken(token: string | null | undefined) {
  if (!token) return false;

  const tokenHash = hashSessionToken(token);

  const result = await prisma.session.deleteMany({
    where: { tokenHash },
  });

  return result.count > 0;
}

export async function revokeAllUserSessions(userId: string) {
  await prisma.session.deleteMany({
    where: { userId },
  });
}

export async function pruneExpiredSessions(now = new Date()) {
  return prisma.session.deleteMany({
    where: {
      expiresAt: {
        lte: now,
      },
    },
  });
}

export async function hashPassword(value: string) {
  const hasher = await loadHasher();
  return hasher.default.hash(value, 12);
}

export async function verifyPassword(value: string, hash: string) {
  const hasher = await loadHasher();
  return hasher.default.compare(value, hash);
}

export async function getCurrentUser(req: Request): Promise<AuthenticatedUser | null> {
  const token = req.cookies?.[SESSION_COOKIE_NAME];
  if (!token || typeof token !== "string") return null;

  const session = await verifySessionToken(token);
  if (!session) return null;

  return session.user;
}

export function sanitizeUser(user: AuthenticatedUser): SafeCurrentUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    businessId: user.businessId,
    isActive: user.isActive,
    permissions: [...rolePermissionMap[user.role]],
    business: user.business
      ? {
          id: user.business.id,
          name: user.business.name,
          type: user.business.type,
          mode: user.business.mode,
          isActive: user.business.isActive,
        }
      : null,
  };
}

export function requireActiveUser<TUser extends { isActive: boolean }>(user: TUser) {
  if (!user.isActive) {
    throw new AppError({
      statusCode: 403,
      code: errorCodes.userInactive,
      message: "User is inactive.",
    });
  }

  return user;
}

export function requireActiveBusiness(user: AuthenticatedUser) {
  if (user.businessId && (!user.business || !user.business.isActive)) {
    throw new AppError({
      statusCode: 403,
      code: errorCodes.businessNotFound,
      message: "Business not found.",
    });
  }

  return user;
}

export async function requireAuth(req: Request) {
  const user = await getCurrentUser(req);

  if (!user) {
    throw new AppError({
      statusCode: 401,
      code: errorCodes.unauthorized,
      message: "Unauthorized.",
    });
  }

  requireActiveUser(user);
  requireActiveBusiness(user);

  return user;
}

export function hasPermission(user: Pick<AuthenticatedUser, "role">, permission: PermissionKey) {
  return roleHasPermission(user.role, permission);
}

export function requirePermission(user: Pick<AuthenticatedUser, "role">, permission: PermissionKey) {
  requireRolePermission(user.role, permission);
}

export function requireAnyPermission(
  user: Pick<AuthenticatedUser, "role">,
  permissions: readonly PermissionKey[],
) {
  if (permissions.some((permission) => hasPermission(user, permission))) return;

  throw new AppError({
    statusCode: 403,
    code: errorCodes.forbidden,
    message: "Forbidden.",
    details: { permissions },
  });
}

export async function requireBusinessScope(user: BusinessScopedUser) {
  return requireBusinessContextForUser(user);
}

export async function requireModeAccess(user: BusinessScopedUser, mode: BusinessMode) {
  const businessContext = await requireBusinessContextForUser(user);

  if (businessContext.businessMode !== mode) {
    throw new AppError({
      statusCode: 403,
      code: errorCodes.businessModeMismatch,
      message: "Mode access denied.",
      details: {
        expectedMode: mode,
        actualMode: businessContext.businessMode,
      },
    });
  }

  return businessContext;
}

export async function requireRole(req: Request, res: Response, allowedRoles: Role[]) {
  const user = await getCurrentUser(req);

  if (!user) {
    errorResponse(res, {
      status: 401,
      code: errorCodes.unauthorized,
      message: "Unauthorized.",
    });
    return null;
  }

  try {
    requireActiveUser(user);
    requireActiveBusiness(user);
  } catch (error) {
    if (error instanceof AppError) {
      errorResponse(res, {
        status: error.statusCode,
        code: error.code,
        message: error.message,
        details: error.details,
      });
      return null;
    }

    throw error;
  }

  if (!allowedRoles.includes(user.role)) {
    errorResponse(res, {
      status: 403,
      code: errorCodes.forbidden,
      message: "Forbidden.",
    });
    return null;
  }

  return user;
}
