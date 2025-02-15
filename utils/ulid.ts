import { ulid } from 'ulid'
import { z } from 'zod'

// ULID validation schema
export const ulidSchema = z.string().length(26).regex(/^[0-9A-HJKMNP-TV-Z]{26}$/)

// Type for ULID
export type ULID = z.infer<typeof ulidSchema>

// Generate a new ULID
export const generateULID = (): ULID => {
  return ulid() as ULID
}

// Validate a ULID
export const isValidULID = (id: string): boolean => {
  return ulidSchema.safeParse(id).success
}

// Convert legacy ID to ULID format (for testing/development only)
export const legacyIdToULID = (id: number): ULID => {
  const timestamp = Date.now()
  const paddedId = id.toString().padStart(16, '0')
  return ulid(timestamp) as ULID
}

// Extract timestamp from ULID
export const getTimestampFromULID = (id: ULID): Date => {
  return new Date(parseInt(id.substring(0, 10), 32))
} 