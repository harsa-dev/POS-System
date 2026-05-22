import { NextResponse } from "next/server";
import { AttendanceStatus, Role } from "@prisma/client";

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

    const existingOpenAttendance = await prisma.attendance.findFirst({
      where: {
        userId: user.id,
        restaurantId: restaurant.id,
        clockOutAt: null,
      },
    });

    if (existingOpenAttendance) {
      return NextResponse.json(
        {
          success: false,
          message: "You already clocked in",
        },
        { status: 400 },
      );
    }

    const attendanceSetting = await prisma.attendanceSetting.findUnique({
      where: {
        restaurantId: restaurant.id,
      },
    });

    const now = new Date();

    let attendanceStatus: AttendanceStatus = AttendanceStatus.PRESENT;

    if (attendanceSetting) {
      const workStart = new Date(now);

      workStart.setHours(attendanceSetting.workStartHour);
      workStart.setMinutes(attendanceSetting.workStartMinute);
      workStart.setSeconds(0);
      workStart.setMilliseconds(0);

      const lateLimit = new Date(
        workStart.getTime() + attendanceSetting.lateTolerance * 60 * 1000,
      )

      if (now > lateLimit) {
        attendanceStatus = AttendanceStatus.LATE;
      }
    }

    const attendance = await prisma.attendance.create({
      data: {
        userId: user.id,
        restaurantId: restaurant.id,
        clockInAt: now,
        status: attendanceStatus,
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

    return NextResponse.json(
      {
        success: true,
        data: attendance,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[CLOCK_IN_ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to clock in",
      },
      { status: 500 },
    );
  }
}