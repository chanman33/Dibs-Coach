"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import GeneralForm from "../../../../components/profile/common/GeneralForm"
import GoalsForm from "../../../../components/profile/common/GoalsForm"
import { Button } from "@/components/ui/button"
import { useRouter, useSearchParams } from "next/navigation"
import { getCoachApplication } from "@/utils/actions/coach-application"
import { fetchRealtorProfile, updateRealtorProfile } from "@/utils/actions/realtor-profile"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import type { ApplicationResponse } from "@/utils/types/coach-application"
import type { GoalFormValues } from "@/utils/types/goals"
import type { GeneralFormData } from "@/utils/actions/user-profile-actions"
import type { ApiResponse, ApiError } from "@/utils/types/api"
import { toast } from "sonner"
import { COACH_APPLICATION_STATUS, type CoachApplicationStatus } from "@/utils/types/coach-application"
import { createGoal } from "@/utils/actions/goals"

interface ProfileData {
  user: {
    firstName: string | null
    lastName: string | null
    displayName: string | null
    bio: string | null
  }
  realtorProfile: {
    yearsExperience: number | null
    primaryMarket: string | null
  }
}

export default function AgentProfilePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get('tab') || 'general'
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [application, setApplication] = useState<ApplicationResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [profileData, setProfileData] = useState<ProfileData | null>(null)

  // Fetch both profile and application data in parallel
  useEffect(() => {
    const fetchData = async () => {
      console.log('[PROFILE_PAGE_FETCH_START]', {
        timestamp: new Date().toISOString()
      });

      try {
        const [profileResponse, applicationResponse] = await Promise.all([
          fetchRealtorProfile(),
          getCoachApplication({})
        ])

        console.log('[PROFILE_PAGE_FETCH_COMPLETE]', {
          hasProfileData: !!profileResponse.data,
          hasApplicationData: !!applicationResponse.data,
          applicationStatus: applicationResponse.data?.status,
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
          setProfileData({
            user: {
              firstName: profileResponse.data.user.firstName ?? null,
              lastName: profileResponse.data.user.lastName ?? null,
              displayName: profileResponse.data.user.displayName ?? null,
              bio: profileResponse.data.user.bio ?? null
            },
            realtorProfile: {
              yearsExperience: profileResponse.data.realtorProfile.yearsExperience ?? null,
              primaryMarket: profileResponse.data.realtorProfile.primaryMarket ?? null
            }
          })
        }

        // Handle application data
        if (applicationResponse.error) {
          console.error('[FETCH_APPLICATION_ERROR]', {
            error: applicationResponse.error,
            timestamp: new Date().toISOString()
          })
          toast.error('Failed to load coach application data')
        } else {
          console.log('[APPLICATION_DATA_UPDATE]', {
            hasData: !!applicationResponse.data,
            status: applicationResponse.data?.status,
            timestamp: new Date().toISOString()
          });
          // Only set application if we have data (null means no application exists)
          if (applicationResponse.data) {
            setApplication(applicationResponse.data)
          }
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
          bio: formData.bio
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

  const handleGoalsSubmit = async (formData: GoalFormValues) => {
    try {
      const { data, error } = await createGoal(formData)
      
      if (error) {
        console.error('[CREATE_GOAL_ERROR]', {
          error,
          timestamp: new Date().toISOString()
        })
        toast.error(error.message || 'Failed to create goal')
        return
      }

      toast.success('Goal created successfully!')
    } catch (error) {
      console.error('[CREATE_GOAL_ERROR]', {
        error,
        timestamp: new Date().toISOString()
      })
      toast.error('Failed to create goal')
    }
  }

  const getStatusColor = (status: CoachApplicationStatus) => {
    console.log('[GET_STATUS_COLOR]', {
      status,
      timestamp: new Date().toISOString()
    });
    switch (status) {
      case COACH_APPLICATION_STATUS.PENDING:
        return 'bg-yellow-500'
      case COACH_APPLICATION_STATUS.APPROVED:
        return 'bg-green-500'
      case COACH_APPLICATION_STATUS.REJECTED:
        return 'bg-red-500'
      case COACH_APPLICATION_STATUS.DRAFT:
        return 'bg-gray-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusMessage = (status: CoachApplicationStatus) => {
    console.log('[GET_STATUS_MESSAGE]', {
      status,
      timestamp: new Date().toISOString()
    });
    switch (status) {
      case COACH_APPLICATION_STATUS.PENDING:
        return 'Your application is under review. We will notify you once a decision has been made.'
      case COACH_APPLICATION_STATUS.APPROVED:
        return 'Congratulations! Your application has been approved. You can now access the coaching dashboard.'
      case COACH_APPLICATION_STATUS.REJECTED:
        return 'Unfortunately, your application was not approved at this time. You may apply again in the future.'
      case COACH_APPLICATION_STATUS.DRAFT:
        return 'Your application is saved as a draft. Please complete and submit it.'
      default:
        return ''
    }
  }

  // Add logging before the return statement
  console.log('[PROFILE_PAGE_RENDER]', {
    isLoading,
    hasApplication: !!application,
    applicationStatus: application?.status,
    timestamp: new Date().toISOString()
  });

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Real Estate Agent Profile Settings</h1>

      <Tabs defaultValue={defaultTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
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
                languages: []
              }}
            />
          )}
        </TabsContent>

        <TabsContent value="goals">
          <div className="space-y-6">
            <GoalsForm 
              open={true} 
              onClose={() => {}} 
              onSubmit={handleGoalsSubmit}
            />
            <div className="mt-6 p-4 border rounded-lg bg-muted/50">
              <h3 className="text-lg font-semibold mb-2">Interested in Becoming a Coach?</h3>
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : application ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Application Status:</span>
                    <Badge className={getStatusColor(application.status)}>
                      {application.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {getStatusMessage(application.status)}
                  </p>
                  {application.status === COACH_APPLICATION_STATUS.REJECTED && (
                    <Button
                      onClick={() => router.push('/apply-coach')}
                      variant="default"
                      className="w-full sm:w-auto mt-2"
                    >
                      Apply Again
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-4">
                    Share your real estate expertise and help others succeed in their journey. Apply to become a coach today.
                  </p>
                  <Button
                    onClick={() => router.push('/apply-coach')}
                    variant="default"
                    className="w-full sm:w-auto"
                  >
                    Apply to Become a Coach
                  </Button>
                </>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

