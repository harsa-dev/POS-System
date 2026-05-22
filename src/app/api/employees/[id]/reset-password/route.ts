import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/get-current-user";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(req: Request, { params }: Params) {
  try {
    const currentUser = await getCurrentUser();
    const { id } = await params;

    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    if (currentUser.role !== Role.OWNER) {
      return NextResponse.json(
        { success: false, message: "Only owner can reset employee password" },
        { status: 403 },
      );
    }

    const restaurant = await prisma.restaurant.findFirst({
      where: {
        ownerId: currentUser.id,
      },
    });

    if (!restaurant) {
      return NextResponse.json(
        { success: false, message: "Restaurant not found" },
        { status: 404 },
      );
    }

    if (id === currentUser.id) {
      return NextResponse.json(
        { success: false, message: "Owner cannot reset themselves here" },
        { status: 400 },
      );
    }

    const body = await req.json();
    const password = String(body.password ?? "");

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 6 characters" },
        { status: 400 },
      );
    }

    const employee = await prisma.user.findFirst({
      where: {
        id,
        restaurantId: restaurant.id,
      },
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, message: "Employee not found" },
        { status: 404 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: {
        id,
      },
      data: {
        passwordHash,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Employee password reset successfully",
    });
  } catch (error) {
    console.error("[RESET_EMPLOYEE_PASSWORD_ERROR]", error);

    return NextResponse.json(
      { success: false, message: "Failed to reset employee password" },
      { status: 500 },
    );
  }
}