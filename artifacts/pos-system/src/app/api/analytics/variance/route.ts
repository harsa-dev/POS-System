import { NextResponse } from "next/server";

import {
  OrderStatus,
  Role,
  StockMovementReason,
  StockMovementType,
} from "@prisma/client";

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

    /**
     * THEORETICAL USAGE
     */

    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          restaurantId: restaurant.id,

          status: {
            in: [OrderStatus.READY, OrderStatus.SERVED, OrderStatus.COMPLETED],
          },
        },
      },

      select: {
        quantity: true,

        menuItem: {
          select: {
            recipes: {
              select: {
                quantityNeeded: true,

                inventoryItemId: true,

                inventoryItem: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const theoreticalMap = new Map<
      string,
      {
        ingredient: string;
        theoretical: number;
      }
    >();

    for (const item of orderItems) {
      for (const recipe of item.menuItem.recipes) {
        const usedQuantity = recipe.quantityNeeded * item.quantity;

        const existing = theoreticalMap.get(recipe.inventoryItemId);

        if (existing) {
          existing.theoretical += usedQuantity;
        } else {
          theoreticalMap.set(recipe.inventoryItemId, {
            ingredient: recipe.inventoryItem.name,

            theoretical: usedQuantity,
          });
        }
      }
    }

    /**
     * ACTUAL USAGE
     */

    const stockMovements = await prisma.stockMovement.findMany({
      where: {
        inventoryItem: {
          restaurantId: restaurant.id,
        },

        type: StockMovementType.OUT,

        reason: StockMovementReason.RECIPE_USAGE,
      },

      include: {
        inventoryItem: true,
      },
    });

    const actualMap = new Map<string, number>();

    for (const movement of stockMovements) {
      const existing = actualMap.get(movement.inventoryItemId) ?? 0;

      actualMap.set(movement.inventoryItemId, existing + movement.quantity);
    }

    /**
     * MERGE
     */

    const varianceData = Array.from(theoreticalMap.entries()).map(
      ([inventoryItemId, theoreticalData]) => {
        const actual = actualMap.get(inventoryItemId) ?? 0;

        const variance = actual - theoreticalData.theoretical;

        const variancePercentage =
          theoreticalData.theoretical > 0
            ? Math.round((variance / theoreticalData.theoretical) * 100)
            : 0;

        return {
          ingredient: theoreticalData.ingredient,

          theoretical: theoreticalData.theoretical,

          actual,

          variance,

          variancePercentage,

          status:
            Math.abs(variancePercentage) <= 5
              ? "GOOD"
              : Math.abs(variancePercentage) <= 15
                ? "WARNING"
                : "CRITICAL",
        };
      },
    );

    varianceData.sort(
      (a, b) => Math.abs(b.variancePercentage) - Math.abs(a.variancePercentage),
    );

    return NextResponse.json({
      success: true,
      data: varianceData,
    });
  } catch (error) {
    console.error("[VARIANCE_ANALYTICS_ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch variance analytics",
      },
      { status: 500 },
    );
  }
}
