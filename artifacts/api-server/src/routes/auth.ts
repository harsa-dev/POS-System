import { Router, type Request } from "express";

import { prisma } from "../lib/prisma.js";
import {
  createSessionToken,
  hashPassword,
  requireAuth,
  revokeSessionToken,
  sanitizeUser,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_MS,
  verifyPassword,
} from "../lib/auth.js";
import { createBusinessWithRestaurantProfile } from "../lib/business-context/create-business-with-profile.js";
import { errorCodes } from "../lib/errors/error-codes.js";
import { handleApiError } from "../lib/errors/handle-api-error.js";
import {
  authRateLimitConfig,
  enforceRateLimit,
  getRequestIp,
  hashRateLimitIdentifier,
} from "../lib/rate-limit.js";
import { successResponse } from "../lib/responses/success-response.js";
import { errorResponse } from "../lib/responses/error-response.js";

const router = Router();
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

function getRateLimitedIpKey(req: Request, action: "login" | "register") {
  const ipHash = hashRateLimitIdentifier(getRequestIp(req));
  return `rate:auth:${action}:ip:${ipHash}`;
}

function getRateLimitedEmailKey(action: "login", email: string) {
  const emailHash = hashRateLimitIdentifier(email);
  return `rate:auth:${action}:email:${emailHash}`;
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

    enforceRateLimit({
      key: getRateLimitedIpKey(req, "login"),
      ...authRateLimitConfig.loginByIp,
    });

    if (!normalizedEmail || typeof password !== "string" || !password) {
      return errorResponse(res, {
        status: 400,
        code: errorCodes.validationError,
        message: "Email dan password wajib diisi.",
      });
    }

    enforceRateLimit({
      key: getRateLimitedEmailKey("login", normalizedEmail),
      ...authRateLimitConfig.loginByEmail,
    });

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

    res.cookie(SESSION_COOKIE_NAME, token, {
      ...getSessionCookieOptions(),
      maxAge: SESSION_MAX_AGE_MS,
    });

    return successResponse(res, {
      message: "Login berhasil.",
      data: sanitizeUser(user),
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/auth/logout", async (req, res) => {
  try {
    await revokeSessionToken(req.cookies?.[SESSION_COOKIE_NAME]);

    res.clearCookie(SESSION_COOKIE_NAME, getSessionCookieOptions());

    return successResponse(res, {
      message: "Logout berhasil.",
      data: null,
    });
  } catch (error) {
    return handleApiError(res, error);
  }
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

    enforceRateLimit({
      key: getRateLimitedIpKey(req, "register"),
      ...authRateLimitConfig.registerByIp,
    });

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
