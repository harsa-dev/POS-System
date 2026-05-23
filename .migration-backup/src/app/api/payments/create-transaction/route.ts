import { NextResponse } from "next/server";
import midtransClient from "midtrans-client";
import { OrderStatus } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/get-current-user";

const snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY!,
});

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 },
      );
    }

    if (!process.env.MIDTRANS_SERVER_KEY) {
      return NextResponse.json(
        {
          success: false,
          message: "Midtrans server key is not configured",
        },
        { status: 500 },
      );
    }

    if (!process.env.NEXT_PUBLIC_APP_URL) {
      return NextResponse.json(
        {
          success: false,
          message: "App URL is not configured",
        },
        { status: 500 },
      );
    }

    const restaurant = await prisma.restaurant.findFirst({
      where:
        user.role === "OWNER"
          ? { ownerId: user.id }
          : { id: user.restaurantId ?? "" },
    });

    if (!restaurant) {
      return NextResponse.json(
        {
          success: false,
          message: "Restaurant not found",
        },
        { status: 404 },
      );
    }

    if (!restaurant.midtransEnabled) {
      return NextResponse.json(
        {
          success: false,
          message: "Online payment is disabled",
        },
        { status: 400 },
      );
    }

    const body = await req.json();

    const orderId = String(body.orderId ?? "");

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          message: "Order ID is required",
        },
        { status: 400 },
      );
    }

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        restaurantId: restaurant.id,
      },
      include: {
        payment: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message: "Order not found",
        },
        { status: 404 },
      );
    }

    if (order.status === OrderStatus.CANCELLED) {
      return NextResponse.json(
        {
          success: false,
          message: "Cannot create payment for cancelled order",
        },
        { status: 400 },
      );
    }

    if (
      order.status === OrderStatus.PAID ||
      order.status === OrderStatus.PREPARING ||
      order.status === OrderStatus.READY ||
      order.status === OrderStatus.SERVED ||
      order.status === OrderStatus.COMPLETED
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Order is already paid or processed",
        },
        { status: 400 },
      );
    }

    if (!order.payment) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment record not found",
        },
        { status: 404 },
      );
    }

    if (order.total <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid order total",
        },
        { status: 400 },
      );
    }

    const transaction = await snap.createTransaction({
      transaction_details: {
        order_id: order.id,
        gross_amount: order.total,
      },

      customer_details: {
        first_name: body.customerName || "Customer",
      },

      callbacks: {
        finish: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/orders/${order.id}`,
      },

      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/midtrans-webhook`,
    });

    await prisma.payment.update({
      where: {
        orderId: order.id,
      },
      data: {
        paymentUrl: transaction.redirect_url,
      },
    });

    return NextResponse.json({
      success: true,
      token: transaction.token,
      redirectUrl: transaction.redirect_url,
    });
  } catch (error) {
    console.error("[CREATE_TRANSACTION_ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create transaction",
      },
      { status: 500 },
    );
  }
}