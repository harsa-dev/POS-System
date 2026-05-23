import { NextResponse } from "next/server";

import {
  OrderStatus,
  Role,
} from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

import { requireApiRole } from "@/lib/auth/require-api-role";

export async function GET() {
  try {
    const auth =
      await requireApiRole([
        Role.OWNER,
        Role.MANAGER,
        Role.KITCHEN,
        Role.CASHIER,
      ]);

    if (auth.error) {
      return NextResponse.json(
        {
          success: false,
          message:
            auth.error.message,
        },
        {
          status:
            auth.error.status,
        },
      );
    }

    const user = auth.user;

    const restaurant =
      await prisma.restaurant.findFirst(
        {
          where:
            user.role ===
            Role.OWNER
              ? {
                  ownerId:
                    user.id,
                }
              : {
                  id:
                    user.restaurantId ??
                    "",
                },
          select: {
            id: true,
          },
        },
      );

    if (!restaurant) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Restaurant not found",
        },
        { status: 404 },
      );
    }

    const now = Date.now();

    const orders =
      await prisma.order.findMany({
        where: {
          restaurantId:
            restaurant.id,

          status: {
            in: [
              OrderStatus.PAID,
              OrderStatus.PREPARING,
              OrderStatus.READY,
            ],
          },
        },

        select: {
          id: true,

          orderNumber: true,

          status: true,

          createdAt: true,

          table: {
            select: {
              name: true,
            },
          },
        },

        orderBy: {
          createdAt: "asc",
        },

        take: 10,
      });

    const formatted =
      orders.map((order) => ({
        id: order.id,

        orderNumber:
          order.orderNumber,

        status: order.status,

        table:
          order.table?.name ??
          "Takeaway",

        elapsedMinutes:
          Math.max(
            1,
            Math.floor(
              (now -
                new Date(
                  order.createdAt,
                ).getTime()) /
                1000 /
                60,
            ),
          ),
      }));

    return NextResponse.json(
      {
        success: true,

        data: formatted,
      },

      /**
       * CACHE HEADER
       */

      {
        headers: {
          "Cache-Control":
            "public, s-maxage=10, stale-while-revalidate=30",
        },
      },
    );
  } catch (error) {
    console.error(
      "[LIVE_ORDERS_ANALYTICS_ERROR]",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to fetch live orders",
      },
      { status: 500 },
    );
  }
}