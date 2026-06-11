export type ApiPaginationMeta = {
  page?: number;
  limit: number;
  totalItems?: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  nextCursor?: string | null;
};

export type ApiMeta = {
  pagination?: ApiPaginationMeta;
  filters?: Record<string, unknown>;
};

export type ApiSuccessResponse<TData> = {
  success: true;
  message?: string;
  data: TData;
  meta?: ApiMeta;
  requestId?: string;
};

export type ApiErrorResponse = {
  success: false;
  message: string;
  code: string;
  details?: unknown;
  requestId?: string;
};

export type ApiResponse<TData> = ApiSuccessResponse<TData> | ApiErrorResponse;
