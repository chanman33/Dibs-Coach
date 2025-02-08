'use server'

import { auth } from "@clerk/nextjs/server"
import { createAuthClient } from "../auth"
import { revalidatePath } from "next/cache"

interface GeneralFormData {
  displayName: string
  licenseNumber: string
  brokerage: string
  yearsOfExperience: string
  bio: string
  primaryMarket: string
}

interface CoachProfileFormData {
  coachingSpecialties: string[];
  yearsCoaching: number;
  hourlyRate: number;
  defaultDuration: number;
  minimumDuration: number;
  maximumDuration: number;
  allowCustomDuration: boolean;
  calendlyUrl?: string;
  eventTypeUrl?: string;
}

export async function fetchUserProfile() {
  try {
    const { userId } = await auth()
    if (!userId) {
      throw new Error('Unauthorized')
    }

    const supabase = await createAuthClient()

    // Fetch user and their realtor profile
    const { data, error } = await supabase
      .from('User')
      .select(`
        *,
        realtorProfile:RealtorProfile (
          bio,
          yearsExperience,
          primaryMarket,
          geographicFocus
        )
      `)
      .eq('userId', userId)
      .single()

    if (error) throw error

    // Handle realtorProfile being an array
    const realtorProfile = Array.isArray(data.realtorProfile) 
      ? data.realtorProfile[0] 
      : data.realtorProfile

    const formattedData = {
      displayName: data.displayName || '',
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      licenseNumber: data.licenseNumber || '',
      companyName: data.companyName || '',
      yearsOfExperience: realtorProfile?.yearsExperience?.toString() || '',
      bio: realtorProfile?.bio || '',
      primaryMarket: realtorProfile?.primaryMarket || '',
      brokerage: data.companyName || ''
    }

    return {
      success: true,
      data: formattedData
    }
  } catch (error) {
    console.error('[FETCH_PROFILE_ERROR]', error)
    return { success: false, error }
  }
}

