export type AppErrorInput = {
  message: string;
  code: string;
  statusCode: number;
  details?: unknown;
};

export class AppError extends Error {
  code: string;
  statusCode: number;
  details?: unknown;

  constructor({ message, code, statusCode, details }: AppErrorInput) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
