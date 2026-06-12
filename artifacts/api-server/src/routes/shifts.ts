import { Prisma } from "@prisma/client";
import { Router } from "express";

import { requireRole } from "../lib/auth.js";
import { createRestaurantScopeWhere, requireBusinessContextForUser } from "../lib/business-context/index.js";
import { POS_ROLES } from "../lib/constants.js";
import { errorCodes } from "../lib/errors/error-codes.js";
import { handleApiError } from "../lib/errors/handle-api-error.js";
import { prisma } from "../lib/prisma.js";
import { errorResponse } from "../lib/responses/error-response.js";
import { successResponse } from "../lib/responses/success-response.js";

const router = Router();

router.get("/shifts", async (req, res) => {
  try {
    const user = await requireRole(req, res, POS_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);

    const shifts = await prisma.shift.findMany({
      where: createRestaurantScopeWhere(businessContext),
      include: {
        user: { select: { name: true, email: true } },
        orders: { select: { id: true, total: true, paymentMethod: true, status: true } },
      },
      orderBy: { openedAt: "desc" },
    });

    const shiftIds = shifts.map((shift) => shift.id);
    const syncedRows = shiftIds.length
      ? await prisma.$queryRaw<Array<{ sourceId: string }>>`
          SELECT "sourceId"
          FROM "CashflowEntry"
          WHERE "restaurantId" = ${businessContext.restaurantId}
            AND "sourceType" = CAST('SHIFT_CLOSE' AS "CashflowSourceType")
            AND "status" != CAST('VOIDED' AS "CashflowEntryStatus")
            AND "sourceId" IN (${Prisma.join(shiftIds)})
        `
      : [];
    const syncedShiftIds = new Set(syncedRows.map((row) => row.sourceId));

    return successResponse(res, {
      data: shifts.map((shift) => ({
        ...shift,
        cashflowSynced: syncedShiftIds.has(shift.id),
      })),
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/shifts/open", async (req, res) => {
  try {
    const user = await requireRole(req, res, POS_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const openingCash = Number(req.body?.openingCash ?? 0);

    if (openingCash < 0) {
      return errorResponse(res, {
        status: 400,
        code: errorCodes.validationError,
        message: "Opening cash cannot be negative.",
      });
    }

    const existing = await prisma.shift.findFirst({
      where: {
        userId: user.id,
        status: "OPEN",
        ...createRestaurantScopeWhere(businessContext),
      },
    });

    if (existing) {
      return errorResponse(res, {
        status: 409,
        code: errorCodes.conflict,
        message: "You already have an open shift.",
      });
    }

    const shift = await prisma.shift.create({
      data: {
        userId: user.id,
        restaurantId: businessContext.restaurantId,
        openingCash,
        expectedCash: openingCash,
        status: "OPEN",
      },
    });

    return successResponse(res, { data: shift, status: 201 });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/shifts/current", async (req, res) => {
  try {
    const user = await requireRole(req, res, POS_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);

    const shift = await prisma.shift.findFirst({
      where: {
        userId: user.id,
        status: "OPEN",
        ...createRestaurantScopeWhere(businessContext),
      },
      include: { orders: true },
      orderBy: { openedAt: "desc" },
    });

    return successResponse(res, { data: shift });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.patch("/shifts/:id/close", async (req, res) => {
  try {
    const user = await requireRole(req, res, POS_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const { id } = req.params;

    const shift = await prisma.shift.findFirst({
      where: {
        id,
        ...createRestaurantScopeWhere(businessContext),
      },
      include: {
        orders: { select: { id: true, total: true, paymentMethod: true, status: true } },
      },
    });

    if (!shift) {
      return errorResponse(res, {
        status: 404,
        code: errorCodes.notFound,
        message: "Shift not found.",
      });
    }

    if (shift.status === "CLOSED") {
      return errorResponse(res, {
        status: 409,
        code: errorCodes.conflict,
        message: "Shift already closed.",
      });
    }

    const closingCash = Number(req.body?.closingCash ?? 0);

    if (closingCash < 0) {
      return errorResponse(res, {
        status: 400,
        code: errorCodes.validationError,
        message: "Closing cash cannot be negative.",
      });
    }

    const cashOrders = shift.orders.filter(
      (order) =>
        order.paymentMethod === "CASH" &&
        order.status !== "CANCELLED" &&
        order.status !== "PENDING_PAYMENT"
    );

    const cashSales = cashOrders.reduce((total, order) => total + order.total, 0);
    const expectedCash = shift.openingCash + cashSales;
    const cashDifference = closingCash - expectedCash;

    const updatedShift = await prisma.shift.update({
      where: { id },
      data: {
        status: "CLOSED",
        closingCash,
        expectedCash,
        cashDifference,
        closedAt: new Date(),
      },
    });

    return successResponse(res, {
      data: {
        shift: updatedShift,
        summary: {
          openingCash: shift.openingCash,
          cashSales,
          expectedCash,
          closingCash,
          cashDifference,
          orderCount: cashOrders.length,
        },
      },
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

export default router;
