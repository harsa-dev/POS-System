import { NextResponse } from "next/server";

import { OrderStatus, Role } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { requireApiRole } from "@/lib/auth/require-api-role";

export async function GET() {
  try {
    const auth = await requireApiRole([Role.OWNER, Role.MANAGER]);

    if (auth.error) {
      return NextResponse.json(
        {
          success: false,
          message: auth.error.message,
        },
        {
          status: auth.error.status,
        },
      );
    }

    const user = auth.user;

    const restaurant = await prisma.restaurant.findFirst({
      where:
        user.role === Role.OWNER
          ? {
              ownerId: user.id,
            }
          : {
              id: user.restaurantId ?? "",
            },
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

    const orders = await prisma.order.groupBy({
      by: ["status"],

      where: {
        restaurantId: restaurant.id,
      },

      _count: {
        status: true,
      },
    });

    const formatted = Object.values(OrderStatus).map((status) => {
      const found = orders.find((order) => order.status === status);

      return {
        status,
        total: found?._count.status ?? 0,
      };
    });

    return NextResponse.json(
      {
        success: true,
        data: formatted,
      },

      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      },
    );
  } catch (error) {
    console.error("[ORDER_STATUS_ANALYTICS_ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch order status analytics",
      },
      { status: 500 },
    );
  }
}
