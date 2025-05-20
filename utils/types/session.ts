import { z } from "zod";

// Session status constants to match the database enum "SessionStatus"
export const SESSION_STATUS = {
  SCHEDULED: 'SCHEDULED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW'
} as const;

export type SessionStatus = typeof SESSION_STATUS[keyof typeof SESSION_STATUS];

// Session type constants to match the database enum "SessionType"
export const SESSION_TYPE = {
  PEER_TO_PEER: 'PEER_TO_PEER',
  MENTORSHIP: 'MENTORSHIP',
  GROUP: 'GROUP'
} as const;

export type SessionType = typeof SESSION_TYPE[keyof typeof SESSION_TYPE];

// Base user schema for other party in a session
export const userSchema = z.object({
  ulid: z.string().length(26),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  email: z.string().nullable(),
  profileImageUrl: z.string().nullable()
});

export type User = z.infer<typeof userSchema>;

// Schema for transformed sessions that will be returned to the client
export const transformedSessionSchema = z.object({
  ulid: z.string().length(26),
  durationMinutes: z.number(),
  status: z.enum(Object.values(SESSION_STATUS) as [string, ...string[]]),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  createdAt: z.string().datetime(),
  userRole: z.enum(['coach', 'mentee']),
  otherParty: userSchema,
  sessionType: z.enum(Object.values(SESSION_TYPE) as [string, ...string[]]).nullable(),
  zoomJoinUrl: z.string().nullable(),
  paymentStatus: z.string().nullable(),
  price: z.number().optional(),
  calBookingUid: z.string().nullable().optional()
});

export type TransformedSession = z.infer<typeof transformedSessionSchema>;

// Schema for coach sessions fetch response
export const coachSessionsResponseSchema = z.object({
  data: z.array(transformedSessionSchema).nullable(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional()
  }).nullable()
});

export type CoachSessionsResponse = z.infer<typeof coachSessionsResponseSchema>;

// Analytics schema for session dashboard
export const sessionsAnalyticsSchema = z.object({
  total: z.number(),
  scheduled: z.number(),
  completed: z.number(),
  cancelled: z.number(),
  no_show: z.number()
});

export type SessionsAnalytics = z.infer<typeof sessionsAnalyticsSchema>;

// Export default analytics with all values at 0
export const defaultAnalytics: SessionsAnalytics = {
  total: 0,
  scheduled: 0,
  completed: 0,
  cancelled: 0,
  no_show: 0
}; 