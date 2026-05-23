import { NextResponse } from "next/server";
import { Role, ShiftStatus } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { requireApiRole } from "@/lib/auth/require-api-role";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(req: Request, { params }: Params) {
  try {
    const auth = await requireApiRole([Role.OWNER, Role.MANAGER, Role.CASHIER]);

    if (auth.error) {
      return NextResponse.json(
        {
          success: false,
          message: auth.error.message,
        },
        { status: auth.error.status },
      );
    }

    const user = auth.user;
    const { id } = await params;

    const restaurant = await prisma.restaurant.findFirst({
      where:
        user.role === Role.OWNER
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

    const shift = await prisma.shift.findFirst({
      where: {
        id,
        restaurantId: restaurant.id,
      },
      include: {
        orders: {
          select: {
            id: true,
            total: true,
            paymentMethod: true,
            status: true,
          },
        },
      },
    });

    if (!shift) {
      return NextResponse.json(
        {
          success: false,
          message: "Shift not found",
        },
        { status: 404 },
      );
    }

    if (shift.status === ShiftStatus.CLOSED) {
      return NextResponse.json(
        {
          success: false,
          message: "Shift already closed",
        },
        { status: 400 },
      );
    }

    const body = await req.json();

    const closingCash = Number(body.closingCash ?? 0);

    if (closingCash < 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Closing cash cannot be negative",
        },
        { status: 400 },
      );
    }

    const cashOrders = shift.orders.filter(
      (order) =>
        order.paymentMethod === "CASH" &&
        order.status !== "CANCELLED" &&
        order.status !== "PENDING_PAYMENT",
    );

    const cashSales = cashOrders.reduce((acc, order) => acc + order.total, 0);
    const expectedCash = shift.openingCash + cashSales;
    const cashDifference = closingCash - expectedCash;

    const updatedShift = await prisma.shift.update({
      where: {
        id: shift.id,
      },
      data: {
        status: ShiftStatus.CLOSED,
        closingCash,
        expectedCash,
        cashDifference,
        closedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
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
    console.error("[CLOSE_SHIFT_ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to close shift",
      },
      { status: 500 },
    );
  }
}
