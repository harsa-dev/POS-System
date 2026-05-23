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

    const completedOrders = await prisma.order.findMany({
      where: {
        restaurantId: restaurant.id,

        status: OrderStatus.COMPLETED,
      },

      select: {
        createdAt: true,
        updatedAt: true,
      },
    });

    const prepTimes = completedOrders.map((order) => {
      const created = new Date(order.createdAt).getTime();

      const updated = new Date(order.updatedAt).getTime();

      return Math.max(1, Math.round((updated - created) / 1000 / 60));
    });

    const averagePrepTime =
      prepTimes.length > 0
        ? Math.round(prepTimes.reduce((a, b) => a + b, 0) / prepTimes.length)
        : 0;

    const fastestOrder = prepTimes.length > 0 ? Math.min(...prepTimes) : 0;

    const slowestOrder = prepTimes.length > 0 ? Math.max(...prepTimes) : 0;

    const startOfDay = new Date();

    startOfDay.setHours(0, 0, 0, 0);

    const completedToday = await prisma.order.count({
      where: {
        restaurantId: restaurant.id,

        status: OrderStatus.COMPLETED,

        updatedAt: {
          gte: startOfDay,
        },
      },
    });

    return NextResponse.json(
      {
        success: true,

        data: {
          averagePrepTime,
          fastestOrder,
          slowestOrder,
          completedToday,
        },
      },

      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      },
    );
  } catch (error) {
    console.error("[KITCHEN_PERFORMANCE_ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch kitchen analytics",
      },
      { status: 500 },
    );
  }
}
