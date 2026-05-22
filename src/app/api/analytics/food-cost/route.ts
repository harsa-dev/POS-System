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
        const menuName = item.menuItem.name;

        const recipeCost = item.menuItem.recipes.reduce((total, recipe) => {
          /**
           * ESTIMATION:
           * inventory price
           * should exist later.
           */
          const estimatedCost =
            recipe.quantityNeeded * recipe.inventoryItem.costPerUnit;

          return total + estimatedCost;
        }, 0);

        const existing = acc.find((menu) => menu.name === menuName);

        if (existing) {
          existing.revenue += item.subtotal;

          existing.estimatedFoodCost += recipeCost * item.quantity;

          existing.quantitySold += item.quantity;
        } else {
          acc.push({
            name: menuName,

            quantitySold: item.quantity,

            revenue: item.subtotal,

            estimatedFoodCost: recipeCost * item.quantity,
          });
        }

        return acc;
      },
      [] as {
        name: string;
        quantitySold: number;
        revenue: number;
        estimatedFoodCost: number;
      }[],
    );

    const formatted = grouped.map((item) => {
      const grossProfit = item.revenue - item.estimatedFoodCost;

      const foodCostPercentage =
        item.revenue > 0
          ? Math.round((item.estimatedFoodCost / item.revenue) * 100)
          : 0;

      return {
        ...item,

        grossProfit,

        foodCostPercentage,
      };
    });

    formatted.sort((a, b) => b.revenue - a.revenue);

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
    console.error("[FOOD_COST_ANALYTICS_ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch food cost analytics",
      },
      { status: 500 },
    );
  }
}
