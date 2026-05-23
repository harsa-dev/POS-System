import { NextResponse } from "next/server";
import { AuditAction } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { createMenuItemSchema } from "@/lib/validations/menu-item";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const restaurant = await prisma.restaurant.findFirst({
      where:
        user.role === "OWNER"
          ? { ownerId: user.id }
          : { id: user.restaurantId ?? "" },
    });

    if (!restaurant) {
      return NextResponse.json(
        { success: false, message: "Restaurant not found" },
        { status: 404 },
      );
    }

    const oldMenuItem = await prisma.menuItem.findFirst({
      where: {
        id,
        restaurantId: restaurant.id,
      },
    });

    if (!oldMenuItem) {
      return NextResponse.json(
        { success: false, message: "Menu item not found" },
        { status: 404 },
      );
    }

    const menuItem = await prisma.$transaction(async (tx) => {
      const archivedMenuItem = await tx.menuItem.update({
        where: {
          id,
        },
        data: {
          isAvailable: false,
        },
      });

      await tx.auditLog.create({
        data: {
          restaurantId: restaurant.id,
          userId: user.id,
          action: AuditAction.DELETE,
          entityType: "MenuItem",
          entityId: archivedMenuItem.id,
          changes: {
            old: {
              isAvailable: oldMenuItem.isAvailable,
            },
            new: {
              isAvailable: false,
            },
          },
        },
      });

      return archivedMenuItem;
    });

    return NextResponse.json({
      success: true,
      message: "Menu item archived",
      data: menuItem,
    });
  } catch (error) {
    console.error("[DELETE_MENU_ITEM_ERROR]", error);

    return NextResponse.json(
      { success: false, message: "Failed to archive menu item" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const restaurant = await prisma.restaurant.findFirst({
      where:
        user.role === "OWNER"
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

    const parsed = createMenuItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid menu item data",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const oldMenuItem = await prisma.menuItem.findFirst({
      where: {
        id,
        restaurantId: restaurant.id,
      },
    });

    if (!oldMenuItem) {
      return NextResponse.json(
        { success: false, message: "Menu item not found" },
        { status: 404 },
      );
    }

    const menuItem = await prisma.$transaction(async (tx) => {
      const updatedMenuItem = await tx.menuItem.update({
        where: {
          id,
        },
        data: {
          ...parsed.data,
          categoryId: parsed.data.categoryId || null,
          description: parsed.data.description || null,
          imageUrl: parsed.data.imageUrl || null,
        },
        include: {
          category: true,
        },
      });

      await tx.auditLog.create({
        data: {
          restaurantId: restaurant.id,
          userId: user.id,
          action: AuditAction.UPDATE,
          entityType: "MenuItem",
          entityId: updatedMenuItem.id,
          changes: {
            old: {
              name: oldMenuItem.name,
              description: oldMenuItem.description,
              price: oldMenuItem.price,
              imageUrl: oldMenuItem.imageUrl,
              categoryId: oldMenuItem.categoryId,
              isAvailable: oldMenuItem.isAvailable,
            },
            new: {
              name: updatedMenuItem.name,
              description: updatedMenuItem.description,
              price: updatedMenuItem.price,
              imageUrl: updatedMenuItem.imageUrl,
              categoryId: updatedMenuItem.categoryId,
              isAvailable: updatedMenuItem.isAvailable,
            },
          },
        },
      });

      return updatedMenuItem;
    });

    return NextResponse.json({
      success: true,
      data: menuItem,
    });
  } catch (error) {
    console.error("[UPDATE_MENU_ITEM_ERROR]", error);

    return NextResponse.json(
      { success: false, message: "Failed to update menu item" },
      { status: 500 },
    );
  }
}