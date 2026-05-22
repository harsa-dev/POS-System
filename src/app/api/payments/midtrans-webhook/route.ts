import crypto from "crypto";

import { NextResponse } from "next/server";

import { OrderStatus, PaymentStatus, StockMovementType } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

function verifySignature(body: {
  order_id?: string;
  status_code?: string;
  gross_amount?: string;
  signature_key?: string;
}) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;

  if (!serverKey) {
    return false;
  }

  if (
    !body.order_id ||
    !body.status_code ||
    !body.gross_amount ||
    !body.signature_key
  ) {
    return false;
  }

  const rawSignature =
    body.order_id + body.status_code + body.gross_amount + serverKey;

  const expectedSignature = crypto
    .createHash("sha512")
    .update(rawSignature)
    .digest("hex");

  return expectedSignature === body.signature_key;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log("[MIDTRANS_WEBHOOK_BODY]", body);

    const isValidSignature = verifySignature(body);

    if (!isValidSignature) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid signature",
        },
        {
          status: 403,
        },
      );
    }

    const orderId = body.order_id as string;
    const transactionStatus = body.transaction_status as string;
    const fraudStatus = body.fraud_status as string | undefined;

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing order_id",
        },
        {
          status: 400,
        },
      );
    }

    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
        payment: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message: "Order not found",
        },
        {
          status: 404,
        },
      );
    }

    if (order.status === OrderStatus.CANCELLED) {
      return NextResponse.json({
        success: true,
        message: "Order already cancelled",
      });
    }

    const isPaid =
      transactionStatus === "settlement" ||
      (transactionStatus === "capture" && fraudStatus === "accept");

    const isFailed =
      transactionStatus === "deny" ||
      transactionStatus === "cancel" ||
      transactionStatus === "expire";

    if (isFailed) {
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: {
            orderId: order.id,
          },
          data: {
            status:
              transactionStatus === "expire"
                ? PaymentStatus.EXPIRED
                : PaymentStatus.FAILED,
            externalId: body.transaction_id,
          },
        });

        await tx.order.update({
          where: {
            id: order.id,
          },
          data: {
            status: OrderStatus.CANCELLED,
            cancelReason: `Payment ${transactionStatus}`,
            cancelledAt: new Date(),
          },
        });
      });

      return NextResponse.json({
        success: true,
        message: "Payment failed or expired",
      });
    }

    if (!isPaid) {
      return NextResponse.json({
        success: true,
        message: "Payment not completed yet",
      });
    }

    if (order.payment?.status === PaymentStatus.PAID) {
      return NextResponse.json({
        success: true,
        message: "Order already paid",
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: {
          orderId: order.id,
        },
        data: {
          status: PaymentStatus.PAID,
          paidAt: new Date(),
          externalId: body.transaction_id,
        },
      });

      await tx.order.update({
        where: {
          id: order.id,
        },
        data: {
          status: OrderStatus.PAID,
          amountPaid: order.total,
          changeAmount: 0,
        },
      });

      for (const item of order.items) {
        await tx.menuItem.update({
          where: {
            id: item.menuItemId,
          },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });

        await tx.stockMovement.create({
          data: {
            menuItemId: item.menuItemId,
            type: StockMovementType.OUT,
            quantity: item.quantity,
            note: `Midtrans order #${order.orderNumber}`,
          },
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: "Payment confirmed",
    });
  } catch (error) {
    console.error("[MIDTRANS_WEBHOOK_ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        message: "Webhook error",
      },
      {
        status: 500,
      },
    );
  }
}
