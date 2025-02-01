import { z } from "zod";

// Weekly schedule types
export const WeekDay = z.enum([
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
]);
export type WeekDay = z.infer<typeof WeekDay>;

export const TimeSlot = z.object({
  from: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  to: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
});
export type TimeSlot = z.infer<typeof TimeSlot>;

export const WeeklySchedule = z.record(WeekDay, z.array(TimeSlot));
export type WeeklySchedule = z.infer<typeof WeeklySchedule>;

export const Break = z.object({
  name: z.string(),
  from: z.string().datetime(),
  to: z.string().datetime(),
});
export type Break = z.infer<typeof Break>;

export const AvailabilityRules = z.object({
  weeklySchedule: WeeklySchedule,
  breaks: z.array(Break).optional(),
});
export type AvailabilityRules = z.infer<typeof AvailabilityRules>;

// Validation schemas
export const TimeSlotSchema = z.object({
  start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
});

export const WeeklyScheduleSchema = z.record(
  z.enum(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]),
  z.array(TimeSlotSchema)
);

export const BreakSchema = z.object({
  name: z.string(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  description: z.string().optional(),
});

export const AvailabilityRulesSchema = z.object({
  weeklySchedule: WeeklyScheduleSchema,
  breaks: z.array(BreakSchema),
  customDates: z.record(
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    z.array(TimeSlotSchema)
  ).optional(),
});

export const CoachingScheduleSchema = z.object({
  id: z.number().optional(),
  name: z.string(),
  timezone: z.string(),
  isDefault: z.boolean().default(false),
  active: z.boolean().default(true),
  defaultDuration: z.number().min(15).max(240).default(60),
  minimumDuration: z.number().min(15).max(240).default(30),
  maximumDuration: z.number().min(15).max(240).default(120),
  allowCustomDuration: z.boolean().default(true),
  bufferBefore: z.number().min(0).max(60).default(0),
  bufferAfter: z.number().min(0).max(60).default(0),
  rules: AvailabilityRules,
  calendlyEnabled: z.boolean().default(false),
  zoomEnabled: z.boolean().default(false),
});

export type CoachingSchedule = z.infer<typeof CoachingScheduleSchema> & {
  id: number;
}; 