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

interface ProfessionalRecognition {
  id: number;
  title: string;
  type: "AWARD" | "ACHIEVEMENT";
  year: number;
  organization: string | null;
  description: string | null;
  createdAt?: string;
  updatedAt?: string;
  archivedAt?: string | null;
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
          bio: data.bio || null,
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
          professionalRecognitions: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .select()
        .single()
    } else {
      // Update existing profile, preserving existing data
      const updatedProfile = {
        ...existingProfile,
        bio: data.bio || existingProfile.bio,
        yearsExperience: parseInt(data.yearsOfExperience),
        primaryMarket: data.primaryMarket,
        geographicFocus: data.primaryMarket !== existingProfile.primaryMarket
          ? {
              ...existingProfile.geographicFocus,
              cities: Array.from(new Set([...(existingProfile.geographicFocus?.cities || []), data.primaryMarket]))
            }
          : existingProfile.geographicFocus,
        updatedAt: new Date().toISOString()
      }

      profileResult = await supabase
        .from('RealtorProfile')
        .update(updatedProfile)
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

export async function updateCoachProfile(formData: any) {
  try {
    console.log('[DEBUG] Starting updateCoachProfile with formData:', formData)
    const { userId } = await auth()
    if (!userId) {
      throw new Error('Unauthorized')
    }
    
    const supabase = await createAuthClient()
    
    // Get the user's database ID and realtor profile ID
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select(`
        id,
        realtorProfile:RealtorProfile!inner(id)
      `)
      .eq('userId', userId)
      .single()

    if (userError) {
      console.error('[DEBUG] Error fetching user:', userError)
      throw userError
    }

    console.log('[DEBUG] Found user:', userData)

    const realtorProfileId = userData.realtorProfile[0].id;

    // Prepare coach profile data
    const coachProfileData = {
      userDbId: userData.id,
      coachingSpecialties: formData.specialties || [],
      yearsCoaching: formData.yearsCoaching,
      hourlyRate: formData.hourlyRate,
      calendlyUrl: formData.calendlyUrl,
      eventTypeUrl: formData.eventTypeUrl,
      defaultDuration: formData.defaultDuration,
      minimumDuration: formData.minimumDuration,
      maximumDuration: formData.maximumDuration,
      allowCustomDuration: formData.allowCustomDuration,
      updatedAt: new Date().toISOString(),
    }

    // Prepare realtor profile data
    const realtorProfileData = {
      userDbId: userData.id,
      languages: Array.isArray(formData.languages) ? formData.languages : [],
      bio: formData.marketExpertise || '',
      certifications: Array.isArray(formData.certifications) ? formData.certifications : [],
      propertyTypes: [],
      specializations: [],
      marketingAreas: [],
      testimonials: [],
      geographicFocus: {
        cities: [],
        neighborhoods: [],
        counties: []
      },
      updatedAt: new Date().toISOString(),
    }

    // Update CoachProfile
    const { error: coachError } = await supabase
      .from('CoachProfile')
      .upsert(coachProfileData, {
        onConflict: 'userDbId'
      })
      .select()

    if (coachError) {
      console.error('[DEBUG] Error updating coach profile:', coachError)
      throw coachError
    }

    // Update RealtorProfile
    const { error: realtorError } = await supabase
      .from('RealtorProfile')
      .upsert(realtorProfileData, {
        onConflict: 'userDbId'
      })
      .select()

    if (realtorError) {
      console.error('[DEBUG] Error updating realtor profile:', realtorError)
      throw realtorError
    }

    // Handle Professional Recognitions
    if (formData.professionalRecognitions && Array.isArray(formData.professionalRecognitions)) {
      // Get existing recognitions
      const { data: existingRecognitions, error: fetchError } = await supabase
        .from('ProfessionalRecognition')
        .select('*')
        .eq('realtorProfileId', realtorProfileId)
        .is('archivedAt', null)

      if (fetchError) {
        console.error('[DEBUG] Error fetching existing recognitions:', fetchError)
        throw fetchError
      }

      // Handle archived recognition if specified
      if (formData.archivedRecognitionId) {
        const { error: archiveError } = await supabase
          .from('ProfessionalRecognition')
          .update({ 
            archivedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
          .eq('id', formData.archivedRecognitionId)
          .eq('realtorProfileId', realtorProfileId)

        if (archiveError) {
          console.error('[DEBUG] Error archiving recognition:', archiveError)
          throw archiveError
        }
        
        // Return early as we're just archiving
        return { success: true }
      }

      // Separate recognitions into existing and new
      const existingIds = new Set(existingRecognitions?.map(r => r.id) || [])
      const recognitionsToUpdate = []
      const recognitionsToInsert = []

      for (const recognition of formData.professionalRecognitions) {
        const recognitionData = {
          realtorProfileId,
          title: recognition.title,
          type: recognition.type,
          year: recognition.year,
          organization: recognition.organization || null,
          description: recognition.description || null,
          updatedAt: new Date().toISOString()
        }

        if (recognition.id && existingIds.has(recognition.id)) {
          // Update existing recognition
          recognitionsToUpdate.push({
            ...recognitionData,
            id: recognition.id
          })
        } else {
          // Insert new recognition
          recognitionsToInsert.push({
            ...recognitionData,
            createdAt: new Date().toISOString()
          })
        }
      }

      // Update existing recognitions
      if (recognitionsToUpdate.length > 0) {
        const { error: updateError } = await supabase
          .from('ProfessionalRecognition')
          .upsert(recognitionsToUpdate)

        if (updateError) {
          console.error('[DEBUG] Error updating recognitions:', updateError)
          throw updateError
        }
      }

      // Insert new recognitions
      if (recognitionsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('ProfessionalRecognition')
          .insert(recognitionsToInsert)

        if (insertError) {
          console.error('[DEBUG] Error inserting new recognitions:', insertError)
          throw insertError
        }
      }
    }

    // Revalidate the profile page
    revalidatePath('/dashboard/coach/profile')
    return { success: true }
  } catch (error) {
    console.error('[COACH_PROFILE_UPDATE_ERROR]', error)
    throw error
  }
}

// Function to fetch coach profile data
export async function fetchCoachProfile() {
  try {
    console.log('[DEBUG] Starting fetchCoachProfile...');
    const { userId } = await auth()
    if (!userId) {
      console.error('[DEBUG] No userId found in auth');
      throw new Error('Unauthorized')
    }

    console.log('[DEBUG] Fetching profiles for userId:', userId);
    const supabase = await createAuthClient()

    // Fetch user with both coach and realtor profiles
    const { data, error } = await supabase
      .from('User')
      .select(`
        *,
        coachProfile:CoachProfile (*),
        realtorProfile:RealtorProfile (
          *,
          professionalRecognitions:ProfessionalRecognition (
            id,
            title,
            type,
            year,
            organization,
            description,
            createdAt,
            updatedAt,
            archivedAt
          )
        )
      `)
      .eq('userId', userId)
      .single()

    if (error) {
      console.error('[DEBUG] Error fetching profiles:', error);
      throw error;
    }

    console.log('[DEBUG] Raw profile data:', data);
    
    // Handle array responses
    const coachProfile = Array.isArray(data.coachProfile) ? data.coachProfile[0] : data.coachProfile;
    const realtorProfile = Array.isArray(data.realtorProfile) ? data.realtorProfile[0] : data.realtorProfile;

    // Filter out archived recognitions in JavaScript
    const activeRecognitions = realtorProfile?.professionalRecognitions?.filter(
      (recognition: any) => !recognition.archivedAt
    ) || [];

    console.log('[DEBUG] Active recognitions:', activeRecognitions);

    // Combine both profiles into a single response
    const responseData = {
      // Coach profile fields
      specialties: coachProfile?.coachingSpecialties || [],
      yearsCoaching: coachProfile?.yearsCoaching || 0,
      hourlyRate: Number(coachProfile?.hourlyRate) || 0,
      defaultDuration: coachProfile?.defaultDuration || 60,
      minimumDuration: coachProfile?.minimumDuration || 30,
      maximumDuration: coachProfile?.maximumDuration || 120,
      allowCustomDuration: coachProfile?.allowCustomDuration || false,
      calendlyUrl: coachProfile?.calendlyUrl || "",
      eventTypeUrl: coachProfile?.eventTypeUrl || "",
      
      // Realtor profile fields
      languages: Array.isArray(realtorProfile?.languages) ? realtorProfile.languages : [],
      certifications: Array.isArray(realtorProfile?.certifications) ? realtorProfile.certifications : [],
      marketExpertise: realtorProfile?.bio || "",
      professionalRecognitions: activeRecognitions.map((recognition: any) => ({
        id: recognition.id,
        title: recognition.title,
        type: recognition.type,
        year: recognition.year,
        organization: recognition.organization || null,
        description: recognition.description || null,
        createdAt: recognition.createdAt,
        updatedAt: recognition.updatedAt,
        archivedAt: recognition.archivedAt
      })),

      // Include raw profiles for debugging
      _rawCoachProfile: coachProfile,
      _rawRealtorProfile: realtorProfile
    };

    console.log('[DEBUG] Formatted response data:', responseData);

    return {
      success: true,
      data: responseData
    }
  } catch (error) {
    console.error('[FETCH_COACH_PROFILE_ERROR]', error)
    return { success: false, error }
  }
} 