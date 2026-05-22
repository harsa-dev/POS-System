import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { requireApiRole } from "@/lib/auth/require-api-role";

export async function GET() {
  try {
    const auth = await requireApiRole([
      Role.OWNER,
      Role.MANAGER,
      Role.CASHIER,
      Role.KITCHEN,
      Role.SERVER,
    ]);

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

    const attendances = await prisma.attendance.findMany({
      where: {
        restaurantId: restaurant.id,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        clockInAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: attendances,
    });
  } catch (error) {
    console.error("[GET_ATTENDANCE_ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch attendance",
      },
      { status: 500 },
    );
  }
}