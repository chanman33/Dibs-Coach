import { z } from "zod";
import { Currency } from "@prisma/client";

export const SessionStatus = z.enum([
  "scheduled",
  "completed",
  "cancelled",
  "no_show",
]);
export type SessionStatus = z.infer<typeof SessionStatus>;

export const SessionType = z.enum([
  "PEER_TO_PEER",
  "MENTORSHIP",
  "GROUP",
]);
export type SessionType = z.infer<typeof SessionType>;

export const SessionSchema = z.object({
  id: z.number().optional(),
  coachDbId: z.number(),
  menteeDbId: z.number(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  durationMinutes: z.number().min(15).max(240),
  status: SessionStatus.default("scheduled"),
  description: z.string().optional(),
  sessionType: SessionType.default("MENTORSHIP"),
  
  // Integration fields
  calendlyEventId: z.string().optional(),
  calendlyEventUri: z.string().optional(),
  calendlyInviteeUri: z.string().optional(),
  calendlySchedulingUrl: z.string().optional(),
  zoomMeetingId: z.string().optional(),
  zoomJoinUrl: z.string().optional(),
  zoomStartUrl: z.string().optional(),
});

export type Session = z.infer<typeof SessionSchema> & {
  id: number;
  coach: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  mentee: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  payment?: {
    id: number;
    amount: number;
    currency: Currency;
    status: string;
  } | null;
};

export const CreateSessionSchema = SessionSchema.omit({
  id: true,
  status: true,
  calendlyEventId: true,
  calendlyEventUri: true,
  calendlyInviteeUri: true,
  calendlySchedulingUrl: true,
  zoomMeetingId: true,
  zoomJoinUrl: true,
  zoomStartUrl: true,
});

export type CreateSession = z.infer<typeof CreateSessionSchema>;

export const UpdateSessionSchema = SessionSchema.partial().extend({
  id: z.number(),
});

export type UpdateSession = z.infer<typeof UpdateSessionSchema>;

// Session rate calculation
export const SessionRateSchema = z.object({
  baseRate: z.number().min(0),
  duration: z.number().min(15).max(240),
  currency: z.nativeEnum(Currency).default(Currency.USD),
});

export type SessionRate = z.infer<typeof SessionRateSchema>;

// Session metrics
export const SessionMetricsSchema = z.object({
  totalSessions: z.number(),
  completedSessions: z.number(),
  cancelledSessions: z.number(),
  noShows: z.number(),
  totalHours: z.number(),
  averageDuration: z.number(),
  completionRate: z.number(),
});

export type SessionMetrics = z.infer<typeof SessionMetricsSchema>; 