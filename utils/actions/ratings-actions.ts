'use server'

import { createAuthClient } from "../auth"
import { withServerAction } from "@/utils/middleware/withServerAction"
import { revalidatePath } from "next/cache"

interface RatingData {
  rating: number;
  review?: string;
  sessionUlid: string;
}

interface RatingResponse {
  success: boolean;
  averageRating?: number;
  totalReviews?: number;
}

export const submitRating = withServerAction<RatingResponse, RatingData>(
  async (data, { userUlid }) => {
    try {
      const supabase = await createAuthClient()

      // First verify the session exists and belongs to the user
      const { data: session, error: sessionError } = await supabase
        .from('Session')
        .select('coachUlid, status')
        .eq('ulid', data.sessionUlid)
        .eq('menteeUlid', userUlid)
        .single()

      if (sessionError || !session) {
        console.error('[SUBMIT_RATING_SESSION_ERROR]', {
          userUlid,
          sessionUlid: data.sessionUlid,
          error: sessionError,
          timestamp: new Date().toISOString()
        })
        return {
          data: null,
          error: {
            code: 'NOT_FOUND',
            message: 'Session not found or not authorized'
          }
        }
      }

      // Ensure session is completed
      if (session.status !== 'COMPLETED') {
        return {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Can only rate completed sessions'
          }
        }
      }

      const timestamp = new Date().toISOString()

      // Create the review
      const { error: reviewError } = await supabase
        .from('Review')
        .insert({
          ulid: crypto.randomUUID(),
          sessionUlid: data.sessionUlid,
          reviewerUlid: userUlid,
          revieweeUlid: session.coachUlid,
          rating: data.rating,
          review: data.review,
          createdAt: timestamp,
          updatedAt: timestamp
        })

      if (reviewError) {
        console.error('[SUBMIT_RATING_ERROR]', {
          userUlid,
          sessionUlid: data.sessionUlid,
          error: reviewError,
          timestamp
        })
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to submit rating'
          }
        }
      }

      // Calculate new average rating for the coach
      const { data: reviews, error: avgError } = await supabase
        .from('Review')
        .select('rating')
        .eq('revieweeUlid', session.coachUlid)

      if (avgError) {
        console.error('[CALCULATE_RATING_ERROR]', {
          coachUlid: session.coachUlid,
          error: avgError,
          timestamp
        })
        return {
          data: { success: true },
          error: null
        }
      }

      const totalReviews = reviews?.length || 0
      const averageRating = reviews?.reduce((sum, review) => sum + review.rating, 0) / totalReviews

      // Update coach profile with new average rating
      const { error: updateError } = await supabase
        .from('CoachProfile')
        .update({
          averageRating,
          updatedAt: timestamp
        })
        .eq('userUlid', session.coachUlid)

      if (updateError) {
        console.error('[UPDATE_COACH_RATING_ERROR]', {
          coachUlid: session.coachUlid,
          error: updateError,
          timestamp
        })
      }

      revalidatePath('/dashboard/coach/profile')
      revalidatePath('/dashboard/sessions')

      return {
        data: {
          success: true,
          averageRating,
          totalReviews
        },
        error: null
      }
    } catch (error) {
      console.error('[SUBMIT_RATING_ERROR]', {
        error,
        timestamp: new Date().toISOString()
      })
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          details: error instanceof Error ? error.message : String(error)
        }
      }
    }
  }
)

export const fetchCoachRatings = withServerAction<{
  averageRating: number;
  totalReviews: number;
  recentReviews: any[];
}, void>(
  async (_, { userUlid }) => {
    try {
      const supabase = await createAuthClient()

      // Get coach profile to verify coach status
      const { data: coachProfile, error: profileError } = await supabase
        .from('CoachProfile')
        .select('averageRating')
        .eq('userUlid', userUlid)
        .single()

      if (profileError) {
        console.error('[FETCH_COACH_RATINGS_ERROR]', {
          userUlid,
          error: profileError,
          timestamp: new Date().toISOString()
        })
        return {
          data: null,
          error: {
            code: 'NOT_FOUND',
            message: 'Coach profile not found'
          }
        }
      }

      // Get recent reviews
      const { data: reviews, error: reviewsError } = await supabase
        .from('Review')
        .select(`
          ulid,
          rating,
          review,
          createdAt,
          reviewer:reviewerUlid (
            firstName,
            lastName,
            profileImageUrl
          )
        `)
        .eq('revieweeUlid', userUlid)
        .order('createdAt', { ascending: false })
        .limit(5)

      if (reviewsError) {
        console.error('[FETCH_REVIEWS_ERROR]', {
          userUlid,
          error: reviewsError,
          timestamp: new Date().toISOString()
        })
        return {
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch reviews'
          }
        }
      }

      return {
        data: {
          averageRating: coachProfile.averageRating || 0,
          totalReviews: reviews?.length || 0,
          recentReviews: reviews || []
        },
        error: null
      }
    } catch (error) {
      console.error('[FETCH_RATINGS_ERROR]', {
        error,
        timestamp: new Date().toISOString()
      })
      return {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          details: error instanceof Error ? error.message : String(error)
        }
      }
    }
  }
) 