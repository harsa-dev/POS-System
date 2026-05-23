// src/lib/api-response.ts

import { NextResponse } from "next/server";

type SuccessResponse<T> = {
  success: true;
  message: string;
  data: T;
};

type ErrorResponse = {
  success: false;
  message: string;
  errors?: unknown;
};

export function successResponse<T>(data: T, message = "Success", status = 200) {
  const response: SuccessResponse<T> = {
    success: true,
    message,
    data,
  };

  return NextResponse.json(response, {
    status,
  });
}

export function errorResponse(
  message = "Internal server error",
  status = 500,
  errors?: unknown,
) {
  const response: ErrorResponse = {
    success: false,
    message,

    ...(errors && { errors }),
  };

  return NextResponse.json(response, {
    status,
  });
}
