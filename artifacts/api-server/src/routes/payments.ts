import { Router } from "express";
import crypto from "crypto";
import type { OrderStatus, PaymentStatus } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { requireRole } from "../lib/auth.js";
import { POS_ROLES } from "../lib/constants.js";
import { requireBusinessContextForUser } from "../lib/business-context/index.js";
import { errorCodes } from "../lib/errors/error-codes.js";
import { handleApiError } from "../lib/errors/handle-api-error.js";
import { errorResponse } from "../lib/responses/error-response.js";

const router = Router();

// POST /api/payments/create-transaction
// Creates a Midtrans Snap transaction for non-cash orders.
// Body: { orderId, total, customerName }
// Returns: { success, redirectUrl }
router.post("/payments/create-transaction", async (req, res) => {
  try {
    const user = await requireRole(req, res, POS_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const restaurant = businessContext.restaurant;

    if (!restaurant.midtransEnabled || !restaurant.midtransServerKey) {
      return void errorResponse(res, {
        status: 400,
        code: errorCodes.paymentProviderNotConfigured,
        message: "Midtrans is not enabled for this business.",
      });
    }

    // Bug #1 fix: only orderId is required from the client; total is taken from
    // the authoritative order record, never from the request body. This prevents
    // a caller from submitting a manipulated charge amount to Midtrans.
    const { orderId, customerName } = req.body ?? {};
    if (!orderId) {
      return void errorResponse(res, {
        status: 400,
        code: errorCodes.validationError,
        message: "orderId is required.",
      });
    }

    const order = await prisma.order.findFirst({
      where: { id: String(orderId), restaurantId: businessContext.businessId },
    });

    if (!order) {
      return void errorResponse(res, {
        status: 404,
        code: errorCodes.orderNotFound,
        message: "Order not found.",
      });
    }

    const serverKey = restaurant.midtransServerKey;
    const isProduction = process.env.MIDTRANS_ENV === "production";
    const snapBaseUrl = isProduction
      ? "https://app.midtrans.com/snap/v1/transactions"
      : "https://app.sandbox.midtrans.com/snap/v1/transactions";

    const authHeader = `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`;

    const snapBody = {
      transaction_details: {
        order_id: order.id,
        gross_amount: order.total, // always use the DB total, never the client-supplied value
      },
      customer_details: {
        first_name: String(customerName || "Customer"),
      },
    };

    const snapRes = await fetch(snapBaseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(snapBody),
    });

    const snapData = await snapRes.json() as { token?: string; redirect_url?: string; error_messages?: string[] };

    if (!snapRes.ok || !snapData.redirect_url) {
      const msg = snapData.error_messages?.join(", ") ?? "Midtrans transaction creation failed.";
      return void errorResponse(res, {
        status: 502,
        code: errorCodes.paymentProviderError,
        message: msg,
      });
    }

    await prisma.payment.upsert({
      where: { orderId: order.id },
      create: {
        orderId: order.id,
        provider: "MIDTRANS",
        method: order.paymentMethod,
        status: "PENDING",
        paymentUrl: snapData.redirect_url,
      },
      update: {
        paymentUrl: snapData.redirect_url,
        status: "PENDING",
      },
    });

    // Keep redirectUrl at the top level for backward compatibility with the
    // existing frontend payment API wrapper.
    return void res.json({ success: true, redirectUrl: snapData.redirect_url });
  } catch (err: unknown) {
    return handleApiError(res, err);
  }
});

// POST /api/payments/midtrans-webhook
// Receives Midtrans payment status notifications, verifies the signature,
// and updates the order + payment record accordingly.
//
// Bug #6 — Webhook AuditLog gap (documented, not yet fixed):
// When Midtrans settles or expires a payment the order status is updated here
// without writing an AuditLog entry. The AuditLog schema requires a non-null
// userId, and webhooks have no authenticated actor. Resolution options:
//   (a) Create a dedicated system/bot User row and use its ID for webhook logs.
//   (b) Make AuditLog.userId nullable in the schema (requires a migration).
// Until one of those is chosen, payment webhook status changes are NOT audited.
// All other status transitions (via PATCH /orders/:id/status) are audited.
router.post("/payments/midtrans-webhook", async (req, res) => {
  try {
    const body = req.body ?? {};
    const {
      order_id,
      status_code,
      gross_amount,
      signature_key: receivedSignature,
      transaction_status,
      fraud_status,
    } = body;

    if (!order_id || !status_code || !gross_amount || !receivedSignature) {
      return void errorResponse(res, {
        status: 400,
        code: errorCodes.paymentWebhookPayloadInvalid,
        message: "Missing required notification fields.",
      });
    }

    const order = await prisma.order.findFirst({
      where: { id: String(order_id) },
      include: { restaurant: true },
    });

    if (!order || !order.restaurant) {
      return void errorResponse(res, {
        status: 404,
        code: errorCodes.orderNotFound,
        message: "Order not found.",
      });
    }

    const serverKey = order.restaurant.midtransServerKey;
    if (!serverKey) {
      return void errorResponse(res, {
        status: 400,
        code: errorCodes.paymentProviderNotConfigured,
        message: "Midtrans is not configured for this business.",
      });
    }

    const expectedSignature = crypto
      .createHash("sha512")
      .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
      .digest("hex");

    if (expectedSignature !== receivedSignature) {
      return void errorResponse(res, {
        status: 403,
        code: errorCodes.paymentWebhookSignatureInvalid,
        message: "Invalid signature.",
      });
    }

    let paymentStatus: PaymentStatus = "PENDING";
    let orderStatus: OrderStatus | null = null;

    const isPending = transaction_status === "pending";
    const isSettled =
      (transaction_status === "settlement") ||
      (transaction_status === "capture" && fraud_status === "accept");
    const isFailed =
      transaction_status === "cancel" ||
      transaction_status === "deny" ||
      transaction_status === "failure";
    const isExpired = transaction_status === "expire";

    if (isSettled) {
      paymentStatus = "PAID";
      orderStatus = "PAID";
    } else if (isFailed) {
      paymentStatus = "FAILED";
      orderStatus = "CANCELLED";
    } else if (isExpired) {
      paymentStatus = "EXPIRED";
      orderStatus = "CANCELLED";
    } else if (isPending) {
      paymentStatus = "PENDING";
    }

    await prisma.payment.upsert({
      where: { orderId: order.id },
      create: {
        orderId: order.id,
        provider: "MIDTRANS",
        method: order.paymentMethod,
        status: paymentStatus,
        externalId: body.transaction_id ?? null,
        paidAt: isSettled ? new Date() : null,
      },
      update: {
        status: paymentStatus,
        externalId: body.transaction_id ?? undefined,
        paidAt: isSettled ? new Date() : undefined,
      },
    });

    if (orderStatus && order.status !== orderStatus) {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: orderStatus },
      });
    }

    return void res.json({ success: true });
  } catch (err: unknown) {
    return handleApiError(res, err);
  }
});

export default router;
