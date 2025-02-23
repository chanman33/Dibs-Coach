export type ApiErrorCode = 
  | 'FORBIDDEN'
  | 'DATABASE_ERROR'
  | 'INTERNAL_ERROR'
  | 'VALIDATION_ERROR'
  | 'FETCH_ERROR'
  | 'UPDATE_ERROR'
  | 'CREATE_ERROR'
  | 'NOT_FOUND'
  | 'MISSING_ID'
  | 'MISSING_PARAMETERS'
  | 'INVALID_ROLE'
  | 'COACH_UNAVAILABLE'
  | 'EVENT_NOT_FOUND'
  | 'INVALID_DURATION'
  | 'DURATION_OUT_OF_RANGE'
  | 'CONFLICT_CHECK_ERROR'
  | 'TIME_SLOT_TAKEN'
  | 'UNAUTHORIZED'
  | 'USER_NOT_FOUND'

export interface ApiError {
  code: ApiErrorCode;
  message: string;
  details?: unknown;
}

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
} 