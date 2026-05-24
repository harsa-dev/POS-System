import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";

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
    res.json({
      success: true,
      status: "healthy",
      uptime,
      database: "connected",
      environment,
      timestamp,
    });
  } catch (err) {
    logger.error({ err }, "GET /health database check failed");
    res.status(503).json({
      success: false,
      status: "unhealthy",
      uptime,
      database: "unreachable",
      environment,
      timestamp,
    });
  }
});

export default router;
