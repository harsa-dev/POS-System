import { NextResponse } from "next/server";
import { Role, TableStatus } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { requireApiRole } from "@/lib/auth/require-api-role";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(req: Request, { params }: Params) {
  try {
    const auth = await requireApiRole([
      Role.OWNER,
      Role.MANAGER,
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
    const { id } = await params;

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

    const name = typeof body.name === "string" ? body.name.trim() : undefined;
    const capacity =
      typeof body.capacity !== "undefined" ? Number(body.capacity) : undefined;
    const status = body.status as TableStatus | undefined;
    const isActive =
      typeof body.isActive === "boolean" ? body.isActive : undefined;

    if (capacity !== undefined && capacity <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Capacity must be greater than 0",
        },
        { status: 400 },
      );
    }

    if (status && !Object.values(TableStatus).includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid table status",
        },
        { status: 400 },
      );
    }

    const existingTable = await prisma.diningTable.findFirst({
      where: {
        id,
        restaurantId: restaurant.id,
      },
    });

    if (!existingTable) {
      return NextResponse.json(
        {
          success: false,
          message: "Table not found",
        },
        { status: 404 },
      );
    }

    const table = await prisma.diningTable.update({
      where: {
        id,
      },
      data: {
        ...(name ? { name } : {}),
        ...(capacity !== undefined ? { capacity } : {}),
        ...(status ? { status } : {}),
        ...(typeof isActive === "boolean" ? { isActive } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      data: table,
    });
  } catch (error) {
    console.error("[UPDATE_TABLE_ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update table",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const auth = await requireApiRole([
      Role.OWNER,
      Role.MANAGER,
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
    const { id } = await params;

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

    const existingTable = await prisma.diningTable.findFirst({
      where: {
        id,
        restaurantId: restaurant.id,
      },
    });

    if (!existingTable) {
      return NextResponse.json(
        {
          success: false,
          message: "Table not found",
        },
        { status: 404 },
      );
    }

    const table = await prisma.diningTable.update({
      where: {
        id,
      },
      data: {
        isActive: false,
        status: TableStatus.INACTIVE,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Table deactivated",
      data: table,
    });
  } catch (error) {
    console.error("[DELETE_TABLE_ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to deactivate table",
      },
      { status: 500 },
    );
  }
}