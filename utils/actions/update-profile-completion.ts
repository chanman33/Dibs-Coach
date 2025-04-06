'use server'

import { createAuthClient } from '@/utils/auth'
import { calculateProfileCompletion } from '@/utils/actions/calculateProfileCompletion'
import { revalidatePath } from 'next/cache'

/**
 * Update profile completion percentage in database.
 * Acts as a single source of truth for updating completion status.
 * 
 * @param userUlid - The user ULID to update
 * @param forceRefresh - Whether to force recalculation (default: false)
 * @returns The updated completion percentage and whether publication is allowed
 */
export async function updateProfileCompletion(userUlid: string, forceRefresh = false): Promise<{
  success: boolean
  completionPercentage: number
  canPublish: boolean
}> {
  try {
    console.log('[UPDATE_PROFILE_COMPLETION_START]', {
      userUlid,
      forceRefresh,
      timestamp: new Date().toISOString()
    })
    
    const supabase = createAuthClient()

    // Fetch coach profile data needed for completion calculation
    const { data: userProfileData, error: userError } = await supabase
      .from('User')
      .select('firstName, lastName, bio, profileImageUrl')
      .eq('ulid', userUlid)
      .single()

    if (userError) {
      console.error('[UPDATE_PROFILE_COMPLETION_ERROR]', {
        error: userError,
        userUlid,
        timestamp: new Date().toISOString()
      })
      return { success: false, completionPercentage: 0, canPublish: false }
    }

    const { data: coachProfile, error: coachError } = await supabase
      .from('CoachProfile')
      .select('coachSkills, hourlyRate, yearsCoaching, coachRealEstateDomains, coachPrimaryDomain, profileSlug, completionPercentage')
      .eq('userUlid', userUlid)
      .single()

    if (coachError) {
      console.error('[UPDATE_PROFILE_COMPLETION_ERROR]', {
        error: coachError,
        userUlid,
        timestamp: new Date().toISOString()
      })
      return { success: false, completionPercentage: 0, canPublish: false }
    }

    // Check for availability schedule
    const { data: availabilitySchedules, error: availabilityError } = await supabase
      .from('CoachingAvailabilitySchedule')
      .select('ulid')
      .eq('userUlid', userUlid)
      .eq('active', true)
      .limit(1)

    if (availabilityError) {
      console.error('[UPDATE_PROFILE_COMPLETION_AVAILABILITY_ERROR]', {
        error: availabilityError,
        userUlid,
        timestamp: new Date().toISOString()
      })
      // Continue despite error, just assume no availability
    }

    // Skip update if we already have the completion percentage and not forcing refresh
    if (!forceRefresh && 
        typeof coachProfile.completionPercentage === 'number' && 
        coachProfile.completionPercentage > 0) {
      console.log('[UPDATE_PROFILE_COMPLETION_SKIP]', {
        userUlid,
        existingPercentage: coachProfile.completionPercentage,
        timestamp: new Date().toISOString()
      })
      return { 
        success: true, 
        completionPercentage: coachProfile.completionPercentage,
        canPublish: coachProfile.completionPercentage >= 70 // Match PROFILE_REQUIREMENTS.MINIMUM_COMPLETION
      }
    }

    // Create profile data object for completion calculation
    const profileData = {
      firstName: userProfileData.firstName,
      lastName: userProfileData.lastName,
      bio: userProfileData.bio,
      profileImageUrl: userProfileData.profileImageUrl,
      coachingSpecialties: coachProfile.coachSkills || [],
      hourlyRate: coachProfile.hourlyRate,
      yearsCoaching: coachProfile.yearsCoaching,
      hasAvailabilitySchedule: availabilitySchedules && availabilitySchedules.length > 0,
      coachRealEstateDomains: coachProfile.coachRealEstateDomains || [],
      coachPrimaryDomain: coachProfile.coachPrimaryDomain,
      profileSlug: coachProfile.profileSlug
    }

    // Calculate completion percentage
    const { 
      percentage, 
      canPublish, 
      missingFields,
      missingRequiredFields,
      optionalMissingFields,
      validationMessages
    } = calculateProfileCompletion(profileData)

    console.log('[UPDATE_PROFILE_COMPLETION_CALCULATED]', {
      userUlid,
      newCompletionPercentage: percentage,
      canPublish,
      hasAvailability: availabilitySchedules && availabilitySchedules.length > 0,
      timestamp: new Date().toISOString()
    })

    // Update coach profile with new completion percentage
    const { error: updateError } = await supabase
      .from('CoachProfile')
      .update({
        completionPercentage: percentage,
        updatedAt: new Date().toISOString()
      })
      .eq('userUlid', userUlid)

    if (updateError) {
      console.error('[UPDATE_PROFILE_COMPLETION_DB_ERROR]', {
        error: updateError,
        userUlid,
        timestamp: new Date().toISOString()
      })
      return { success: false, completionPercentage: percentage, canPublish }
    }

    // Revalidate the coach profile page
    revalidatePath('/dashboard/coach/profile')

    return {
      success: true,
      completionPercentage: percentage,
      canPublish
    }
  } catch (error) {
    console.error('[UPDATE_PROFILE_COMPLETION_UNHANDLED_ERROR]', {
      error,
      userUlid,
      timestamp: new Date().toISOString()
    })
    return { success: false, completionPercentage: 0, canPublish: false }
  }
} 