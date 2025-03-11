// Re-export all types from domain-specific files
export * from './types/user';
export * from './types/session';
export * from './types/payment';
export * from './types/coach';
export * from './types/zoom';
export * from './types/realtor';
export * from './types/review';

// Common type utilities
export type ApiResponse<T> = {
  data: T | null;
  error: {
    code: string;
    message: string;
    details?: unknown;
  } | null;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

export type UserUpdate = {
  userId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  phoneNumber?: string;
  companyName?: string;
  licenseNumber?: string;
}; 