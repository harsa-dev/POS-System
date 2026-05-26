import { Router } from "express";
import crypto from "crypto";
import { prisma } from "../lib/prisma.js";
import { requireRole, getRestaurantForUser, getCurrentUser } from "../lib/auth.js";
import { apiFetch } from "@/lib/api";

const router = Router();

// POST /api/payments/create-transaction
// Creates a Midtrans Snap transaction for non-cash orders.
// Body: { orderId, total, customerName }
// Returns: { success, redirectUrl }
router.post("/payments/create-transaction", async (req, res) => {
  try {
    const user = await requireRole(req, res, ["OWNER", "MANAGER", "CASHIER"]);
    if (!user) return;
    const restaurant = await getRestaurantForUser(user);
    if (!restaurant)
      return void res.status(404).json({ success: false, message: "Restaurant not found" });

    if (!restaurant.midtransEnabled || !restaurant.midtransServerKey)
      return void res.status(400).json({ success: false, message: "Midtrans is not enabled for this restaurant" });

    const { orderId, total, customerName } = req.body ?? {};
    if (!orderId || !total)
      return void res.status(400).json({ success: false, message: "orderId and total are required" });

    const order = await prisma.order.findFirst({
      where: { id: String(orderId), restaurantId: restaurant.id },
    });
    if (!order)
      return void res.status(404).json({ success: false, message: "Order not found" });

    const serverKey = restaurant.midtransServerKey;
    const isProduction = process.env.MIDTRANS_ENV === "production";
    const snapBaseUrl = isProduction
      ? "https://app.midtrans.com/snap/v1/transactions"
      : "https://app.sandbox.midtrans.com/snap/v1/transactions";

    const authHeader = `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`;

    const snapBody = {
      transaction_details: {
        order_id: order.id,
        gross_amount: Number(total),
      },
      customer_details: {
        first_name: String(customerName || "Customer"),
      },
    };

    const snapRes = await apiFetch(snapBaseUrl, {
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
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message ?? "Failed to create payment transaction" });
  }
});

// POST /api/payments/midtrans-webhook
// Receives Midtrans payment status notifications, verifies the signature,
// and updates the order + payment record accordingly.
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
      return void res.status(404).json({ success: false, message: "Order not found" });

    const serverKey = order.restaurant.midtransServerKey;
    if (!serverKey)
      return void res.status(400).json({ success: false, message: "Midtrans not configured for this restaurant" });

    const expectedSignature = crypto
      .createHash("sha512")
      .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
      .digest("hex");

    if (expectedSignature !== receivedSignature)
      return void res.status(403).json({ success: false, message: "Invalid signature" });

    let paymentStatus: "PENDING" | "PAID" | "FAILED" | "EXPIRED" = "PENDING";
    let orderStatus: string | null = null;

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
        data: { status: orderStatus as any },
      });
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message ?? "Webhook processing failed" });
  }
});

export default router;
