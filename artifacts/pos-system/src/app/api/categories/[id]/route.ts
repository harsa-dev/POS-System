import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { requireApiRole } from "@/lib/auth/require-api-role";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

async function getRestaurantForUser(user: {
  id: string;
  role: Role;
  restaurantId: string | null;
}) {
  return prisma.restaurant.findFirst({
    where:
      user.role === Role.OWNER
        ? { ownerId: user.id }
        : { id: user.restaurantId ?? "" },
  });
}

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

    const restaurant = await getRestaurantForUser(user);

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

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Category name is required",
        },
        { status: 400 },
      );
    }

    const existingCategory = await prisma.category.findFirst({
      where: {
        id,
        restaurantId: restaurant.id,
      },
    });

    if (!existingCategory) {
      return NextResponse.json(
        {
          success: false,
          message: "Category not found",
        },
        { status: 404 },
      );
    }

    const duplicateCategory = await prisma.category.findFirst({
      where: {
        restaurantId: restaurant.id,
        name,
        NOT: {
          id,
        },
      },
    });

    if (duplicateCategory) {
      return NextResponse.json(
        {
          success: false,
          message: "Category already exists",
        },
        { status: 400 },
      );
    }

    const category = await prisma.category.update({
      where: {
        id,
      },
      data: {
        name,
      },
    });

    return NextResponse.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error("[UPDATE_CATEGORY_ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update category",
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

    const restaurant = await getRestaurantForUser(user);

    if (!restaurant) {
      return NextResponse.json(
        {
          success: false,
          message: "Restaurant not found",
        },
        { status: 404 },
      );
    }

    const existingCategory = await prisma.category.findFirst({
      where: {
        id,
        restaurantId: restaurant.id,
      },
      include: {
        menuItems: {
          select: {
            id: true,
          },
          take: 1,
        },
      },
    });

    if (!existingCategory) {
      return NextResponse.json(
        {
          success: false,
          message: "Category not found",
        },
        { status: 404 },
      );
    }

    if (existingCategory.menuItems.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Category is still used by menu items. Move or edit those items first.",
        },
        { status: 400 },
      );
    }

    await prisma.category.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("[DELETE_CATEGORY_ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete category",
      },
      { status: 500 },
    );
  }
}