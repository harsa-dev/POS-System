import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/get-current-user";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

const allowedEmployeeRoles: Role[] = [
  Role.MANAGER,
  Role.CASHIER,
  Role.KITCHEN,
  Role.SERVER,
];

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
        { success: false, message: "Only owner can update employee" },
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
        { success: false, message: "Owner cannot update themselves here" },
        { status: 400 },
      );
    }

    const body = await req.json();

    const name = typeof body.name === "string" ? body.name.trim() : undefined;
    const role = body.role as Role | undefined;
    const isActive =
      typeof body.isActive === "boolean" ? body.isActive : undefined;

    if (role && !allowedEmployeeRoles.includes(role)) {
      return NextResponse.json(
        { success: false, message: "Invalid employee role" },
        { status: 400 },
      );
    }

    const existingEmployee = await prisma.user.findFirst({
      where: {
        id,
        restaurantId: restaurant.id,
      },
    });

    if (!existingEmployee) {
      return NextResponse.json(
        { success: false, message: "Employee not found" },
        { status: 404 },
      );
    }

    const employee = await prisma.user.update({
      where: {
        id,
      },
      data: {
        ...(name ? { name } : {}),
        ...(role ? { role } : {}),
        ...(typeof isActive === "boolean" ? { isActive } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Employee updated",
      data: employee,
    });
  } catch (error) {
    console.error("[UPDATE_EMPLOYEE_ERROR]", error);

    return NextResponse.json(
      { success: false, message: "Failed to update employee" },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: Request, { params }: Params) {
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
        { success: false, message: "Only owner can deactivate employee" },
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
        { success: false, message: "Owner cannot deactivate themselves" },
        { status: 400 },
      );
    }

    const existingEmployee = await prisma.user.findFirst({
      where: {
        id,
        restaurantId: restaurant.id,
      },
    });

    if (!existingEmployee) {
      return NextResponse.json(
        { success: false, message: "Employee not found" },
        { status: 404 },
      );
    }

    const employee = await prisma.user.update({
      where: {
        id,
      },
      data: {
        isActive: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Employee deactivated",
      data: employee,
    });
  } catch (error) {
    console.error("[DEACTIVATE_EMPLOYEE_ERROR]", error);

    return NextResponse.json(
      { success: false, message: "Failed to deactivate employee" },
      { status: 500 },
    );
  }
}