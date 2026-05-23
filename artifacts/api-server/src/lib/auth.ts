import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import type { Request, Response, NextFunction } from "express";
import { prisma } from "./prisma.js";

const getSecret = () => {
  const secretKey = process.env.JWT_SECRET ?? "default-secret-change-me";
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

export type Role = "OWNER" | "MANAGER" | "CASHIER" | "KITCHEN" | "SERVER";

export async function requireRole(
  req: Request,
  res: Response,
  allowedRoles: Role[]
) {
  const user = await getCurrentUser(req);
  if (!user) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return null;
  }
  if (!allowedRoles.includes(user.role as Role)) {
    res.status(403).json({ success: false, message: "Forbidden" });
    return null;
  }
  return user;
}

export async function getRestaurantForUser(user: {
  id: string;
  role: string;
  restaurantId: string | null;
}) {
  return prisma.restaurant.findFirst({
    where:
      user.role === "OWNER"
        ? { ownerId: user.id }
        : { id: user.restaurantId ?? "" },
  });
}
