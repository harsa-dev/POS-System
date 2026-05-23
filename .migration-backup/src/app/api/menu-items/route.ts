import { NextResponse } from "next/server";
import { AuditAction, Role } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { requireApiRole } from "@/lib/auth/require-api-role";
import { createMenuItemSchema } from "@/lib/validations/menu-item";

export async function GET() {
  try {
    const auth = await requireApiRole([
      Role.OWNER,
      Role.MANAGER,
      Role.CASHIER,
      Role.KITCHEN,
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

    const menuItems = await prisma.menuItem.findMany({
      where: {
        restaurantId: restaurant.id,
        isAvailable: true,
      },

      include: {
        category: true,

        recipes: {
          include: {
            inventoryItem: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    const menuItemsWithStatus = menuItems.map((menuItem) => {
      /**
       * Menu belum punya recipe.
       */
      if (menuItem.recipes.length === 0) {
        return {
          ...menuItem,

          availabilityStatus: "NO_RECIPE",
        };
      }

      /**
       * Semua bahan harus cukup.
       */
      const hasEnoughStock = menuItem.recipes.every((recipe) => {
        return (
          recipe.inventoryItem &&
          recipe.inventoryItem.currentStock >= recipe.quantityNeeded
        );
      });

      return {
        ...menuItem,

        availabilityStatus: hasEnoughStock ? "AVAILABLE" : "OUT_OF_STOCK",
      };
    });

    /**
     * Available tampil paling atas.
     */
    menuItemsWithStatus.sort((a, b) => {
      const order: Record<string, number> = {
        AVAILABLE: 0,
        OUT_OF_STOCK: 1,
        NO_RECIPE: 2,
      };

      return order[a.availabilityStatus] - order[b.availabilityStatus];
    });

    return NextResponse.json({
      success: true,
      data: menuItemsWithStatus,
    });
  } catch (error) {
    console.error("[GET_MENU_ITEMS_ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch menu items",
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

    const menuItem = await prisma.$transaction(async (tx) => {
      const createdMenuItem = await tx.menuItem.create({
        data: {
          name: parsed.data.name,
          description: parsed.data.description || null,

          price: parsed.data.price,

          imageUrl: parsed.data.imageUrl || null,

          categoryId: parsed.data.categoryId || null,

          restaurantId: restaurant.id,
        },

        include: {
          category: true,
        },
      });

      await tx.auditLog.create({
        data: {
          restaurantId: restaurant.id,

          userId: user.id,

          action: AuditAction.CREATE,

          entityType: "MenuItem",

          entityId: createdMenuItem.id,

          changes: {
            name: createdMenuItem.name,

            description: createdMenuItem.description,

            price: createdMenuItem.price,

            imageUrl: createdMenuItem.imageUrl,

            categoryId: createdMenuItem.categoryId,

            isAvailable: createdMenuItem.isAvailable,
          },
        },
      });

      return createdMenuItem;
    });

    return NextResponse.json({
      success: true,
      data: menuItem,
    });
  } catch (error) {
    console.error("[CREATE_MENU_ITEM_ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create menu item",
      },
      { status: 500 },
    );
  }
}
