import { NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { requireApiRole } from "@/lib/auth/require-api-role";
import { Role } from "@prisma/client";

export async function GET() {
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
      where:
        user.role === "OWNER"
          ? { ownerId: user.id }
          : { id: user.restaurantId ?? "" },
    });

    if (!restaurant) {
      return NextResponse.json(
        { success: false, message: "Restaurant not found" },
        { status: 404 },
      );
    }

    const auditLogs = await prisma.auditLog.findMany({
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
        createdAt: "desc",
      },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      data: auditLogs,
    });
  } catch (error) {
    console.error("[GET_AUDIT_LOGS_ERROR]", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch audit logs" },
      { status: 500 },
    );
  }
}
