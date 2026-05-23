// src/lib/errors.ts

export class AppError extends Error {
  public statusCode: number;

  public errors?: unknown;

  constructor(
    message: string,
    statusCode = 500,
    errors?: unknown,
  ) {
    super(message);

    this.name = "AppError";

    this.statusCode = statusCode;

    this.errors = errors;
  }
}

export class BadRequestError extends AppError {
  constructor(
    message = "Bad request",
    errors?: unknown,
  ) {
    super(message, 400, errors);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(
    message = "Resource not found",
  ) {
    super(message, 404);
  }
}