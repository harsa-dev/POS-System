import { NextResponse } from "next/server";

import { Role, TableStatus } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { requireApiRole } from "@/lib/auth/require-api-role";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(_req: Request, { params }: Params) {
  try {
    const auth = await requireApiRole([Role.OWNER, Role.MANAGER, Role.SERVER]);

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

    const { id } = await params;

    const restaurant = await prisma.restaurant.findFirst({
      where:
        user.role === "OWNER"
          ? { ownerId: user.id }
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

    const table = await prisma.diningTable.findFirst({
      where: {
        id,
        restaurantId: restaurant.id,
      },
    });

    if (!table) {
      return NextResponse.json(
        {
          success: false,
          message: "Table not found",
        },
        { status: 404 },
      );
    }

    if (table.status !== TableStatus.CLEANING) {
      return NextResponse.json(
        {
          success: false,
          message: "Table is not cleaning",
        },
        { status: 400 },
      );
    }

    const updatedTable = await prisma.diningTable.update({
      where: {
        id: table.id,
      },

      data: {
        status: TableStatus.AVAILABLE,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedTable,
    });
  } catch (error) {
    console.error("[MARK_TABLE_CLEAN_ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to clean table",
      },
      { status: 500 },
    );
  }
}
