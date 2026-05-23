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
            name: true,

            recipes: {
              select: {
                quantityNeeded: true,

                inventoryItem: {
                  select: {
                    costPerUnit: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const grouped = orderItems.reduce(
      (acc, item) => {
        const recipeCost = item.menuItem.recipes.reduce((total, recipe) => {
          return (
            total + recipe.quantityNeeded * recipe.inventoryItem.costPerUnit
          );
        }, 0);

        const totalFoodCost = recipeCost * item.quantity;

        const existing = acc.find((menu) => menu.name === item.menuItem.name);

        if (existing) {
          existing.revenue += item.subtotal;

          existing.foodCost += totalFoodCost;

          existing.quantitySold += item.quantity;
        } else {
          acc.push({
            name: item.menuItem.name,

            quantitySold: item.quantity,

            revenue: item.subtotal,

            foodCost: totalFoodCost,
          });
        }

        return acc;
      },
      [] as {
        name: string;
        quantitySold: number;
        revenue: number;
        foodCost: number;
      }[],
    );

    const formatted = grouped.map((item) => {
      const grossProfit = item.revenue - item.foodCost;

      const marginPercentage =
        item.revenue > 0 ? Math.round((grossProfit / item.revenue) * 100) : 0;

      return {
        ...item,

        grossProfit,

        marginPercentage,
      };
    });

    formatted.sort((a, b) => b.marginPercentage - a.marginPercentage);

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
    console.error("[PROFIT_MARGIN_ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch profit analytics",
      },
      { status: 500 },
    );
  }
}
