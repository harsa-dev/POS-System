import { Router } from "express";

import { requireRole } from "../lib/auth.js";
import { createRestaurantScopeWhere, requireBusinessContextForUser } from "../lib/business-context/index.js";
import { MANAGEMENT_AND_SERVER_ROLES, MANAGEMENT_ROLES, OPS_ROLES } from "../lib/constants.js";
import { errorCodes } from "../lib/errors/error-codes.js";
import { handleApiError } from "../lib/errors/handle-api-error.js";
import { prisma } from "../lib/prisma.js";
import { realtime } from "../lib/realtime.js";
import { REALTIME_EVENTS } from "../lib/realtime-events.js";
import { errorResponse } from "../lib/responses/error-response.js";
import { successResponse } from "../lib/responses/success-response.js";

const router = Router();

router.get("/tables", async (req, res) => {
  try {
    const user = await requireRole(req, res, OPS_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);

    const tables = await prisma.diningTable.findMany({
      where: createRestaurantScopeWhere(businessContext),
      orderBy: { createdAt: "desc" },
    });

    return successResponse(res, { data: tables });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/tables", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const name = String(req.body?.name ?? "").trim();
    const capacity = Number(req.body?.capacity ?? 2);

    if (!name) {
      return errorResponse(res, {
        status: 400,
        code: errorCodes.validationError,
        message: "Table name is required.",
      });
    }

    if (capacity <= 0) {
      return errorResponse(res, {
        status: 400,
        code: errorCodes.validationError,
        message: "Capacity must be greater than 0.",
      });
    }

    const table = await prisma.diningTable.create({
      data: {
        name,
        capacity,
        status: "AVAILABLE",
        restaurantId: businessContext.restaurantId,
      },
    });

    return successResponse(res, { data: table, status: 201 });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.patch("/tables/:id", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const { id } = req.params;

    const existing = await prisma.diningTable.findFirst({
      where: {
        id,
        ...createRestaurantScopeWhere(businessContext),
      },
    });

    if (!existing) {
      return errorResponse(res, {
        status: 404,
        code: errorCodes.notFound,
        message: "Table not found.",
      });
    }

    const { name, capacity, status, isActive } = req.body ?? {};
    const table = await prisma.diningTable.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(capacity !== undefined ? { capacity: Number(capacity) } : {}),
        ...(status ? { status } : {}),
        ...(typeof isActive === "boolean" ? { isActive } : {}),
      },
    });

    return successResponse(res, { data: table });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.delete("/tables/:id", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const { id } = req.params;

    const existing = await prisma.diningTable.findFirst({
      where: {
        id,
        ...createRestaurantScopeWhere(businessContext),
      },
    });

    if (!existing) {
      return errorResponse(res, {
        status: 404,
        code: errorCodes.notFound,
        message: "Table not found.",
      });
    }

    const table = await prisma.diningTable.update({
      where: { id },
      data: { isActive: false, status: "INACTIVE" },
    });

    return successResponse(res, {
      data: table,
      message: "Table deactivated.",
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.patch("/tables/:id/mark-clean", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_AND_SERVER_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const { id } = req.params;

    const table = await prisma.diningTable.findFirst({
      where: {
        id,
        ...createRestaurantScopeWhere(businessContext),
      },
    });

    if (!table) {
      return errorResponse(res, {
        status: 404,
        code: errorCodes.notFound,
        message: "Table not found.",
      });
    }

    if (table.status !== "CLEANING") {
      return errorResponse(res, {
        status: 400,
        code: errorCodes.badRequest,
        message: "Table is not cleaning.",
      });
    }

    const updated = await prisma.diningTable.update({
      where: { id },
      data: { status: "AVAILABLE" },
    });

    realtime.broadcast(businessContext.businessId, REALTIME_EVENTS.TABLE_UPDATED, {
      id,
      status: "AVAILABLE",
    });

    return successResponse(res, { data: updated });
  } catch (error) {
    return handleApiError(res, error);
  }
});

export default router;
