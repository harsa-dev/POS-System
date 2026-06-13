import crypto from "crypto";
import type { OrderStatus, PaymentStatus } from "@prisma/client";
import { Router } from "express";

import { requireRole } from "../lib/auth.js";
import { createBusinessScopeWhere, requireBusinessContextForUser } from "../lib/business-context/index.js";
import { POS_ROLES } from "../lib/constants.js";
import { errorCodes } from "../lib/errors/error-codes.js";
import { handleApiError } from "../lib/errors/handle-api-error.js";
import { prisma } from "../lib/prisma.js";
import { errorResponse } from "../lib/responses/error-response.js";
import { successResponse } from "../lib/responses/success-response.js";
import { createCashflowEntryRecord } from "../services/cashflow/cashflow.repository.js";
import { mapPaymentMethodToAccount } from "../services/cashflow/cashflow.validation.js";

const router = Router();

router.get("/payments", async (req, res) => {
  try {
    const user = await requireRole(req, res, POS_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const payments = await prisma.payment.findMany({
      where: { order: createBusinessScopeWhere(businessContext) },
      include: { order: true },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(res, { data: payments });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/payments/create-transaction", async (req, res) => {
  try {
    const user = await requireRole(req, res, POS_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const restaurantProfile = businessContext.business.restaurant;

    if (!restaurantProfile?.midtransEnabled || !restaurantProfile.midtransServerKey) {
      return void errorResponse(res, {
        status: 400,
        code: errorCodes.paymentProviderNotConfigured,
        message: "Midtrans is not enabled for this business.",
      });
    }

    const { orderId, customerName } = req.body ?? {};
    if (!orderId) {
      return void errorResponse(res, {
        status: 400,
        code: errorCodes.validationError,
        message: "orderId is required.",
      });
    }

    const order = await prisma.order.findFirst({
      where: { id: String(orderId), businessId: businessContext.businessId },
    });

    if (!order) {
      return void errorResponse(res, {
        status: 404,
        code: errorCodes.orderNotFound,
        message: "Order not found.",
      });
    }

    const serverKey = restaurantProfile.midtransServerKey;
    const isProduction = process.env.MIDTRANS_ENV === "production";
    const snapBaseUrl = isProduction
      ? "https://app.midtrans.com/snap/v1/transactions"
      : "https://app.sandbox.midtrans.com/snap/v1/transactions";

    const snapRes = await fetch(snapBaseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`,
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: order.id,
          gross_amount: order.total,
        },
        customer_details: {
          first_name: String(customerName || "Customer"),
        },
      }),
    });

    const snapData = await snapRes.json() as {
      token?: string;
      redirect_url?: string;
      error_messages?: string[];
    };

    if (!snapRes.ok || !snapData.redirect_url) {
      return void errorResponse(res, {
        status: 502,
        code: errorCodes.paymentProviderError,
        message: snapData.error_messages?.join(", ") ?? "Midtrans transaction creation failed.",
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

    return void res.json({ success: true, redirectUrl: snapData.redirect_url });
  } catch (error) {
    return handleApiError(res, error);
  }
});

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
      include: {
        payment: true,
        business: { include: { restaurant: true } },
      },
    });

    if (!order?.business.restaurant) {
      return void errorResponse(res, {
        status: 404,
        code: errorCodes.orderNotFound,
        message: "Order not found.",
      });
    }

    const serverKey = order.business.restaurant.midtransServerKey;
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

    const grossAmount = Number(gross_amount);
    if (!Number.isFinite(grossAmount) || Math.round(grossAmount) !== order.total) {
      return void errorResponse(res, {
        status: 400,
        code: errorCodes.validationError,
        message: "Webhook amount does not match the order total.",
      });
    }

    let paymentStatus: PaymentStatus = "PENDING";
    let orderStatus: OrderStatus | null = null;

    const isPending = transaction_status === "pending";
    const isSettled =
      transaction_status === "settlement" ||
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

    const paidAt = isSettled ? new Date() : null;

    await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.upsert({
        where: { orderId: order.id },
        create: {
          orderId: order.id,
          provider: "MIDTRANS",
          method: order.paymentMethod,
          status: paymentStatus,
          externalId: body.transaction_id ?? null,
          paidAt,
        },
        update: {
          status: paymentStatus,
          externalId: body.transaction_id ?? undefined,
          paidAt: paidAt ?? undefined,
        },
      });

      if (orderStatus && order.status !== orderStatus) {
        await tx.order.update({
          where: { id: order.id },
          data: { status: orderStatus },
        });
      }

      if (isSettled) {
        await createCashflowEntryRecord(tx, {
          id: crypto.randomUUID(),
          businessId: order.businessId,
          sourceType: "PAYMENT_WEBHOOK",
          sourceId: order.id,
          idempotencyKey: `ORDER_PAYMENT:${order.id}`,
          account: mapPaymentMethodToAccount(order.paymentMethod),
          type: "INCOME",
          status: "POSTED",
          category: "Sales",
          counterpartyName: `Order #${order.orderNumber}`,
          description: `Midtrans settlement for order #${order.orderNumber}`,
          amount: order.total,
          occurredAt: paidAt ?? new Date(),
          postedAt: paidAt ?? new Date(),
          createdById: null,
          metadata: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            paymentId: payment.id,
            paymentStatus,
            paymentMethod: order.paymentMethod,
            transactionStatus: transaction_status,
            fraudStatus: fraud_status ?? null,
            externalId: body.transaction_id ?? null,
            syncedBy: "midtrans-webhook",
          },
        });
      }
    });

    return void res.json({ success: true });
  } catch (error) {
    return handleApiError(res, error);
  }
});

export default router;
