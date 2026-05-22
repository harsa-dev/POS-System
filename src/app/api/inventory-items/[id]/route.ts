import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { requireApiRole } from "@/lib/auth/require-api-role";
import { updateInventoryItemSchema } from "@/lib/validations/inventory-item";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(req: Request, { params }: Params) {
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

    const parsed = updateInventoryItemSchema.safeParse(body);

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

    const existingItem = await prisma.inventoryItem.findFirst({
      where: {
        id,
        restaurantId: restaurant.id,
      },
    });

    if (!existingItem) {
      return NextResponse.json(
        {
          success: false,
          message: "Inventory item not found",
        },
        { status: 404 },
      );
    }

    const inventoryItem = await prisma.inventoryItem.update({
      where: {
        id,
      },
      data: {
        ...parsed.data,
        sku: parsed.data.sku || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: inventoryItem,
    });
  } catch (error) {
    console.error("[UPDATE_INVENTORY_ITEM_ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update inventory item",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: Request, { params }: Params) {
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

    const existingItem = await prisma.inventoryItem.findFirst({
      where: {
        id,
        restaurantId: restaurant.id,
      },
    });

    if (!existingItem) {
      return NextResponse.json(
        {
          success: false,
          message: "Inventory item not found",
        },
        { status: 404 },
      );
    }

    await prisma.inventoryItem.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Inventory item deleted",
    });
  } catch (error) {
    console.error("[DELETE_INVENTORY_ITEM_ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete inventory item",
      },
      { status: 500 },
    );
  }
}