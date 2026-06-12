import { Router } from "express";
import type { OrderStatus } from "@prisma/client";

import { requireRole } from "../lib/auth.js";
import { requireBusinessContextForUser } from "../lib/business-context/index.js";
import { ALL_ROLES } from "../lib/constants.js";
import { errorCodes } from "../lib/errors/error-codes.js";
import { handleApiError } from "../lib/errors/handle-api-error.js";
import { errorResponse } from "../lib/responses/error-response.js";
import { successResponse } from "../lib/responses/success-response.js";
import { transitionOrderStatus } from "../services/orders/index.js";

const router = Router();

const orderStatuses: readonly OrderStatus[] = [
  "PENDING_PAYMENT",
  "PAID",
  "PREPARING",
  "READY",
  "SERVED",
  "COMPLETED",
  "CANCELLED",
];

function isOrderStatus(value: string): value is OrderStatus {
  return orderStatuses.includes(value as OrderStatus);
}

router.patch("/orders/:id/status", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);

    const orderId = String(req.params.id ?? "").trim();
    const statusValue = String(req.body?.status ?? "").trim();
    const cancelReason = String(req.body?.cancelReason ?? "").trim();

    if (!orderId) {
      return errorResponse(res, {
        status: 400,
        code: errorCodes.validationError,
        message: "Order id is required.",
      });
    }

    if (!isOrderStatus(statusValue)) {
      return errorResponse(res, {
        status: 400,
        code: errorCodes.validationError,
        message: "Invalid order status.",
      });
    }

    const result = await transitionOrderStatus({
      user,
      businessContext,
      orderId,
      nextStatus: statusValue,
      cancelReason,
    });

    return successResponse(res, {
      data: result,
      message: "Order status updated.",
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

export default router;
