import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { requireApiRole } from "@/lib/auth/require-api-role";
import { updateRecipeSchema } from "@/lib/validations/recipe";

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
        { success: false, message: auth.error.message },
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
        { success: false, message: "Restaurant not found" },
        { status: 404 },
      );
    }

    const body = await req.json();

    const parsed = updateRecipeSchema.safeParse(body);

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

    const recipe = await prisma.recipe.findFirst({
      where: {
        id,
        menuItem: {
          restaurantId: restaurant.id,
        },
      },
    });

    if (!recipe) {
      return NextResponse.json(
        { success: false, message: "Recipe not found" },
        { status: 404 },
      );
    }

    const updatedRecipe = await prisma.recipe.update({
      where: {
        id,
      },
      data: {
        quantityNeeded: parsed.data.quantityNeeded,
      },
      include: {
        menuItem: true,
        inventoryItem: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedRecipe,
    });
  } catch (error) {
    console.error("[UPDATE_RECIPE_ERROR]", error);

    return NextResponse.json(
      { success: false, message: "Failed to update recipe" },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const auth = await requireApiRole([Role.OWNER, Role.MANAGER]);

    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error.message },
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
        { success: false, message: "Restaurant not found" },
        { status: 404 },
      );
    }

    const recipe = await prisma.recipe.findFirst({
      where: {
        id,
        menuItem: {
          restaurantId: restaurant.id,
        },
      },
    });

    if (!recipe) {
      return NextResponse.json(
        { success: false, message: "Recipe not found" },
        { status: 404 },
      );
    }

    await prisma.recipe.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Recipe deleted",
    });
  } catch (error) {
    console.error("[DELETE_RECIPE_ERROR]", error);

    return NextResponse.json(
      { success: false, message: "Failed to delete recipe" },
      { status: 500 },
    );
  }
}