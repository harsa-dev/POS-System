import { NextResponse } from "next/server";
import { OrderStatus, Role, TableStatus } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { requireApiRole } from "@/lib/auth/require-api-role";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(req: Request, { params }: Params) {
  try {
    const auth = await requireApiRole([Role.OWNER, Role.MANAGER, Role.SERVER]);

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
    const { id } = await params;
    const body = await req.json();

    const newTableId = String(body.tableId ?? "");

    if (!newTableId) {
      return NextResponse.json(
        {
          success: false,
          message: "Table is required",
        },
        { status: 400 },
      );
    }

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

    const order = await prisma.order.findFirst({
      where: {
        id,
        restaurantId: restaurant.id,
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

    if (order.tableId === newTableId) {
      return NextResponse.json({
        success: true,
        message: "Order is already on this table",
      });
    }

    if (order.type !== "DINE_IN") {
      return NextResponse.json(
        {
          success: false,
          message: "Only dine in orders can move tables",
        },
        { status: 400 },
      );
    }

    if (
      order.status === OrderStatus.COMPLETED ||
      order.status === OrderStatus.CANCELLED
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Cannot move finished order",
        },
        { status: 400 },
      );
    }

    const newTable = await prisma.diningTable.findFirst({
      where: {
        id: newTableId,
        restaurantId: restaurant.id,
        isActive: true,
      },
    });

    if (!newTable) {
      return NextResponse.json(
        {
          success: false,
          message: "Table not found",
        },
        { status: 404 },
      );
    }

    if (newTable.status !== TableStatus.AVAILABLE) {
      return NextResponse.json(
        {
          success: false,
          message: "Table is not available",
        },
        { status: 400 },
      );
    }

    await prisma.$transaction(async (tx) => {
      if (order.tableId) {
        await tx.diningTable.update({
          where: {
            id: order.tableId,
          },
          data: {
            status: TableStatus.AVAILABLE,
          },
        });
      }

      await tx.diningTable.update({
        where: {
          id: newTable.id,
        },
        data: {
          status: TableStatus.OCCUPIED,
        },
      });

      await tx.order.update({
        where: {
          id: order.id,
        },
        data: {
          tableId: newTable.id,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Table moved successfully",
    });
  } catch (error) {
    console.error("[MOVE_TABLE_ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to move table",
      },
      { status: 500 },
    );
  }
}