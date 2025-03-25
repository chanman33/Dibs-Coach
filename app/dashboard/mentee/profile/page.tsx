"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import GeneralForm from "../../../../components/profile/common/GeneralForm"
import { Button } from "@/components/ui/button"
import { useRouter, useSearchParams } from "next/navigation"
import { getCoachApplication } from "@/utils/actions/coach-application"
import { fetchRealtorProfile, updateRealtorProfile } from "@/utils/actions/realtor-profile"
import { Loader2 } from "lucide-react"
import type { ApplicationResponse } from "@/utils/types/coach-application"
import { updateUserProfile } from "@/utils/actions/user-profile-actions"
import type { GeneralFormData } from "@/utils/actions/user-profile-actions"
import type { ApiResponse, ApiError } from "@/utils/types/api"
import { toast } from "sonner"
import { fetchUserProfile } from "@/utils/actions/user-profile-actions"

interface ProfileData {
  user: {
    firstName: string | null
    lastName: string | null
    displayName: string | null
    bio: string | null
    realEstateDomains: string[]
    primaryDomain: string | null
    languages: string[]
  }
  realtorProfile: {
    yearsExperience: number | null
    primaryMarket: string | null
  }
}

export default function AgentProfilePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [profileData, setProfileData] = useState<ProfileData | null>(null)

  // Fetch profile data
  useEffect(() => {
    const fetchData = async () => {
      console.log('[PROFILE_PAGE_FETCH_START]', {
        timestamp: new Date().toISOString()
      });

      try {
        const [profileResponse, userProfileResponse] = await Promise.all([
          fetchRealtorProfile(),
          fetchUserProfile()
        ])

        console.log('[PROFILE_PAGE_FETCH_COMPLETE]', {
          hasProfileData: !!profileResponse.data,
          hasUserProfileData: !!userProfileResponse.data,
          timestamp: new Date().toISOString()
        });

        // Handle profile data
        if (profileResponse.error) {
          console.error('[FETCH_PROFILE_ERROR]', {
            error: profileResponse.error,
            timestamp: new Date().toISOString()
          })
          toast.error('Failed to load profile data')
        } else if (profileResponse.data) {
          console.log('[PROFILE_DATA_UPDATE]', {
            firstName: profileResponse.data.user.firstName,
            lastName: profileResponse.data.user.lastName,
            timestamp: new Date().toISOString()
          });
          
          // Get user profile data for domains and languages
          const userDomains = userProfileResponse.data?.realEstateDomains || [];
          const userPrimaryDomain = userProfileResponse.data?.primaryDomain || null;
          const userLanguages = userProfileResponse.data?.languages || [];
          
          setProfileData({
            user: {
              firstName: profileResponse.data.user.firstName ?? null,
              lastName: profileResponse.data.user.lastName ?? null,
              displayName: profileResponse.data.user.displayName ?? null,
              bio: profileResponse.data.user.bio ?? null,
              // Use the data from the user profile response
              realEstateDomains: userDomains,
              primaryDomain: userPrimaryDomain,
              languages: userLanguages
            },
            realtorProfile: {
              yearsExperience: profileResponse.data.realtorProfile.yearsExperience ?? null,
              primaryMarket: profileResponse.data.realtorProfile.primaryMarket ?? null
            }
          })
        }
      } catch (error) {
        console.error('[FETCH_DATA_ERROR]', {
          error,
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString()
        })
        toast.error('Failed to load some data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleGeneralSubmit = async (formData: GeneralFormData): Promise<ApiResponse<GeneralFormData>> => {
    setIsSubmitting(true)
    try {
      // First update the user profile with domains
      const userProfileResponse = await updateUserProfile({
        displayName: formData.displayName,
        bio: formData.bio,
        totalYearsRE: formData.totalYearsRE,
        primaryMarket: formData.primaryMarket,
        languages: formData.languages,
        realEstateDomains: formData.realEstateDomains,
        primaryDomain: formData.primaryDomain
      });
      
      if (userProfileResponse.error) {
        console.error('[UPDATE_USER_PROFILE_ERROR]', {
          error: userProfileResponse.error,
          timestamp: new Date().toISOString()
        });
        toast.error(userProfileResponse.error.message || 'Failed to update user profile');
        return { data: null, error: userProfileResponse.error };
      }
      
      // Then update the realtor profile
      const response = await updateRealtorProfile({
        user: {
          displayName: formData.displayName,
          bio: formData.bio
        },
        realtorProfile: {
          yearsExperience: formData.totalYearsRE,
          primaryMarket: formData.primaryMarket
        }
      })
      
      if (response.error) {
        console.error('[SUBMIT_PROFILE_ERROR]', {
          error: response.error,
          timestamp: new Date().toISOString()
        })
        toast.error(response.error.message || 'Failed to update profile')
        return { data: null, error: response.error }
      }

      // Update local state to avoid refetch
      setProfileData(prev => prev ? {
        ...prev,
        user: {
          ...prev.user,
          displayName: formData.displayName,
          bio: formData.bio,
          realEstateDomains: formData.realEstateDomains,
          primaryDomain: formData.primaryDomain,
          languages: formData.languages || []
        },
        realtorProfile: {
          ...prev.realtorProfile,
          yearsExperience: formData.totalYearsRE,
          primaryMarket: formData.primaryMarket
        }
      } : null)

      toast.success('Profile updated successfully')
      return { data: formData, error: null }
    } catch (error) {
      console.error('[SUBMIT_PROFILE_ERROR]', {
        error,
        timestamp: new Date().toISOString()
      })
      const apiError: ApiError = {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update profile'
      }
      toast.error(apiError.message)
      return { data: null, error: apiError }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Add logging before the return statement
  console.log('[PROFILE_PAGE_RENDER]', {
    isLoading,
    timestamp: new Date().toISOString()
  });

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Your Profile</h1>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <GeneralForm 
          onSubmit={handleGeneralSubmit} 
          isSubmitting={isSubmitting}
          initialData={{
            displayName: profileData?.user.displayName || "",
            bio: profileData?.user.bio || "",
            totalYearsRE: profileData?.realtorProfile.yearsExperience || 0,
            primaryMarket: profileData?.realtorProfile.primaryMarket || "",
            languages: profileData?.user.languages || [],
            realEstateDomains: profileData?.user.realEstateDomains || [],
            primaryDomain: profileData?.user.primaryDomain || null
          }}
        />
      )}
    </div>
  )
}

