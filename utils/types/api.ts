export type ApiError = string | null

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError;
} 