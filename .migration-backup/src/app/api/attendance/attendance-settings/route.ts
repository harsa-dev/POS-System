import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { requireApiRole } from "@/lib/auth/require-api-role";

export async function GET() {
  try {
    const auth = await requireApiRole([Role.OWNER, Role.MANAGER]);

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

    const setting = await prisma.attendanceSetting.upsert({
      where: {
        restaurantId: restaurant.id,
      },
      update: {},
      create: {
        restaurantId: restaurant.id,
        workStartHour: 9,
        workStartMinute: 0,
        lateTolerance: 15,
        overtimeAfterMinutes: 480,
      },
    });

    return NextResponse.json({
      success: true,
      data: setting,
    });
  } catch (error) {
    console.error("[GET_ATTENDANCE_SETTING_ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch attendance setting",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await requireApiRole([Role.OWNER]);

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
      where: {
        ownerId: user.id,
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

    const body = await req.json();

    const workStartHour = Number(body.workStartHour);
    const workStartMinute = Number(body.workStartMinute);
    const lateTolerance = Number(body.lateTolerance);
    const overtimeAfterMinutes = Number(body.overtimeAfterMinutes);

    if (
      workStartHour < 0 ||
      workStartHour > 23 ||
      workStartMinute < 0 ||
      workStartMinute > 59 ||
      lateTolerance < 0 ||
      overtimeAfterMinutes < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid attendance setting",
        },
        { status: 400 },
      );
    }

    const setting = await prisma.attendanceSetting.upsert({
      where: {
        restaurantId: restaurant.id,
      },
      update: {
        workStartHour,
        workStartMinute,
        lateTolerance,
        overtimeAfterMinutes,
      },
      create: {
        restaurantId: restaurant.id,
        workStartHour,
        workStartMinute,
        lateTolerance,
        overtimeAfterMinutes,
      },
    });

    return NextResponse.json({
      success: true,
      data: setting,
    });
  } catch (error) {
    console.error("[UPDATE_ATTENDANCE_SETTING_ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update attendance setting",
      },
      { status: 500 },
    );
  }
}
