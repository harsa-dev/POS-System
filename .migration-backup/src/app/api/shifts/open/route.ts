import { NextResponse } from "next/server";
import { Role, ShiftStatus } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { requireApiRole } from "@/lib/auth/require-api-role";

export async function POST(req: Request) {
  try {
    const auth = await requireApiRole([Role.OWNER, Role.MANAGER, Role.CASHIER]);

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

    const openingCash = Number(body.openingCash ?? 0);

    if (openingCash < 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Opening cash cannot be negative",
        },
        { status: 400 },
      );
    }

    const existingOpenShift = await prisma.shift.findFirst({
      where: {
        userId: user.id,
        restaurantId: restaurant.id,
        status: ShiftStatus.OPEN,
      },
    });

    if (existingOpenShift) {
      return NextResponse.json(
        {
          success: false,
          message: "You already have an open shift",
        },
        { status: 400 },
      );
    }

    const shift = await prisma.shift.create({
      data: {
        userId: user.id,
        restaurantId: restaurant.id,
        openingCash,
        expectedCash: openingCash,
        status: ShiftStatus.OPEN,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: shift,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[OPEN_SHIFT_ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to open shift",
      },
      { status: 500 },
    );
  }
}
