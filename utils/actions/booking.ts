"use server"

import { withServerAction } from "@/utils/middleware/withServerAction"
import { createAuthClient } from "@/utils/auth"
import { ApiResponse } from "@/utils/types/api"
import { z } from "zod"
import { ulidSchema } from "@/utils/types/auth"
import { CalendlyService } from "@/lib/calendly/calendly-service"
import { revalidatePath } from "next/cache"
import { CalendlyScheduledEvent } from "@/utils/types/calendly"
import { SupabaseClient } from "@supabase/supabase-js"

// Validation schemas
const BookingDataSchema = z.object({
  eventTypeUrl: z.string().url("Invalid event type URL"),
  scheduledTime: z.string().datetime("Invalid scheduled time"),
  inviteeEmail: z.string().email("Invalid email"),
  eventUri: z.string().url("Invalid event URI"),
  coachUlid: ulidSchema
})

// Response types
interface BookingResponse {
  session: {
    ulid: string
    startTime: string
    endTime: string
    durationMinutes: number
    status: string
    schedulingUrl: string
  }
}

// Database types
interface CoachProfileData {
  isActive: boolean
  durations: number[]
  minimumDuration: number
  maximumDuration: number
  allowCustomDuration: boolean
}

interface CoachData {
  ulid: string
  firstName: string
  lastName: string
  email: string
  coachProfile: CoachProfileData
  calendlyIntegration: {
    accessToken: string
    eventTypeId: string
  }[]
}

export const createBooking = withServerAction<BookingResponse, z.infer<typeof BookingDataSchema>>(
  async (data, { userUlid }) => {
    try {
      // Validate input data
      const validatedData = BookingDataSchema.parse(data)
      
      // Get Supabase client
      const supabase = await createAuthClient()

      // Get coach details
      const { data: coach, error: coachError } = await supabase
        .from("User")
        .select(`
          ulid,
          firstName,
          lastName,
          email,
          coachProfile:CoachProfile!userUlid (
            isActive,
            durations,
            minimumDuration,
            maximumDuration,
            allowCustomDuration
          ),
          calendlyIntegration:CalendlyIntegration!userUlid (
            accessToken,
            eventTypeId
          )
        `)
        .eq("ulid", validatedData.coachUlid)
        .single() as { data: CoachData | null, error: any }

      if (coachError || !coach) {
        console.error("[BOOKING_ERROR] Coach not found:", { 
          coachUlid: validatedData.coachUlid, 
          error: coachError 
        })
        return {
          data: null,
          error: {
            code: "COACH_NOT_FOUND",
            message: "Coach not found"
          }
        }
      }

      // Verify coach is active
      if (!coach.coachProfile?.isActive) {
        return {
          data: null,
          error: {
            code: "COACH_INACTIVE",
            message: "Coach is not accepting bookings"
          }
        }
      }

      // Initialize Calendly service
      const calendly = new CalendlyService()
      await calendly.init()

      // Get event details from Calendly
      const events = await calendly.getScheduledEvents({
        startTime: validatedData.scheduledTime,
        endTime: validatedData.scheduledTime,
        status: "active"
      })
      
      const event = events.find(e => e.uri === validatedData.eventUri)
      if (!event) {
        return {
          data: null,
          error: {
            code: "EVENT_NOT_FOUND",
            message: "Calendly event not found"
          }
        }
      }

      const startTime = new Date(event.start_time)
      const endTime = new Date(event.end_time)
      const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60))

      // Validate duration
      if (!coach.coachProfile.durations.includes(durationMinutes) && !coach.coachProfile.allowCustomDuration) {
        return {
          data: null,
          error: {
            code: "INVALID_DURATION",
            message: "Invalid session duration"
          }
        }
      }

      if (durationMinutes < coach.coachProfile.minimumDuration || 
          durationMinutes > coach.coachProfile.maximumDuration) {
        return {
          data: null,
          error: {
            code: "DURATION_OUT_OF_RANGE",
            message: "Session duration outside allowed range"
          }
        }
      }

      // Check for scheduling conflicts
      const { data: existingSessions, error: conflictError } = await supabase
        .from("Session")
        .select("ulid")
        .eq("coachUlid", coach.ulid)
        .or(`startTime.lte.${endTime.toISOString()},endTime.gte.${startTime.toISOString()}`)
        .neq("status", "CANCELLED")

      if (conflictError) {
        console.error("[BOOKING_ERROR] Failed to check conflicts:", {
          coachUlid: coach.ulid,
          error: conflictError
        })
        return {
          data: null,
          error: {
            code: "CONFLICT_CHECK_ERROR",
            message: "Error checking schedule conflicts"
          }
        }
      }

      if (existingSessions && existingSessions.length > 0) {
        return {
          data: null,
          error: {
            code: "TIME_SLOT_TAKEN",
            message: "Time slot is no longer available"
          }
        }
      }

      // Create session
      const { data: session, error: sessionError } = await supabase
        .from("Session")
        .insert({
          coachUlid: coach.ulid,
          menteeUlid: userUlid,
          calendlyEventId: validatedData.eventUri,
          durationMinutes,
          status: "SCHEDULED",
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .select()
        .single()

      if (sessionError || !session) {
        console.error("[BOOKING_ERROR] Failed to create session:", {
          coachUlid: coach.ulid,
          menteeUlid: userUlid,
          error: sessionError
        })
        return {
          data: null,
          error: {
            code: "SESSION_CREATE_ERROR",
            message: "Failed to create session"
          }
        }
      }

      // Revalidate relevant paths
      revalidatePath("/dashboard/mentee/sessions")
      revalidatePath("/dashboard/coach/sessions")

      return {
        data: {
          session: {
            ulid: session.ulid,
            startTime: session.startTime,
            endTime: session.endTime,
            durationMinutes: session.durationMinutes,
            status: session.status,
            schedulingUrl: validatedData.eventTypeUrl
          }
        },
        error: null
      }
    } catch (error) {
      console.error("[BOOKING_ERROR]", error)
      return {
        data: null,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
          details: error instanceof Error ? { message: error.message } : undefined
        }
      }
    }
  }
)