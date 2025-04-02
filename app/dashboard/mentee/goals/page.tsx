"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import GoalsForm from "@/components/goals/GoalsForm"
import { createGoal } from "@/utils/actions/goals"
import type { GoalFormValues } from "@/utils/types/goals"
import { getCoachApplication } from "@/utils/actions/coach-application"
import type { ApplicationResponse } from "@/utils/types/coach-application"
import { COACH_APPLICATION_STATUS, type CoachApplicationStatus } from "@/utils/types/coach-application"
import { toast } from "sonner"

export default function GoalsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [application, setApplication] = useState<ApplicationResponse | null>(null)

  useEffect(() => {
    const fetchApplicationData = async () => {
      try {
        const applicationResponse = await getCoachApplication({})
        
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

    fetchApplicationData()
  }, [])

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

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Your Goals</h1>
      
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
    </div>
  )
} 