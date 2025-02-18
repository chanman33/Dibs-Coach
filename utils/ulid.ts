import { ulid, decodeTime } from 'ulid'
import { z } from 'zod'

// ULID validation schema
export const ulidSchema = z.string().length(26).regex(/^[0-7][0-9A-HJKMNP-TV-Z]{25}$/)

// Type for ULID strings
export type ULID = z.infer<typeof ulidSchema>

/**
 * Generates a new ULID
 * @returns A new ULID string
 */
export function generateUlid(): string {
  return ulid()
}

/**
 * Gets the timestamp from a ULID
 * @param id The ULID to get the timestamp from
 * @returns The Date object representing when the ULID was created
 */
export function getTimestampFromUlid(id: string): Date {
  return new Date(decodeTime(id))
}

/**
 * Validates if a string is a valid ULID
 * @param id The string to validate
 * @returns True if the string is a valid ULID
 */
export function isValidUlid(id: string): boolean {
  if (!id || typeof id !== 'string' || id.length !== 26) {
    return false
  }
  
  try {
    // Attempt to decode the timestamp - will throw if invalid
    decodeTime(id)
    return true
  } catch {
    return false
  }
}

// Compare two ULIDs (returns -1, 0, or 1)
export const compareUlids = (a: ULID, b: ULID): number => {
  if (a < b) return -1
  if (a > b) return 1
  return 0
}

// Generate a ULID with a specific timestamp
export const generateUlidWithTimestamp = (timestamp: number): ULID => {
  const newUlid = ulid(timestamp)
  const result = ulidSchema.safeParse(newUlid)
  if (!result.success) {
    throw new Error('Generated ULID failed validation')
  }
  return newUlid
}

// Convert legacy ID to ULID format (for testing/development only)
export const legacyIdToULID = (id: number): ULID => {
  const timestamp = Date.now()
  const paddedId = id.toString().padStart(16, '0')
  return ulid(timestamp) as ULID
} 