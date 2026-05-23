import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { requireApiRole } from "@/lib/auth/require-api-role";
import { createInventoryItemSchema } from "@/lib/validations/inventory-item";

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

    const inventoryItems = await prisma.inventoryItem.findMany({
      where: {
        restaurantId: restaurant.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: inventoryItems,
    });
  } catch (error) {
    console.error("[GET_INVENTORY_ITEMS_ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch inventory items",
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

    const parsed = createInventoryItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid inventory item data",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const inventoryItem = await prisma.inventoryItem.create({
      data: {
        name: parsed.data.name,
        sku: parsed.data.sku || null,
        type: parsed.data.type,
        unit: parsed.data.unit,
        currentStock: parsed.data.currentStock ?? 0,
        minimumStock: parsed.data.minimumStock ?? 0,
        costPerUnit: parsed.data.costPerUnit ?? 0,
        restaurantId: restaurant.id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: inventoryItem,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[CREATE_INVENTORY_ITEM_ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create inventory item",
      },
      { status: 500 },
    );
  }
}