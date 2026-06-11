import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";

import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";
import { errorCodes } from "../lib/errors/error-codes.js";
import { successResponse } from "../lib/responses/success-response.js";
import { errorResponse } from "../lib/responses/error-response.js";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

router.get("/health", async (_req, res) => {
  const uptime = process.uptime();
  const environment = process.env.NODE_ENV ?? "development";
  const timestamp = new Date().toISOString();

  try {
    await prisma.$queryRaw`SELECT 1`;

    return successResponse(res, {
      data: {
        status: "healthy",
        uptime,
        database: "connected",
        environment,
        timestamp,
      },
    });
  } catch (err) {
    logger.error({ err }, "GET /health database check failed");

    return errorResponse(res, {
      status: 503,
      code: errorCodes.serviceUnavailable,
      message: "Service unavailable.",
      details: {
        status: "unhealthy",
        uptime,
        database: "unreachable",
        environment,
        timestamp,
      },
    });
  }
});

export default router;
