import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

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

    const shifts = await prisma.shift.findMany({
      where: {
        restaurantId: restaurant.id,
      },

      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },

        orders: {
          select: {
            id: true,
            total: true,
            paymentMethod: true,
            status: true,
          },
        },
      },

      orderBy: {
        openedAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: shifts,
    });
  } catch (error) {
    console.error("[GET_SHIFTS_ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch shifts",
      },
      {
        status: 500,
      },
    );
  }
}
