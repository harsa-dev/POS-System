import { NextResponse } from "next/server";

import {
  OrderStatus,
  PaymentStatus,
  Role,
  TableStatus,
} from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { requireApiRole } from "@/lib/auth/require-api-role";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

const allowedTransitions: Record<
  OrderStatus,
  OrderStatus[]
> = {
  PENDING_PAYMENT: [
    OrderStatus.PAID,
    OrderStatus.CANCELLED,
  ],

  PAID: [
    OrderStatus.PREPARING,
    OrderStatus.CANCELLED,
  ],

  PREPARING: [
    OrderStatus.READY,
    OrderStatus.CANCELLED,
  ],

  READY: [
    OrderStatus.SERVED,
    OrderStatus.CANCELLED,
  ],

  SERVED: [
    OrderStatus.COMPLETED,
  ],

  COMPLETED: [],

  CANCELLED: [],
};

export async function PATCH(
  req: Request,
  { params }: Params,
) {
  try {
    const auth =
      await requireApiRole([
        Role.OWNER,
        Role.MANAGER,
        Role.KITCHEN,
        Role.SERVER,
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

    const { id } = await params;

    const body = await req.json();

    const status =
      body.status as OrderStatus;

    const cancelReason =
      typeof body.cancelReason ===
      "string"
        ? body.cancelReason.trim()
        : "";

    if (
      !Object.values(
        OrderStatus,
      ).includes(status)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid order status",
        },
        { status: 400 },
      );
    }

    if (
      status ===
        OrderStatus.CANCELLED &&
      !cancelReason
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Cancel reason is required",
        },
        { status: 400 },
      );
    }

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

    const existingOrder =
      await prisma.order.findFirst(
        {
          where: {
            id,
            restaurantId:
              restaurant.id,
          },

          include: {
            items: {
              include: {
                menuItem: {
                  include: {
                    recipes: {
                      include: {
                        inventoryItem:
                          true,
                      },
                    },
                  },
                },
              },
            },

            payment: true,

            shift: true,
          },
        },
      );

    if (!existingOrder) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Order not found",
        },
        { status: 404 },
      );
    }

    const canMove =
      allowedTransitions[
        existingOrder.status
      ].includes(status);

    if (!canMove) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot change order from ${existingOrder.status} to ${status}`,
        },
        { status: 400 },
      );
    }

    const rolePermissions: Record<
      Role,
      OrderStatus[]
    > = {
      OWNER:
        Object.values(
          OrderStatus,
        ),

      MANAGER:
        Object.values(
          OrderStatus,
        ),

      CASHIER: [
        OrderStatus.PAID,
        OrderStatus.CANCELLED,
        OrderStatus.COMPLETED,
      ],

      KITCHEN: [
        OrderStatus.PREPARING,
        OrderStatus.READY,
        OrderStatus.CANCELLED,
      ],

      SERVER: [
        OrderStatus.SERVED,
        OrderStatus.COMPLETED,
        OrderStatus.CANCELLED,
      ],
    };

    const allowedStatuses =
      rolePermissions[
        user.role
      ] ?? [];

    if (
      !allowedStatuses.includes(
        status,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You cannot update to this status",
        },
        { status: 403 },
      );
    }

    const updatedOrder =
      await prisma.$transaction(
        async (tx) => {
          const isCancelling =
            status ===
            OrderStatus.CANCELLED;

          /**
           * DEDUCT STOCK
           * ONLY WHEN:
           * PREPARING -> READY
           */

          const shouldDeductStock =
            existingOrder.status ===
              OrderStatus.PREPARING &&
            status ===
              OrderStatus.READY &&
            !existingOrder.inventoryDeducted;

          /**
           * RESTORE STOCK
           * ONLY IF:
           * STOCK WAS DEDUCTED
           */

          const shouldRestoreStock =
            isCancelling &&
            existingOrder.inventoryDeducted;

          const shouldDecreaseExpectedCash =
            isCancelling &&
            existingOrder.paymentMethod ===
              "CASH" &&
            existingOrder.payment
              ?.status ===
              PaymentStatus.PAID &&
            existingOrder.shiftId;

          /**
           * VALIDATE STOCK
           */

          if (
            shouldDeductStock
          ) {
            for (const orderItem of existingOrder.items) {
              const recipes =
                orderItem.menuItem
                  .recipes;

              if (
                !recipes.length
              ) {
                throw new Error(
                  `${orderItem.menuItem.name} does not have recipe`,
                );
              }

              for (const recipe of recipes) {
                const requiredQuantity =
                  recipe.quantityNeeded *
                  orderItem.quantity;

                if (
                  recipe
                    .inventoryItem
                    .currentStock <
                  requiredQuantity
                ) {
                  throw new Error(
                    `Insufficient stock for ${recipe.inventoryItem.name}`,
                  );
                }
              }
            }
          }

          /**
           * UPDATE ORDER
           */

          const updated =
            await tx.order.update(
              {
                where: {
                  id,
                },

                data: {
                  status,

                  ...(shouldDeductStock
                    ? {
                        inventoryDeducted:
                          true,
                      }
                    : {}),

                  ...(isCancelling
                    ? {
                        cancelReason,
                        cancelledAt:
                          new Date(),
                      }
                    : {}),
                },
              },
            );

          /**
           * DEDUCT STOCK
           */

          if (
            shouldDeductStock
          ) {
            for (const orderItem of existingOrder.items) {
              const recipes =
                orderItem.menuItem
                  .recipes;

              for (const recipe of recipes) {
                const requiredQuantity =
                  recipe.quantityNeeded *
                  orderItem.quantity;

                await tx.inventoryItem.update(
                  {
                    where: {
                      id: recipe.inventoryItemId,
                    },

                    data: {
                      currentStock:
                        {
                          decrement:
                            requiredQuantity,
                        },
                    },
                  },
                );

                await tx.stockMovement.create(
                  {
                    data: {
                      inventoryItemId:
                        recipe.inventoryItemId,

                      type: "OUT",

                      reason:
                        "RECIPE_USAGE",

                      quantity:
                        requiredQuantity,

                      note: `Order #${existingOrder.orderNumber} - ${orderItem.menuItem.name}`,
                    },
                  },
                );
              }
            }
          }

          /**
           * RESTORE STOCK
           */

          if (
            shouldRestoreStock
          ) {
            for (const orderItem of existingOrder.items) {
              const recipes =
                orderItem.menuItem
                  .recipes;

              for (const recipe of recipes) {
                const restoreQuantity =
                  recipe.quantityNeeded *
                  orderItem.quantity;

                await tx.inventoryItem.update(
                  {
                    where: {
                      id: recipe.inventoryItemId,
                    },

                    data: {
                      currentStock:
                        {
                          increment:
                            restoreQuantity,
                        },
                    },
                  },
                );

                await tx.stockMovement.create(
                  {
                    data: {
                      inventoryItemId:
                        recipe.inventoryItemId,

                      type: "IN",

                      reason:
                        "WASTE",

                      quantity:
                        restoreQuantity,

                      note: `Cancelled order #${existingOrder.orderNumber}`,
                    },
                  },
                );
              }
            }
          }

          /**
           * SHIFT CASH
           */

          if (
            shouldDecreaseExpectedCash
          ) {
            await tx.shift.update({
              where: {
                id:
                  existingOrder.shiftId!,
              },

              data: {
                expectedCash: {
                  decrement:
                    existingOrder.total,
                },
              },
            });
          }

          /**
           * PAYMENT
           */

          if (
            isCancelling &&
            existingOrder.payment
          ) {
            await tx.payment.update(
              {
                where: {
                  orderId:
                    existingOrder.id,
                },

                data: {
                  status:
                    existingOrder
                      .payment
                      .status ===
                    PaymentStatus.PAID
                      ? PaymentStatus.PAID
                      : PaymentStatus.FAILED,
                },
              },
            );
          }

          /**
           * TABLE STATUS
           */

          if (
            existingOrder.tableId &&
            (status ===
              OrderStatus.COMPLETED ||
              status ===
                OrderStatus.CANCELLED)
          ) {
            await tx.diningTable.update(
              {
                where: {
                  id:
                    existingOrder.tableId,
                },

                data: {
                  status:
                    status ===
                    OrderStatus.COMPLETED
                      ? TableStatus.CLEANING
                      : TableStatus.AVAILABLE,
                },
              },
            );
          }

          return updated;
        },
      );

    return NextResponse.json({
      success: true,

      message:
        status ===
        OrderStatus.CANCELLED
          ? "Order cancelled"
          : "Order status updated",

      data: updatedOrder,
    });
  } catch (error) {
    console.error(
      "[UPDATE_ORDER_STATUS_ERROR]",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to update order",
      },
      { status: 500 },
    );
  }
}