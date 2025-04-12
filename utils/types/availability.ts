import { z } from 'zod'
import { ApiResponse } from './api'

// Time slot validation regex
const TIME_FORMAT_REGEX = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/

// Days of week enum
export const DAYS_OF_WEEK = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY'
] as const

export type WeekDay = typeof DAYS_OF_WEEK[number]

// Time slot schema and type
export const TimeSlotSchema = z.object({
  from: z.string().regex(TIME_FORMAT_REGEX, 'Invalid time format. Use HH:mm'),
  to: z.string().regex(TIME_FORMAT_REGEX, 'Invalid time format. Use HH:mm')
}).refine(
  (data) => {
    const [fromHours, fromMinutes] = data.from.split(':').map(Number)
    const [toHours, toMinutes] = data.to.split(':').map(Number)
    const fromTime = fromHours * 60 + fromMinutes
    const toTime = toHours * 60 + toMinutes
    return toTime > fromTime
  },
  {
    message: 'End time must be after start time',
    path: ['to']
  }
)
export type TimeSlot = z.infer<typeof TimeSlotSchema>

// Weekly schedule schema and type
export const WeeklyScheduleSchema = z.object({
  SUNDAY: z.array(TimeSlotSchema),
  MONDAY: z.array(TimeSlotSchema),
  TUESDAY: z.array(TimeSlotSchema),
  WEDNESDAY: z.array(TimeSlotSchema),
  THURSDAY: z.array(TimeSlotSchema),
  FRIDAY: z.array(TimeSlotSchema),
  SATURDAY: z.array(TimeSlotSchema)
})
export type WeeklySchedule = z.infer<typeof WeeklyScheduleSchema>

// Break period schema and type
export const Break = z.object({
  name: z.string(),
  from: z.string().datetime(),
  to: z.string().datetime(),
  description: z.string().optional()
})
export type Break = z.infer<typeof Break>

// Availability rules schema and type
export const AvailabilityRules = z.object({
  weeklySchedule: WeeklyScheduleSchema,
  breaks: z.array(Break).optional()
})
export type AvailabilityRules = z.infer<typeof AvailabilityRules>

// Schedule schema and type
export const AvailabilitySchedule = z.object({
  ulid: z.string(),
  userUlid: z.string(),
  name: z.string(),
  timezone: z.string(),
  rules: AvailabilityRules,
  isDefault: z.boolean().default(true),
  active: z.boolean().default(true),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
})
export type AvailabilitySchedule = z.infer<typeof AvailabilitySchedule>

// API response types
export const AvailabilityResponse = z.object({
  schedule: WeeklyScheduleSchema,
  timezone: z.string().nullable()
})
export type AvailabilityResponse = z.infer<typeof AvailabilityResponse>

// Save availability schema
export const SaveAvailabilityParamsSchema = z.object({
  schedule: WeeklyScheduleSchema,
  timezone: z.string().optional()
})
export type SaveAvailabilityParams = z.infer<typeof SaveAvailabilityParamsSchema> 