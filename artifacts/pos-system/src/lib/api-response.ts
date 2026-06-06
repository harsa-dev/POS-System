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

export function successResponse<T>(data: T, message = "Success", _status = 200): SuccessResponse<T> {
  return { success: true, message, data };
}

export function errorResponse(
  message = "Internal server error",
  _status = 500,
  errors?: unknown,
): ErrorResponse {
  return errors === undefined ? { success: false, message } : { success: false, message, errors };
}
