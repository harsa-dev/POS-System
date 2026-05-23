import {
  OrderStatus,
  OrderType,
  Prisma,
  ShiftStatus,
  TableStatus,
} from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { BadRequestError, NotFoundError } from "@/lib/errors";
import { validatePaymentMethod } from "./helpers/validate-payment-method";
import { validateOrderItems } from "./helpers/validate-order-items";
import { calculateOrderTotal } from "../utils/calculate-order-total";
import { generateOrderNumber } from "./helpers/generate-order-number";
import { validateTable } from "./helpers/validate-table";
import { deductStock } from "./helpers/deduct-stock";

type CreateOrderParams = {
  user: {
    id: string;
    role: string;
    restaurantId?: string | null;
  };

  body: any;
};

export async function createOrder({ user, body }: CreateOrderParams) {
  const restaurant = await prisma.restaurant.findFirst({
    where:
      user.role === "OWNER"
        ? {
            ownerId: user.id,
          }
        : {
            id: user.restaurantId ?? "",
          },
  });

  if (!restaurant) {
    throw new NotFoundError("Restaurant not found");
  }

  const currentShift = await prisma.shift.findFirst({
    where: {
      userId: user.id,

      restaurantId: restaurant.id,

      status: ShiftStatus.OPEN,
    },
  });

  if (!currentShift) {
    throw new BadRequestError("Please open shift before creating order");
  }

  const paymentMethod = String(body.paymentMethod ?? "").toUpperCase();

  const amountPaid = Number(body.amountPaid);

  const orderType = String(body.orderType ?? OrderType.TAKEAWAY) as OrderType;

  const tableId = body.tableId ? String(body.tableId) : null;

  const items = body.items as {
    menuItemId?: string;
    quantity: number;
  }[];

  if (!Object.values(OrderType).includes(orderType)) {
    throw new BadRequestError("Invalid order type");
  }

  if (orderType === OrderType.DINE_IN && !tableId) {
    throw new BadRequestError("Table is required for dine-in order");
  }

  if (!items?.length) {
    throw new BadRequestError("No items provided");
  }

  const paymentEnabledMap: Record<string, boolean> = {
    CASH: restaurant.cashEnabled,

    QRIS: restaurant.qrisEnabled,

    CARD: restaurant.cardEnabled,

    TRANSFER: restaurant.transferEnabled,
  };

  validatePaymentMethod({
    paymentMethod,
    paymentEnabledMap,
  });

  const menuItemIds = items.map((item) => item.menuItemId);

  if (menuItemIds.some((id) => !id)) {
    throw new BadRequestError("Invalid menu item data");
  }

  const menuItems = await prisma.menuItem.findMany({
    where: {
      id: {
        in: menuItemIds as string[],
      },

      restaurantId: restaurant.id,

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
  });

  const { subtotal, orderItemsData } = validateOrderItems({
    items,
    menuItems,
  });

  const { taxAmount, serviceAmount, total } = calculateOrderTotal({
    subtotal,

    taxRate: restaurant.taxRate,

    serviceRate: restaurant.serviceRate,
  });

  const isCash = paymentMethod === "CASH";

  const finalAmountPaid = isCash ? amountPaid : total;

  if (isCash && finalAmountPaid < total) {
    throw new BadRequestError("Insufficient payment amount");
  }

  const changeAmount = isCash ? finalAmountPaid - total : 0;

  try {
    const order = await prisma.$transaction(
      async (tx) => {
        if (tableId) {
          const table = await tx.diningTable.findFirst({
            where: {
              id: tableId,

              restaurantId: restaurant.id,

              isActive: true,
            },

            select: {
              id: true,
              status: true,
            },
          });

          validateTable({
            table,
          });

          if (!table) {
            throw new Error("Table not found");
          }
          
          await tx.diningTable.update({
            where: {
              id: table.id,
            },

            data: {
              status: TableStatus.OCCUPIED,
            },
          });
        }

        await deductStock({
          tx,
          items,
          menuItems,
        });

        const nextOrderNumber = await generateOrderNumber({
          tx,
          restaurantId: restaurant.id,
        });

        return tx.order.create({
          data: {
            orderNumber: nextOrderNumber,

            type: orderType,

            subtotal,
            taxAmount,
            serviceAmount,
            total,

            paymentMethod,

            amountPaid: finalAmountPaid,

            changeAmount,

            status: isCash ? OrderStatus.PAID : OrderStatus.PENDING_PAYMENT,

            restaurantId: restaurant.id,

            tableId: orderType === OrderType.DINE_IN ? tableId : null,

            shiftId: currentShift.id,

            items: {
              create: orderItemsData,
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
      },

      {
        timeout: 15000,
      },
    );

    return order;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new BadRequestError("Duplicate order detected. Please retry.");
    }

    throw error;
  }
}
