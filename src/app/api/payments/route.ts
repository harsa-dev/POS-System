import { NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

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

    const payments = await prisma.payment.findMany({
      where: {
        order: {
          restaurantId: restaurant.id,
        },
      },
      include: {
        order: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: payments,
    });
  } catch (error) {
    console.error("[GET_PAYMENTS_ERROR]", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch payments" },
      { status: 500 },
    );
  }
}