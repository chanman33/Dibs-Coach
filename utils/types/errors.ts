import { z } from 'zod';

export interface ValidationError {
  code: 'VALIDATION_ERROR';
  message: string;
  details: {
    fieldErrors: Record<string, string[]>;
    formErrors: string[];
  };
}

export interface InternalError {
  code: 'INTERNAL_ERROR';
  message: string;
}

export type AppError = ValidationError | InternalError;

export interface ActionResult<T> {
  data: T | null;
  error: AppError | null;
} 