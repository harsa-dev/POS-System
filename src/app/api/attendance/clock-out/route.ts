import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { requireApiRole } from "@/lib/auth/require-api-role";

export async function POST() {
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

    const activeAttendance = await prisma.attendance.findFirst({
      where: {
        userId: user.id,
        restaurantId: restaurant.id,
        clockOutAt: null,
      },
      orderBy: {
        clockInAt: "desc",
      },
    });

    if (!activeAttendance) {
      return NextResponse.json(
        {
          success: false,
          message: "No active attendance found",
        },
        { status: 404 },
      );
    }

    const attendanceSetting = await prisma.attendanceSetting.findUnique({
      where: {
        restaurantId: restaurant.id,
      },
    });

    const clockOutAt = new Date();

    const workDurationMinutes = Math.max(
      0,
      Math.floor(
        (clockOutAt.getTime() - activeAttendance.clockInAt.getTime()) /
          1000 /
          60,
      ),
    );

    const overtimeAfterMinutes = attendanceSetting?.overtimeAfterMinutes ?? 480;

    const overtimeMinutes = Math.max(
      0,
      workDurationMinutes - overtimeAfterMinutes,
    );

    const attendance = await prisma.attendance.update({
      where: {
        id: activeAttendance.id,
      },
      data: {
        clockOutAt,
        workDurationMinutes,
        overtimeMinutes,
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
    });

    return NextResponse.json({
      success: true,
      data: attendance,
    });
  } catch (error) {
    console.error("[CLOCK_OUT_ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to clock out",
      },
      { status: 500 },
    );
  }
}
