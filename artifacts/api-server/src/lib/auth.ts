import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import type { Role } from "@prisma/client";

import { prisma } from "./prisma.js";
import { errorCodes } from "./errors/error-codes.js";
import { errorResponse } from "./responses/error-response.js";
import {
  getRestaurantForUser,
  requireRestaurantForUser,
  type RestaurantScopedUser,
} from "./business-context/get-restaurant-for-user.js";

export type { Role };
export {
  getRestaurantForUser,
  requireRestaurantForUser,
  type RestaurantScopedUser,
};

const getSecret = () => {
  const secretKey = process.env.JWT_SECRET;
  if (!secretKey) {
    throw new Error("JWT_SECRET environment variable is required but was not set.");
  }
  return new TextEncoder().encode(secretKey);
};

export async function createSessionToken(userId: string) {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifySessionToken(token: string) {
  try {
    const verified = await jwtVerify(token, getSecret());
    return verified.payload as { userId: string };
  } catch {
    return null;
  }
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export async function getCurrentUser(req: Request) {
  const token = req.cookies?.session;
  if (!token) return null;
  const payload = await verifySessionToken(token);
  if (!payload) return null;
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: { restaurant: true },
  });
  return user;
}

export async function requireRole(
  req: Request,
  res: Response,
  allowedRoles: Role[]
) {
  const user = await getCurrentUser(req);

  if (!user) {
    errorResponse(res, {
      status: 401,
      code: errorCodes.unauthorized,
      message: "Unauthorized.",
    });
    return null;
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
