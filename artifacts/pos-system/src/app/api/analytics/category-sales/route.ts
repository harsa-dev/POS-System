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

    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          restaurantId: restaurant.id,

          status: OrderStatus.COMPLETED,
        },
      },

      select: {
        quantity: true,

        subtotal: true,

        menuItem: {
          select: {
            category: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    const grouped = orderItems.reduce(
      (acc, item) => {
        const categoryName = item.menuItem.category?.name ?? "Uncategorized";

        const existing = acc.find((cat) => cat.category === categoryName);

        if (existing) {
          existing.revenue += item.subtotal;

          existing.quantity += item.quantity;
        } else {
          acc.push({
            category: categoryName,

            revenue: item.subtotal,

            quantity: item.quantity,
          });
        }

        return acc;
      },
      [] as {
        category: string;
        revenue: number;
        quantity: number;
      }[],
    );

    grouped.sort((a, b) => b.revenue - a.revenue);

    return NextResponse.json(
      {
        success: true,
        data: grouped,
      },

      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      },
    );
  } catch (error) {
    console.error("[CATEGORY_ANALYTICS_ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch category analytics",
      },
      { status: 500 },
    );
  }
}
