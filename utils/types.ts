// Re-export selected types from domain-specific files
// Import specific types from user to avoid naming conflicts
import { 
  UserRole, 
  UserCapability, 
  UserStatus,
  userCreateSchema,
  userUpdateSchema
} from './types/user';

// Re-export the imports
export { 
  UserRole, 
  UserCapability, 
  UserStatus,
  userCreateSchema,
  userUpdateSchema
};

// Re-export other type modules (avoiding conflicts with imports above)
export * from './types/session';
export * from './types/payment';
export * from './types/coach';
export * from './types/zoom';
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