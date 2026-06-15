import { Router } from "express";

import { prisma } from "../lib/prisma.js";
import {
  createSessionToken,
  hashPassword,
  requireAuth,
  sanitizeUser,
  verifyPassword,
} from "../lib/auth.js";
import { createBusinessWithRestaurantProfile } from "../lib/business-context/create-business-with-profile.js";
import { errorCodes } from "../lib/errors/error-codes.js";
import { handleApiError } from "../lib/errors/handle-api-error.js";
import { successResponse } from "../lib/responses/success-response.js";
import { errorResponse } from "../lib/responses/error-response.js";

const router = Router();
const sessionCookieMaxAgeMs = 60 * 60 * 24 * 7 * 1000;
const invalidLoginMessage = "Email atau password salah.";

function getSessionCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
  } as const;
}

function invalidCredentialsResponse(res: Parameters<typeof errorResponse>[0]) {
  return errorResponse(res, {
    status: 401,
    code: errorCodes.invalidCredentials,
    message: invalidLoginMessage,
  });
}

router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body ?? {};
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!normalizedEmail || typeof password !== "string" || !password) {
      return errorResponse(res, {
        status: 400,
        code: errorCodes.validationError,
        message: "Email dan password wajib diisi.",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { business: true },
    });
    const isValidPassword = user
      ? await verifyPassword(password, user.passwordHash)
      : false;

    if (!user || !isValidPassword) {
      return invalidCredentialsResponse(res);
    }

    if (!user.isActive || (user.businessId && (!user.business || !user.business.isActive))) {
      return invalidCredentialsResponse(res);
    }

    const token = await createSessionToken(user.id);

    res.cookie("session", token, {
      ...getSessionCookieOptions(),
      maxAge: sessionCookieMaxAgeMs,
    });

    return successResponse(res, {
      message: "Login berhasil.",
      data: sanitizeUser(user),
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/auth/logout", (_req, res) => {
  res.clearCookie("session", getSessionCookieOptions());

  return successResponse(res, {
    message: "Logout berhasil.",
    data: null,
  });
});

router.get("/auth/me", async (req, res) => {
  try {
    const user = await requireAuth(req);

    return successResponse(res, {
      data: sanitizeUser(user),
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body ?? {};
    const normalizedName = typeof name === "string" ? name.trim() : "";
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!normalizedName || !normalizedEmail || typeof password !== "string" || !password) {
      return errorResponse(res, {
        status: 400,
        code: errorCodes.validationError,
        message: "Invalid input.",
      });
    }

    if (password.length < 8) {
      return errorResponse(res, {
        status: 400,
        code: errorCodes.passwordTooWeak,
        message: "Password must be at least 8 characters.",
      });
    }

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (existing) {
      return errorResponse(res, {
        status: 409,
        code: errorCodes.emailAlreadyExists,
        message: "Email already registered.",
      });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: { name: normalizedName, email: normalizedEmail, passwordHash, role: "OWNER" },
      });

      const businessName = `${normalizedName}'s Business`;
      const business = await createBusinessWithRestaurantProfile(tx, {
        name: businessName,
        ownerId: newUser.id,
      });

      return tx.user.update({
        where: { id: newUser.id },
        data: { businessId: business.id },
        include: { business: true },
      });
    });

    return successResponse(res, {
      status: 201,
      message: "User registered successfully.",
      data: sanitizeUser(user),
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

export default router;
