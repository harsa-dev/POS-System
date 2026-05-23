import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { requireApiRole } from "@/lib/auth/require-api-role";
import { createRecipeSchema } from "@/lib/validations/recipe";

export async function GET() {
  try {
    const auth = await requireApiRole([Role.OWNER, Role.MANAGER]);

    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error.message },
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
        { success: false, message: "Restaurant not found" },
        { status: 404 },
      );
    }

    const recipes = await prisma.recipe.findMany({
      where: {
        menuItem: {
          restaurantId: restaurant.id,
        },
      },
      include: {
        menuItem: true,
        inventoryItem: true,
      },
      orderBy: {
        menuItem: {
          name: "asc",
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: recipes,
    });
  } catch (error) {
    console.error("[GET_RECIPES_ERROR]", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch recipes" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireApiRole([Role.OWNER, Role.MANAGER]);

    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error.message },
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
        { success: false, message: "Restaurant not found" },
        { status: 404 },
      );
    }

    const body = await req.json();

    const parsed = createRecipeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid recipe data",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const menuItem = await prisma.menuItem.findFirst({
      where: {
        id: parsed.data.menuItemId,
        restaurantId: restaurant.id,
      },
    });

    if (!menuItem) {
      return NextResponse.json(
        { success: false, message: "Menu item not found" },
        { status: 404 },
      );
    }

    const inventoryItem = await prisma.inventoryItem.findFirst({
      where: {
        id: parsed.data.inventoryItemId,
        restaurantId: restaurant.id,
      },
    });

    if (!inventoryItem) {
      return NextResponse.json(
        { success: false, message: "Inventory item not found" },
        { status: 404 },
      );
    }

    const recipe = await prisma.recipe.upsert({
      where: {
        menuItemId_inventoryItemId: {
          menuItemId: parsed.data.menuItemId,
          inventoryItemId: parsed.data.inventoryItemId,
        },
      },
      create: {
        menuItemId: parsed.data.menuItemId,
        inventoryItemId: parsed.data.inventoryItemId,
        quantityNeeded: parsed.data.quantityNeeded,
      },
      update: {
        quantityNeeded: parsed.data.quantityNeeded,
      },
      include: {
        menuItem: true,
        inventoryItem: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: recipe,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[CREATE_RECIPE_ERROR]", error);

    return NextResponse.json(
      { success: false, message: "Failed to create recipe" },
      { status: 500 },
    );
  }
}