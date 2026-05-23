import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { requireApiRole } from "@/lib/auth/require-api-role";
import { errorResponse, successResponse } from "@/lib/api-response";
import { AppError } from "@/lib/errors";
import { createOrder } from "@/features/orders/services/create-order";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiRole([Role.OWNER, Role.MANAGER, Role.CASHIER]);

    if (auth.error) {
      return errorResponse(auth.error.message, auth.error.status);
    }

    const body = await request.json();

    const order = await createOrder({
      user: auth.user,
      body,
    });

    return successResponse(order, "Order created successfully", 201);
  } catch (error) {
    console.error("[CREATE_ORDER_ERROR]", error);

    if (error instanceof AppError) {
      return errorResponse(error.message, error.statusCode, error.errors);
    }

    return errorResponse(
      error instanceof Error ? error.message : "Failed to create order",
    );
  }
}
