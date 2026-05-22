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

    const orders = await prisma.order.findMany({
      where: {
        restaurantId: restaurant.id,

        status: OrderStatus.COMPLETED,
      },

      select: {
        createdAt: true,
      },
    });

    const hoursMap = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      total: 0,
    }));

    orders.forEach((order) => {
      const hour = new Date(order.createdAt).getHours();

      hoursMap[hour].total += 1;
    });

    const formatted = hoursMap.map((item) => ({
      hour: `${item.hour.toString().padStart(2, "0")}:00`,

      total: item.total,
    }));

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
    console.error("[PEAK_HOURS_ANALYTICS_ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch peak hours analytics",
      },
      { status: 500 },
    );
  }
}
