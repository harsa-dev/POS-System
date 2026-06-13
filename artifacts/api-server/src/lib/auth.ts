import type { Request, Response } from "express";
import type { Role } from "@prisma/client";

import { prisma } from "./prisma.js";
import { errorCodes } from "./errors/error-codes.js";
import { errorResponse } from "./responses/error-response.js";
import {
  getBusinessForUser,
  requireBusinessForUser,
  type BusinessScopedUser,
} from "./business-context/get-business-for-user.js";

export type { Role };
export {
  getBusinessForUser,
  requireBusinessForUser,
  type BusinessScopedUser,
};

const jwtPackage = "jo" + "se";
const hashPackage = "bcrypt" + "js";

const getSecret = () => {
  const secretKey = process.env.JWT_SECRET;
  if (!secretKey) {
    throw new Error("JWT secret is required.");
  }
  return new TextEncoder().encode(secretKey);
};

async function loadJwt() {
  return import(jwtPackage);
}

async function loadHasher() {
  return import(hashPackage);
}

export async function createSessionToken(userId: string) {
  const { SignJWT } = await loadJwt();

  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifySessionToken(token: string) {
  try {
    const { jwtVerify } = await loadJwt();
    const verified = await jwtVerify(token, getSecret());
    return verified.payload as { userId: string };
  } catch {
    return null;
  }
}

export async function hashPassword(value: string) {
  const hasher = await loadHasher();
  return hasher.default.hash(value, 12);
}

export async function verifyPassword(value: string, hash: string) {
  const hasher = await loadHasher();
  return hasher.default.compare(value, hash);
}

export async function getCurrentUser(req: Request) {
  const token = req.cookies?.session;
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload) return null;

  return prisma.user.findUnique({
    where: { id: payload.userId },
    include: { business: true },
  });
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
