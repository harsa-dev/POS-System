import { NextResponse } from "next/server";

import { OrderStatus, PaymentStatus, Role } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { requireApiRole } from "@/lib/auth/require-api-role";

function formatDate(date: Date) {
  return date.toISOString().split("T")[0];
}

export async function GET() {
  try {
    const auth = await requireApiRole([Role.OWNER, Role.MANAGER]);

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

    const orders = await prisma.order.findMany({
      where: {
        restaurantId: restaurant.id,
        status: {
          not: OrderStatus.CANCELLED,
        },
        payment: {
          status: PaymentStatus.PAID,
        },
      },
      include: {
        payment: true,
        table: true,
        items: {
          include: {
            menuItem: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const cancelledOrders = await prisma.order.count({
      where: {
        restaurantId: restaurant.id,
        status: OrderStatus.CANCELLED,
      },
    });

    const totalMenuItems = await prisma.menuItem.count({
      where: {
        restaurantId: restaurant.id,
      },
    });

    const pendingPayments = await prisma.payment.count({
      where: {
        status: PaymentStatus.PENDING,
        order: {
          restaurantId: restaurant.id,
          status: {
            not: OrderStatus.CANCELLED,
          },
        },
      },
    });

    const totalRevenue = orders.reduce((acc, order) => acc + order.total, 0);
    const totalOrders = orders.length;

    const lowStockMenuItems = await prisma.inventoryItem.findMany({
      where: {
        restaurantId: restaurant.id,

        currentStock: {
          lte: 10,
        },
      },

      select: {
        id: true,
        name: true,
        currentStock: true,
        minimumStock: true,
        unit: true,
      },
    });

    const menuItemSalesMap = new Map<
      string,
      {
        name: string;
        quantity: number;
      }
    >();

    const dailySalesMap = new Map<
      string,
      {
        date: string;
        revenue: number;
        orders: number;
      }
    >();

    for (const order of orders) {
      const date = formatDate(order.createdAt);

      const daily = dailySalesMap.get(date);

      if (daily) {
        daily.revenue += order.total;
        daily.orders += 1;
      } else {
        dailySalesMap.set(date, {
          date,
          revenue: order.total,
          orders: 1,
        });
      }

      for (const item of order.items) {
        const existing = menuItemSalesMap.get(item.menuItemId);

        if (existing) {
          existing.quantity += item.quantity;
        } else {
          menuItemSalesMap.set(item.menuItemId, {
            name: item.menuItem.name,
            quantity: item.quantity,
          });
        }
      }
    }

    const bestSellingMenuItems = Array.from(menuItemSalesMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    const dailySales = Array.from(dailySalesMap.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14);

    return NextResponse.json({
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        totalMenuItems,
        pendingPayments,
        cancelledOrders,
        lowStockMenuItems,
        bestSellingMenuItems,
        recentOrders: orders.slice(0, 5),
        dailySales,
      },
    });
  } catch (error) {
    console.error("[GET_ANALYTICS_ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch analytics",
      },
      { status: 500 },
    );
  }
}
