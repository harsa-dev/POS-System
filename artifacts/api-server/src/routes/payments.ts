import { Router } from "express";
import crypto from "crypto";
import type { OrderStatus, PaymentStatus } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { requireRole, getRestaurantForUser, getCurrentUser } from "../lib/auth.js";
import { POS_ROLES, ERR } from "../lib/constants.js";

const router = Router();

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

// POST /api/payments/create-transaction
// Creates a Midtrans Snap transaction for non-cash orders.
// Body: { orderId, total, customerName }
// Returns: { success, redirectUrl }
router.post("/payments/create-transaction", async (req, res) => {
  try {
    const user = await requireRole(req, res, POS_ROLES);
    if (!user) return;
    const restaurant = await getRestaurantForUser(user);
    if (!restaurant)
      return void res.status(404).json({ success: false, message: ERR.RESTAURANT_NOT_FOUND });

    if (!restaurant.midtransEnabled || !restaurant.midtransServerKey)
      return void res.status(400).json({ success: false, message: "Midtrans is not enabled for this restaurant" });

    // Bug #1 fix: only orderId is required from the client; total is taken from
    // the authoritative order record, never from the request body. This prevents
    // a caller from submitting a manipulated charge amount to Midtrans.
    const { orderId, customerName } = req.body ?? {};
    if (!orderId)
      return void res.status(400).json({ success: false, message: "orderId is required" });

    const order = await prisma.order.findFirst({
      where: { id: String(orderId), restaurantId: restaurant.id },
    });
    if (!order)
      return void res.status(404).json({ success: false, message: ERR.ORDER_NOT_FOUND });

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
      const msg = snapData.error_messages?.join(", ") ?? "Midtrans transaction creation failed";
      return void res.status(502).json({ success: false, message: msg });
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

    res.json({ success: true, redirectUrl: snapData.redirect_url });
  } catch (err: unknown) {
    res.status(500).json({ success: false, message: getErrorMessage(err, "Failed to create payment transaction") });
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

    if (!order_id || !status_code || !gross_amount || !receivedSignature)
      return void res.status(400).json({ success: false, message: "Missing required notification fields" });

    const order = await prisma.order.findFirst({
      where: { id: String(order_id) },
      include: { restaurant: true },
    });

    if (!order || !order.restaurant)
      return void res.status(404).json({ success: false, message: ERR.ORDER_NOT_FOUND });

    const serverKey = order.restaurant.midtransServerKey;
    if (!serverKey)
      return void res.status(400).json({ success: false, message: "Midtrans not configured for this restaurant" });

    const expectedSignature = crypto
      .createHash("sha512")
      .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
      .digest("hex");

    if (expectedSignature !== receivedSignature)
      return void res.status(403).json({ success: false, message: "Invalid signature" });

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

    res.json({ success: true });
  } catch (err: unknown) {
    res.status(500).json({ success: false, message: getErrorMessage(err, "Webhook processing failed") });
  }
});

export default router;
