import { Router } from "express";

import { prisma } from "../lib/prisma.js";
import {
  createSessionToken,
  hashPassword,
  verifyPassword,
  getCurrentUser,
} from "../lib/auth.js";
import { errorCodes } from "../lib/errors/error-codes.js";
import { handleApiError } from "../lib/errors/handle-api-error.js";
import { successResponse } from "../lib/responses/success-response.js";
import { errorResponse } from "../lib/responses/error-response.js";

const router = Router();
const sessionCookieMaxAgeMs = 60 * 60 * 24 * 7 * 1000;

function getSessionCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
  } as const;
}

router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      return errorResponse(res, {
        status: 400,
        code: errorCodes.validationError,
        message: "Email dan password wajib diisi.",
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    const isValidPassword = user
      ? await verifyPassword(password, user.passwordHash)
      : false;

    if (!user || !isValidPassword) {
      return errorResponse(res, {
        status: 401,
        code: errorCodes.invalidCredentials,
        message: "Email atau password salah.",
      });
    }

    if (!user.isActive) {
      return errorResponse(res, {
        status: 403,
        code: errorCodes.userInactive,
        message: "Akun ini sudah dinonaktifkan.",
      });
    }

    const token = await createSessionToken(user.id);

    res.cookie("session", token, {
      ...getSessionCookieOptions(),
      maxAge: sessionCookieMaxAgeMs,
    });

    return successResponse(res, {
      message: "Login berhasil.",
      data: null,
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
    const user = await getCurrentUser(req);

    if (!user) {
      return errorResponse(res, {
        status: 401,
        code: errorCodes.unauthorized,
        message: "Unauthorized.",
      });
    }

    const { passwordHash, ...safeUser } = user;

    return successResponse(res, {
      data: safeUser,
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body ?? {};

    if (!name || !email || !password) {
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

    const existing = await prisma.user.findUnique({ where: { email } });

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
        data: { name, email, passwordHash, role: "OWNER" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      const restaurant = await tx.restaurant.create({
        data: { name: `${name}'s Restaurant`, ownerId: newUser.id },
      });

      await tx.user.update({
        where: { id: newUser.id },
        data: { restaurantId: restaurant.id },
      });

      return newUser;
    });

    return successResponse(res, {
      status: 201,
      message: "User registered successfully.",
      data: user,
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

export default router;
