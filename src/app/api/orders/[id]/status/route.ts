import { NextResponse } from "next/server";

import { OrderStatus, Role, StockMovementType } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { requireApiRole } from "@/lib/auth/require-api-role";
type Params = {
  params: Promise<{
    id: string;
  }>;
};

const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: [OrderStatus.PAID, OrderStatus.CANCELLED],
  PAID: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  PREPARING: [OrderStatus.READY, OrderStatus.CANCELLED],
  READY: [OrderStatus.SERVED],
  SERVED: [OrderStatus.COMPLETED],
  COMPLETED: [],
  CANCELLED: [],
};

export async function PATCH(req: Request, { params }: Params) {
  try {
    const auth = await requireApiRole([
      Role.OWNER,
      Role.MANAGER,
      Role.KITCHEN,
      Role.SERVER,
      Role.CASHIER,
    ]);

    const { id } = await params;

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

    const body = await req.json();

    const status = body.status as OrderStatus;

    if (!Object.values(OrderStatus).includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid order status",
        },
        { status: 400 },
      );
    }

    const order = await prisma.order.findFirst({
      where: {
        id,
        restaurantId: restaurant.id,
      },
      include: {
        items: {
          include: {
            menuItem: {
              include: {
                recipes: {
                  include: {
                    inventoryItem: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message: "Order not found",
        },
        { status: 404 },
      );
    }

    const canMove = allowedTransitions[order.status].includes(status);

    if (!canMove) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot change order from ${order.status} to ${status}`,
        },
        { status: 400 },
      );
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      /**
       * IMPORTANT:
       * Stock inventory ONLY decreases
       * when kitchen starts preparing.
       */
      if (
        order.status !== OrderStatus.PREPARING &&
        status === OrderStatus.PREPARING
      ) {
        for (const item of order.items) {
          const recipes = item.menuItem.recipes;

          if (!recipes.length) {
            throw new Error(`${item.menuItem.name} does not have recipe`);
          }

          for (const recipe of recipes) {
            const usedQuantity = recipe.quantityNeeded * item.quantity;

            const inventoryItem = recipe.inventoryItem;

            if (inventoryItem.currentStock < usedQuantity) {
              throw new Error(`Insufficient stock for ${inventoryItem.name}`);
            }

            await tx.inventoryItem.update({
              where: {
                id: inventoryItem.id,
              },
              data: {
                currentStock: {
                  decrement: usedQuantity,
                },
              },
            });

            await tx.stockMovement.create({
              data: {
                inventoryItemId: inventoryItem.id,
                type: StockMovementType.OUT,
                quantity: usedQuantity,
                note: `Used for Order #${order.orderNumber}`,
              },
            });
          }
        }
      }

      const updated = await tx.order.update({
        where: {
          id,
        },
        data: {
          status,
        },
      });

      return updated;
    });

    return NextResponse.json({
      success: true,
      message: "Order status updated",
      data: updatedOrder,
    });
  } catch (error) {
    console.error("[ORDER_STATUS_PATCH]", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
