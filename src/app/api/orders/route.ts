import { NextResponse } from "next/server";

import {
  OrderStatus,
  OrderType,
  Prisma,
  Role,
  ShiftStatus,
  TableStatus,
} from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

import { requireApiRole } from "@/lib/auth/require-api-role";

export async function POST(req: Request) {
  try {
    const auth =
      await requireApiRole([
        Role.OWNER,
        Role.MANAGER,
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

    const currentShift =
      await prisma.shift.findFirst(
        {
          where: {
            userId: user.id,

            restaurantId:
              restaurant.id,

            status:
              ShiftStatus.OPEN,
          },
        },
      );

    if (!currentShift) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please open shift before creating order",
        },
        { status: 400 },
      );
    }

    const body = await req.json();

    const paymentMethod =
      String(
        body.paymentMethod ??
          "",
      ).toUpperCase();

    const amountPaid =
      Number(
        body.amountPaid,
      );

    const orderType = String(
      body.orderType ??
        OrderType.TAKEAWAY,
    ) as OrderType;

    const tableId =
      body.tableId
        ? String(body.tableId)
        : null;

    const items = body.items as {
      menuItemId?: string;
      quantity: number;
    }[];

    if (
      !Object.values(
        OrderType,
      ).includes(orderType)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid order type",
        },
        { status: 400 },
      );
    }

    if (
      orderType ===
        OrderType.DINE_IN &&
      !tableId
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Table is required for dine-in order",
        },
        { status: 400 },
      );
    }

    if (!paymentMethod) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Payment method is required",
        },
        { status: 400 },
      );
    }

    if (!items?.length) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No items provided",
        },
        { status: 400 },
      );
    }

    const paymentEnabledMap: Record<
      string,
      boolean
    > = {
      CASH:
        restaurant.cashEnabled,

      QRIS:
        restaurant.qrisEnabled,

      CARD:
        restaurant.cardEnabled,

      TRANSFER:
        restaurant.transferEnabled,
    };

    if (
      !paymentEnabledMap[
        paymentMethod
      ]
    ) {
      return NextResponse.json(
        {
          success: false,
          message: `${paymentMethod} payment is disabled`,
        },
        { status: 400 },
      );
    }

    const menuItemIds =
      items.map(
        (item) =>
          item.menuItemId,
      );

    if (
      menuItemIds.some(
        (id) => !id,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid menu item data",
        },
        { status: 400 },
      );
    }

    const menuItems =
      await prisma.menuItem.findMany(
        {
          where: {
            id: {
              in:
                menuItemIds as string[],
            },

            restaurantId:
              restaurant.id,

            isAvailable: true,
          },

          select: {
            id: true,
            name: true,
            price: true,

            recipes: {
              select: {
                quantityNeeded: true,

                inventoryItem: {
                  select: {
                    id: true,
                    currentStock: true,
                  },
                },
              },
            },
          },
        },
      );

    let subtotal = 0;

    const orderItemsData =
      items.map((item) => {
        const menuItem =
          menuItems.find(
            (menu) =>
              menu.id ===
              item.menuItemId,
          );

        if (!menuItem) {
          throw new Error(
            "Menu item not found",
          );
        }

        if (
          menuItem.recipes
            .length === 0
        ) {
          throw new Error(
            `${menuItem.name} recipe is not set`,
          );
        }

        if (
          item.quantity <= 0
        ) {
          throw new Error(
            "Quantity must be greater than 0",
          );
        }

        for (const recipe of menuItem.recipes) {
          const requiredQuantity =
            recipe.quantityNeeded *
            item.quantity;

          if (
            recipe
              .inventoryItem
              .currentStock <
            requiredQuantity
          ) {
            throw new Error(
              `${menuItem.name} is out of stock`,
            );
          }
        }

        const subtotalItem =
          menuItem.price *
          item.quantity;

        subtotal += subtotalItem;

        return {
          menuItemId:
            menuItem.id,

          quantity:
            item.quantity,

          price:
            menuItem.price,

          subtotal:
            subtotalItem,
        };
      });

    const taxAmount =
      Math.round(
        subtotal *
          (restaurant.taxRate /
            100),
      );

    const serviceAmount =
      Math.round(
        subtotal *
          (restaurant.serviceRate /
            100),
      );

    const total =
      subtotal +
      taxAmount +
      serviceAmount;

    const isCash =
      paymentMethod ===
      "CASH";

    const finalAmountPaid =
      isCash
        ? amountPaid
        : total;

    if (
      isCash &&
      finalAmountPaid < total
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Insufficient payment amount",
        },
        { status: 400 },
      );
    }

    const changeAmount =
      isCash
        ? finalAmountPaid -
          total
        : 0;

    const order =
      await prisma.$transaction(
        async (tx) => {
          /**
           * TABLE LOCK
           */

          if (tableId) {
            const table =
              await tx.diningTable.findFirst(
                {
                  where: {
                    id: tableId,

                    restaurantId:
                      restaurant.id,

                    isActive: true,
                  },

                  select: {
                    id: true,
                    status: true,
                  },
                },
              );

            if (
              !table ||
              table.status !==
                TableStatus.AVAILABLE
            ) {
              throw new Error(
                "Table is no longer available",
              );
            }

            await tx.diningTable.update(
              {
                where: {
                  id: table.id,
                },

                data: {
                  status:
                    TableStatus.OCCUPIED,
                },
              },
            );
          }

          /**
           * STOCK DECREMENT
           */

          for (const item of items) {
            const menuItem =
              menuItems.find(
                (menu) =>
                  menu.id ===
                  item.menuItemId,
              );

            if (!menuItem)
              continue;

            for (const recipe of menuItem.recipes) {
              const requiredQuantity =
                recipe.quantityNeeded *
                item.quantity;

              const updated =
                await tx.inventoryItem.updateMany(
                  {
                    where: {
                      id: recipe
                        .inventoryItem
                        .id,

                      currentStock:
                        {
                          gte:
                            requiredQuantity,
                        },
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

              if (
                updated.count ===
                0
              ) {
                throw new Error(
                  `${menuItem.name} stock changed during checkout`,
                );
              }
            }
          }

          /**
           * ORDER NUMBER
           */

          const lastOrder =
            await tx.order.findFirst(
              {
                where: {
                  restaurantId:
                    restaurant.id,
                },

                orderBy: {
                  orderNumber:
                    "desc",
                },

                select: {
                  orderNumber:
                    true,
                },
              },
            );

          const nextOrderNumber =
            (lastOrder?.orderNumber ??
              0) + 1;

          const createdOrder =
            await tx.order.create({
              data: {
                orderNumber:
                  nextOrderNumber,

                type: orderType,

                subtotal,
                taxAmount,
                serviceAmount,
                total,

                paymentMethod,

                amountPaid:
                  finalAmountPaid,

                changeAmount,

                status: isCash
                  ? OrderStatus.PAID
                  : OrderStatus.PENDING_PAYMENT,

                restaurantId:
                  restaurant.id,

                tableId:
                  orderType ===
                  OrderType.DINE_IN
                    ? tableId
                    : null,

                shiftId:
                  currentShift.id,

                items: {
                  create:
                    orderItemsData,
                },
              },

              include: {
                items: {
                  include: {
                    menuItem: true,
                  },
                },

                table: true,

                shift: true,
              },
            });

          return createdOrder;
        },

        {
          timeout: 15000,
        },
      );

    return NextResponse.json({
      success: true,

      message:
        "Order created successfully",

      data: order,
    });
  } catch (error) {
    console.error(
      "[CREATE_ORDER_ERROR]",
      error,
    );

    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Duplicate order detected. Please retry.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Failed to create order",
      },

      { status: 500 },
    );
  }
}