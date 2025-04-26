"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import GeneralForm from "../../../../components/profile/common/GeneralForm"
import { Button } from "@/components/ui/button"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { updateUserProfile } from "@/utils/actions/user-profile-actions"
import type { GeneralFormData, UserProfileResponse } from "@/utils/actions/user-profile-actions"
import type { ApiResponse, ApiError } from "@/utils/types/api"
import { toast } from "sonner"
import { fetchUserProfile } from "@/utils/actions/user-profile-actions"

interface ProfileData {
  displayName: string | null
  bio: string | null
  realEstateDomains: string[]
  primaryDomain: string | null
  languages: string[]
  totalYearsRE: number
  primaryMarket: string | null
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
        const userProfileResponse = await fetchUserProfile();

        console.log('[PROFILE_PAGE_FETCH_COMPLETE]', {
          hasUserProfileData: !!userProfileResponse.data,
          timestamp: new Date().toISOString()
        });

        // Handle profile data
        if (userProfileResponse.error) {
          console.error('[FETCH_PROFILE_ERROR]', {
            error: userProfileResponse.error,
            timestamp: new Date().toISOString()
          })
          toast.error('Failed to load profile data')
        } else if (userProfileResponse.data) {
          console.log('[PROFILE_DATA_UPDATE]', {
            displayName: userProfileResponse.data.displayName,
            timestamp: new Date().toISOString()
          });
          
          setProfileData({
            displayName: userProfileResponse.data.displayName ?? "",
            bio: userProfileResponse.data.bio ?? null,
            realEstateDomains: userProfileResponse.data.realEstateDomains || [],
            primaryDomain: userProfileResponse.data.primaryDomain ?? null,
            languages: userProfileResponse.data.languages || [],
            totalYearsRE: userProfileResponse.data.totalYearsRE || 0,
            primaryMarket: userProfileResponse.data.primaryMarket ?? null
          });
        }
      } catch (error) {
        console.error('[FETCH_DATA_ERROR]', {
          error,
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString()
        })
        toast.error('Failed to load profile data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleGeneralSubmit = async (formData: GeneralFormData): Promise<ApiResponse<GeneralFormData>> => {
    setIsSubmitting(true)
    try {
      // Update the user profile with all data
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

      // Update local state to avoid refetch
      setProfileData(prev => prev ? {
        ...prev,
        displayName: formData.displayName,
        bio: formData.bio,
        realEstateDomains: formData.realEstateDomains,
        primaryDomain: formData.primaryDomain,
        languages: formData.languages || [],
        totalYearsRE: formData.totalYearsRE,
        primaryMarket: formData.primaryMarket
      } : null);

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
            displayName: profileData?.displayName || "",
            bio: profileData?.bio || "",
            totalYearsRE: profileData?.totalYearsRE || 0,
            primaryMarket: profileData?.primaryMarket || "",
            languages: profileData?.languages || [],
            realEstateDomains: profileData?.realEstateDomains || [],
            primaryDomain: profileData?.primaryDomain || null
          }}
        />
      )}
    </div>
  )
}

