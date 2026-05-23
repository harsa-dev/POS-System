import { NextResponse } from "next/server";
import { Role, TableStatus } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { requireApiRole } from "@/lib/auth/require-api-role";

export async function GET() {
  try {
    const auth = await requireApiRole([
      Role.OWNER,
      Role.MANAGER,
      Role.CASHIER,
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

    const tables = await prisma.diningTable.findMany({
      where: {
        restaurantId: restaurant.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: tables,
    });
  } catch (error) {
    console.error("[GET_TABLES_ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch tables",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
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

    const name = String(body.name ?? "").trim();
    const capacity = Number(body.capacity ?? 2);

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Table name is required",
        },
        { status: 400 },
      );
    }

    if (capacity <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Capacity must be greater than 0",
        },
        { status: 400 },
      );
    }

    const table = await prisma.diningTable.create({
      data: {
        name,
        capacity,
        status: TableStatus.AVAILABLE,
        restaurantId: restaurant.id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: table,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[CREATE_TABLE_ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create table",
      },
      { status: 500 },
    );
  }
}