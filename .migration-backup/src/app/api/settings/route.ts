import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { requireApiRole } from "@/lib/auth/require-api-role";

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

    return NextResponse.json({
      success: true,
      data: restaurant,
    });
  } catch (error) {
    console.error("[GET_SETTINGS_ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch settings",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await requireApiRole([Role.OWNER]);

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
      where: {
        ownerId: user.id,
      },
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

    const taxRate = Number(body.taxRate ?? 0);

    const serviceRate = Number(body.serviceRate ?? 0);

    const currency = String(body.currency ?? "IDR")
      .trim()
      .toUpperCase();

    const timezone = String(body.timezone ?? "Asia/Makassar").trim();

    const receiptFooter = String(
      body.receiptFooter ?? "Thank you for your order.",
    ).trim();

    const autoPrint = Boolean(body.autoPrint);

    const orderPrefix = String(body.orderPrefix ?? "ORD")
      .trim()
      .toUpperCase();

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Restaurant name is required",
        },
        { status: 400 },
      );
    }

    if (taxRate < 0 || serviceRate < 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Tax and service rate cannot be negative",
        },
        { status: 400 },
      );
    }

    if (!currency) {
      return NextResponse.json(
        {
          success: false,
          message: "Currency is required",
        },
        { status: 400 },
      );
    }

    if (!timezone) {
      return NextResponse.json(
        {
          success: false,
          message: "Timezone is required",
        },
        { status: 400 },
      );
    }

    const updatedRestaurant = await prisma.restaurant.update({
      where: {
        id: restaurant.id,
      },

      data: {
        name,

        address: body.address ? String(body.address).trim() : null,

        phone: body.phone ? String(body.phone).trim() : null,

        logoUrl: body.logoUrl ? String(body.logoUrl).trim() : null,

        taxRate,

        serviceRate,

        currency,

        timezone,

        receiptFooter,

        autoPrint,

        orderPrefix,

        cashEnabled: body.cashEnabled ?? true,

        qrisEnabled: body.qrisEnabled ?? false,

        cardEnabled: body.cardEnabled ?? false,

        transferEnabled: body.transferEnabled ?? false,

        midtransEnabled: body.midtransEnabled ?? false,

        midtransServerKey: body.midtransServerKey
          ? String(body.midtransServerKey).trim()
          : null,

        midtransClientKey: body.midtransClientKey
          ? String(body.midtransClientKey).trim()
          : null,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedRestaurant,
    });
  } catch (error) {
    console.error("[UPDATE_SETTINGS_ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update settings",
      },
      { status: 500 },
    );
  }
}
