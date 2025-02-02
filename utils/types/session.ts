import { z } from "zod";
import { Currency, SessionStatus, SessionType } from "@prisma/client";

export const sessionSchema = z.object({
  id: z.number().describe("Internal database ID"),
  menteeDbId: z.number(),
  coachDbId: z.number(),
  startTime: z.date(),
  endTime: z.date(),
  status: z.nativeEnum(SessionStatus).default("scheduled"),
  sessionNotes: z.string().nullable(),
  zoomMeetingId: z.string().nullable(),
  zoomMeetingUrl: z.string().nullable(),
  
  // Payment fields
  priceAmount: z.number(),
  priceInCents: z.number().optional().describe("Computed field from priceAmount"),
  currency: z.nativeEnum(Currency).default("USD"),
  platformFeeAmount: z.number().nullable(),
  coachPayoutAmount: z.number().nullable(),
  stripePaymentIntentId: z.string().nullable(),
  paymentStatus: z.string().default("pending"),
  payoutStatus: z.string().nullable(),
  
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Extended session type with relations
export type SessionWithRelations = z.infer<typeof sessionSchema> & {
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

export const sessionCreateSchema = z.object({
  menteeDbId: z.number(),
  coachDbId: z.number(),
  startTime: z.date(),
  endTime: z.date(),
  priceAmount: z.number(),
  sessionType: z.nativeEnum(SessionType).default("MENTORSHIP"),
});

export const sessionUpdateSchema = z.object({
  id: z.number(),
  status: z.nativeEnum(SessionStatus).optional(),
  sessionNotes: z.string().optional(),
  zoomMeetingId: z.string().optional(),
  zoomMeetingUrl: z.string().optional(),
  paymentStatus: z.string().optional(),
  payoutStatus: z.string().optional(),
});

// Type exports
export type Session = z.infer<typeof sessionSchema> & {
  durationMinutes: number;
};
export type SessionCreate = z.infer<typeof sessionCreateSchema>;
export type SessionUpdate = z.infer<typeof sessionUpdateSchema>;

// Session rate calculation
export const sessionRateSchema = z.object({
  baseRate: z.number().min(0),
  duration: z.number().min(15).max(240),
  currency: z.nativeEnum(Currency).default("USD"),
});

export type SessionRate = z.infer<typeof sessionRateSchema>;

// Session metrics
export const sessionMetricsSchema = z.object({
  totalSessions: z.number(),
  completedSessions: z.number(),
  cancelledSessions: z.number(),
  noShows: z.number(),
  totalHours: z.number(),
  averageDuration: z.number(),
  completionRate: z.number(),
});

export type SessionMetrics = z.infer<typeof sessionMetricsSchema>;

// Update the SessionWithCoach type
export type SessionWithCoach = z.infer<typeof sessionSchema> & {
  coach: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    email: string;
    stripeConnectAccountId?: string | null;
  };
  // ... other relations ...
}; 