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

        menuItemId: true,

        menuItem: {
          select: {
            name: true,
            imageUrl: true,
          },
        },
      },
    });

    const grouped = orderItems.reduce(
      (acc, item) => {
        const existing = acc.find(
          (menu) => menu.menuItemId === item.menuItemId,
        );

        if (existing) {
          existing.quantitySold += item.quantity;

          existing.revenue += item.subtotal;
        } else {
          acc.push({
            menuItemId: item.menuItemId,

            name: item.menuItem.name,

            imageUrl: item.menuItem.imageUrl,

            quantitySold: item.quantity,

            revenue: item.subtotal,
          });
        }

        return acc;
      },
      [] as {
        menuItemId: string;
        name: string;
        imageUrl?: string | null;
        quantitySold: number;
        revenue: number;
      }[],
    );

    grouped.sort((a, b) => b.quantitySold - a.quantitySold);

    return NextResponse.json(
      {
        success: true,
        data: grouped.slice(0, 5),
      },

      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      },
    );
  } catch (error) {
    console.error("[TOP_MENU_ANALYTICS_ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch top menu analytics",
      },
      { status: 500 },
    );
  }
}
