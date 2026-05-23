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
      select: {
        id: true,
      },
    });

    if (!restaurant) {
      return NextResponse.json(
        {
          success: false,
          message: "Restaurant not found",
        },

        {
          status: 404,
        },
      );
    }

    const orders = await prisma.order.findMany({
      where: {
        restaurantId: restaurant.id,

        status: OrderStatus.COMPLETED,
      },

      select: {
        total: true,

        updatedAt: true,
      },

      orderBy: {
        updatedAt: "asc",
      },
    });

    const grouped = new Map<string, number>();

    orders.forEach((order) => {
      const date = new Date(order.updatedAt).toLocaleDateString("en-US", {
        weekday: "short",
      });

      const current = grouped.get(date) ?? 0;

      grouped.set(date, current + order.total);
    });

    const formatted = Array.from(grouped.entries()).map(([date, revenue]) => ({
      date,
      revenue,
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
    console.error("[SALES_ANALYTICS_ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch sales analytics",
      },

      {
        status: 500,
      },
    );
  }
}
