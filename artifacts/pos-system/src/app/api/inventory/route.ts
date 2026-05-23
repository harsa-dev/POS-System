import { NextResponse } from "next/server";

import { Role } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { requireApiRole } from "@/lib/auth/require-api-role";
import { createStockMovementSchema } from "@/lib/validations/inventory";

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

    const currentUser = auth.user;

    const restaurant = await prisma.restaurant.findFirst({
      where:
        currentUser.role === Role.OWNER
          ? { ownerId: currentUser.id }
          : { id: currentUser.restaurantId ?? "" },
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

    const movements = await prisma.stockMovement.findMany({
      where: {
        inventoryItem: {
          restaurantId: restaurant.id,
        },
      },
      include: {
        inventoryItem: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: movements,
    });
  } catch (error) {
    console.error("[GET_INVENTORY_MOVEMENTS_ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch inventory movements",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
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

    const currentUser = auth.user;

    const restaurant = await prisma.restaurant.findFirst({
      where:
        currentUser.role === Role.OWNER
          ? { ownerId: currentUser.id }
          : { id: currentUser.restaurantId ?? "" },
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

    const parsed = createStockMovementSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid movement data",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { inventoryItemId, type, quantity, note, reason } = parsed.data;

    const inventoryItem = await prisma.inventoryItem.findFirst({
      where: {
        id: inventoryItemId,
        restaurantId: restaurant.id,
      },
    });

    if (!inventoryItem) {
      return NextResponse.json(
        {
          success: false,
          message: "Inventory item not found",
        },
        { status: 404 },
      );
    }

    let newStock = inventoryItem.currentStock;

    if (type === "IN") {
      newStock += quantity;
    }

    if (type === "OUT") {
      newStock -= quantity;
    }

    if (type === "ADJUSTMENT") {
      newStock = quantity;
    }

    if (newStock < 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Stock cannot be negative",
        },
        { status: 400 },
      );
    }

    const movement = await prisma.$transaction(async (tx) => {
      const createdMovement = await tx.stockMovement.create({
        data: {
          inventoryItemId,
          type,
          quantity,
          note: note || null,
          reason,
        },
        include: {
          inventoryItem: true,
        },
      });

      await tx.inventoryItem.update({
        where: {
          id: inventoryItemId,
        },
        data: {
          currentStock: newStock,
        },
      });

      return createdMovement;
    });

    return NextResponse.json({
      success: true,
      data: movement,
    });
  } catch (error) {
    console.error("[CREATE_INVENTORY_MOVEMENT_ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create inventory movement",
      },
      { status: 500 },
    );
  }
}