export async function updateGeneralProfile(data: GeneralFormData) {
  try {
    const { userId } = await auth()
    if (!userId) {
      throw new Error('Unauthorized')
    }

    const supabase = await createAuthClient()

    // First get the user's database ID
    const { data: user, error: userQueryError } = await supabase
      .from('User')
      .select('id')
      .eq('userId', userId)
      .single()

    if (userQueryError) {
      console.error('[UPDATE_PROFILE] Error fetching user:', userQueryError)
      throw userQueryError
    }

    if (!user?.id) {
      throw new Error('User not found')
    }

    // Update User table
    const { error: userError } = await supabase
      .from('User')
      .update({
        displayName: data.displayName,
        licenseNumber: data.licenseNumber,
        companyName: data.brokerage,
        updatedAt: new Date().toISOString()
      })
      .eq('id', user.id)

    if (userError) {
      console.error('[UPDATE_PROFILE] Error updating user:', userError)
      throw userError
    }

    // Check if RealtorProfile exists
    const { data: existingProfile, error: profileQueryError } = await supabase
      .from('RealtorProfile')
      .select('*')
      .eq('userDbId', user.id)
      .single()

    let profileResult
    if (!existingProfile) {
      // Create new profile with required defaults
      profileResult = await supabase
        .from('RealtorProfile')
        .insert({
          userDbId: user.id,
          bio: data.bio,
          yearsExperience: parseInt(data.yearsOfExperience),
          primaryMarket: data.primaryMarket,
          propertyTypes: [],
          specializations: [],
          certifications: [],
          languages: ['English'],
          geographicFocus: {
            cities: [data.primaryMarket],
            neighborhoods: [],
            counties: []
          },
          slogan: null,
          websiteUrl: null,
          facebookUrl: null,
          instagramUrl: null,
          linkedinUrl: null,
          youtubeUrl: null,
          marketingAreas: [],
          testimonials: [],
          featuredListings: [],
          achievements: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .select()
        .single()
    } else {
      // Update existing profile
      profileResult = await supabase
        .from('RealtorProfile')
        .update({
          bio: data.bio,
          yearsExperience: parseInt(data.yearsOfExperience),
          primaryMarket: data.primaryMarket,
          geographicFocus: data.primaryMarket !== existingProfile.primaryMarket
            ? {
                ...existingProfile.geographicFocus,
                cities: Array.from(new Set([...(existingProfile.geographicFocus?.cities || []), data.primaryMarket]))
              }
            : existingProfile.geographicFocus,
          updatedAt: new Date().toISOString()
        })
        .eq('id', existingProfile.id)
        .select()
        .single()
    }

    if (profileResult.error) {
      console.error('[UPDATE_PROFILE] Error with profile:', profileResult.error)
      throw profileResult.error
    }

    revalidatePath('/dashboard/coach/profile')
    revalidatePath('/dashboard/mentee/profile')

    return { success: true, data: { user, profile: profileResult.data } }
  } catch (error) {
    console.error('[UPDATE_PROFILE_ERROR]', error)
    return { success: false, error }
  }
}

export async function updateCoachProfile(data: CoachProfileFormData) {
  try {
    const { userId } = await auth()
    if (!userId) {
      throw new Error('Unauthorized')
    }

    const supabase = await createAuthClient()

    // First get the user's database ID
    const { data: user, error: userQueryError } = await supabase
      .from('User')
      .select('id')
      .eq('userId', userId)
      .single()

    if (userQueryError) {
      console.error('[UPDATE_COACH_PROFILE] Error fetching user:', userQueryError)
      throw userQueryError
    }

    if (!user?.id) {
      throw new Error('User not found')
    }

    // Check if CoachProfile exists
    const { data: existingProfile, error: profileQueryError } = await supabase
      .from('CoachProfile')
      .select('*')
      .eq('userDbId', user.id)
      .single()

    let profileResult
    if (!existingProfile) {
      // Create new profile
      profileResult = await supabase
        .from('CoachProfile')
        .insert({
          userDbId: user.id,
          coachingSpecialties: data.coachingSpecialties,
          yearsCoaching: data.yearsCoaching,
          hourlyRate: data.hourlyRate,
          defaultDuration: data.defaultDuration,
          minimumDuration: data.minimumDuration,
          maximumDuration: data.maximumDuration,
          allowCustomDuration: data.allowCustomDuration,
          calendlyUrl: data.calendlyUrl,
          eventTypeUrl: data.eventTypeUrl,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .select()
        .single()
    } else {
      // Update existing profile
      profileResult = await supabase
        .from('CoachProfile')
        .update({
          coachingSpecialties: data.coachingSpecialties,
          yearsCoaching: data.yearsCoaching,
          hourlyRate: data.hourlyRate,
          defaultDuration: data.defaultDuration,
          minimumDuration: data.minimumDuration,
          maximumDuration: data.maximumDuration,
          allowCustomDuration: data.allowCustomDuration,
          calendlyUrl: data.calendlyUrl,
          eventTypeUrl: data.eventTypeUrl,
          updatedAt: new Date().toISOString()
        })
        .eq('id', existingProfile.id)
        .select()
        .single()
    }

    if (profileResult.error) {
      console.error('[UPDATE_COACH_PROFILE] Error with profile:', profileResult.error)
      throw profileResult.error
    }

    revalidatePath('/dashboard/coach/profile')

    return { success: true, data: profileResult.data }
  } catch (error) {
    console.error('[UPDATE_COACH_PROFILE_ERROR]', error)
    return { success: false, error }
  }
}

// Function to fetch coach profile data
export async function fetchCoachProfile() {
  try {
    const { userId } = await auth()
    if (!userId) {
      throw new Error('Unauthorized')
    }

    const supabase = await createAuthClient()

    // Fetch user and their coach profile
    const { data, error } = await supabase
      .from('User')
      .select(`
        *,
        coachProfile:CoachProfile (*)
      `)
      .eq('userId', userId)
      .single()

    if (error) throw error

    const coachProfile = data.coachProfile

    if (!coachProfile) {
      return {
        success: true,
        data: {
          coachingSpecialties: [],
          yearsCoaching: 0,
          hourlyRate: 0,
          defaultDuration: 60,
          minimumDuration: 30,
          maximumDuration: 120,
          allowCustomDuration: false,
          calendlyUrl: "",
          eventTypeUrl: "",
        }
      }
    }

    return {
      success: true,
      data: {
        coachingSpecialties: coachProfile.coachingSpecialties || [],
        yearsCoaching: coachProfile.yearsCoaching || 0,
        hourlyRate: coachProfile.hourlyRate || 0,
        defaultDuration: coachProfile.defaultDuration || 60,
        minimumDuration: coachProfile.minimumDuration || 30,
        maximumDuration: coachProfile.maximumDuration || 120,
        allowCustomDuration: coachProfile.allowCustomDuration || false,
        calendlyUrl: coachProfile.calendlyUrl || "",
        eventTypeUrl: coachProfile.eventTypeUrl || "",
      }
    }
  } catch (error) {
    console.error('[FETCH_COACH_PROFILE_ERROR]', error)
    return { success: false, error }
  }
} 