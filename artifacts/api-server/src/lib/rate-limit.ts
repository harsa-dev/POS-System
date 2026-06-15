import { createHash } from "node:crypto";
import type { Request } from "express";

import { AppError } from "./errors/app-error.js";
import { errorCodes } from "./errors/error-codes.js";

export type RateLimitConfig = {
  key: string;
  limit: number;
  windowMs: number;
};

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const rateLimitBuckets = new Map<string, RateLimitBucket>();

export const authRateLimitConfig = {
  loginByIp: {
    limit: 10,
    windowMs: 60_000,
  },
  loginByEmail: {
    limit: 5,
    windowMs: 5 * 60_000,
  },
  registerByIp: {
    limit: 3,
    windowMs: 60 * 60_000,
  },
} as const;

export function hashRateLimitIdentifier(value: string) {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

export function getRequestIp(req: Request) {
  const forwardedFor = req.headers["x-forwarded-for"];

  if (Array.isArray(forwardedFor) && forwardedFor[0]) {
    return forwardedFor[0].split(",")[0]?.trim() || "unknown";
  }

  if (typeof forwardedFor === "string" && forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return req.ip || req.socket.remoteAddress || "unknown";
}

export function enforceRateLimit({ key, limit, windowMs }: RateLimitConfig) {
  const now = Date.now();
  const existing = rateLimitBuckets.get(key);

  if (!existing || existing.resetAt <= now) {
    rateLimitBuckets.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return;
  }

  existing.count += 1;

  if (existing.count <= limit) {
    return;
  }

  const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));

  throw new AppError({
    statusCode: 429,
    code: errorCodes.rateLimited,
    message: "Too many requests. Please try again later.",
    details: {
      retryAfterSeconds,
    },
  });
}

export function pruneRateLimitBuckets(now = Date.now()) {
  let deleted = 0;

  for (const [key, bucket] of rateLimitBuckets) {
    if (bucket.resetAt <= now) {
      rateLimitBuckets.delete(key);
      deleted += 1;
    }
  }

  return deleted;
}
