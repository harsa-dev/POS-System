import { NextResponse } from "next/server";
import { Role, ShiftStatus } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { requireApiRole } from "@/lib/auth/require-api-role";

export async function GET() {
  try {
    const auth = await requireApiRole([Role.OWNER, Role.MANAGER, Role.CASHIER]);

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
        {
          status: 404,
        },
      );
    }

    const currentShift = await prisma.shift.findFirst({
      where: {
        userId: user.id,
        restaurantId: restaurant.id,
        status: ShiftStatus.OPEN,
      },

      include: {
        orders: true,
      },

      orderBy: {
        openedAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: currentShift,
    });
  } catch (error) {
    console.error("[GET_CURRENT_SHIFT_ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch current shift",
      },
      {
        status: 500,
      },
    );
  }
}
