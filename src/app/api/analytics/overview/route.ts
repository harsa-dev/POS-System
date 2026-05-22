import { NextResponse } from "next/server";

import {
  OrderStatus,
  Role,
} from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { requireApiRole } from "@/lib/auth/require-api-role";

export async function GET() {
  try {
    const auth = await requireApiRole([
      Role.OWNER,
      Role.MANAGER,
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

    /**
     * Completed orders only.
     */
    const completedOrders =
      await prisma.order.findMany({
        where: {
          restaurantId:
            restaurant.id,

          status:
            OrderStatus.COMPLETED,
        },

        include: {
          items: true,
        },
      });

    /**
     * Revenue.
     */
    const totalRevenue =
      completedOrders.reduce(
        (acc, order) =>
          acc + order.total,
        0,
      );

    /**
     * Orders.
     */
    const totalOrders =
      completedOrders.length;

    /**
     * Average order value.
     */
    const averageOrderValue =
      totalOrders > 0
        ? totalRevenue /
          totalOrders
        : 0;

    /**
     * Active orders.
     */
    const activeOrders =
      await prisma.order.count({
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
      });

    /**
     * Low stock items.
     */
    const lowStockItems =
      await prisma.inventoryItem.count(
        {
          where: {
            restaurantId:
              restaurant.id,

            currentStock: {
              lte: 10,
            },
          },
        },
      );

    return NextResponse.json({
      success: true,

      data: {
        totalRevenue,
        totalOrders,
        averageOrderValue,
        activeOrders,
        lowStockItems,
      },
    });
  } catch (error) {
    console.error(
      "[ANALYTICS_OVERVIEW_ERROR]",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to fetch analytics overview",
      },
      { status: 500 },
    );
  }
}