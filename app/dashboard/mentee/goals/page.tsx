"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import GoalsForm from "@/components/goals/GoalsForm"
import { fetchGoals, createGoal } from "@/utils/actions/goals"
import type { GoalFormValues } from "@/utils/types/goals"
import { getCoachApplication } from "@/utils/actions/coach-application"
import type { ApplicationResponse } from "@/utils/types/coach-application"
import { COACH_APPLICATION_STATUS, type CoachApplicationStatus } from "@/utils/types/coach-application"
import { toast } from "sonner"
import { GrowthJourneyStats } from "@/components/goals/GrowthJourneyStats"

function GoalsPageContent() {
  const router = useRouter()
  const [initialGoals, setInitialGoals] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [application, setApplication] = useState<ApplicationResponse | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const refreshGoals = useCallback(() => {
    setRefreshKey(prev => prev + 1)
  }, [])

  const processGoalData = useCallback((goal: any) => {
    let milestones = []
    if (goal.milestones) {
      try {
        if (typeof goal.milestones === 'string') {
          milestones = JSON.parse(goal.milestones)
        } else if (Array.isArray(goal.milestones)) {
          milestones = goal.milestones
        } else if (typeof goal.milestones === 'object') {
          milestones = [goal.milestones]
        }
      } catch (e) {
        console.error('[MILESTONE_PARSE_ERROR]', {
          error: e,
          milestones: goal.milestones,
          goalId: goal.ulid,
          timestamp: new Date().toISOString()
        })
      }
    }

    let growthPlan = ''
    if (goal.growthPlan) {
      if (typeof goal.growthPlan === 'string') {
        growthPlan = goal.growthPlan
      } else if (typeof goal.growthPlan === 'object') {
        try {
          growthPlan = JSON.stringify(goal.growthPlan)
        } catch (e) {
          console.error('[GROWTH_PLAN_PARSE_ERROR]', {
            error: e,
            growthPlan: goal.growthPlan,
            goalId: goal.ulid,
            timestamp: new Date().toISOString()
          })
        }
      }
    }
    
    let target = 0
    let current = 0
    
    if (goal.target) {
      if (typeof goal.target === 'string') {
        try { target = JSON.parse(goal.target).value || 0 } catch (e) {}
      } else if (typeof goal.target === 'object') {
        target = goal.target.value || 0
      }
    }
    
    if (goal.progress) {
      if (typeof goal.progress === 'string') {
        try { current = JSON.parse(goal.progress).value || 0 } catch (e) {}
      } else if (typeof goal.progress === 'object') {
        current = goal.progress.value || 0
      }
    }

    return {
      ...goal,
      target,
      current,
      milestones,
      growthPlan,
      deadline: goal.dueDate || new Date().toISOString()
    }
  }, [])

  const loadGoals = useCallback(async () => {
    setIsLoading(true)
    try {
      console.log("[LOADING_GOALS]", {
        timestamp: new Date().toISOString(),
        refreshKey
      })
      
      const { data, error } = await fetchGoals({})
      if (error) {
        console.error("[FETCH_GOALS_ERROR]", {
          error,
          timestamp: new Date().toISOString(),
        })
        toast.error("Failed to load goals")
        return
      }

      if (data) {
        const processedGoals = data.map(processGoalData)

        console.log("[GOALS_LOADED]", {
          count: processedGoals.length,
          hasGoalsMilestones: processedGoals.some(g => g.milestones && g.milestones.length > 0),
          hasGrowthPlans: processedGoals.some(g => g.growthPlan && g.growthPlan.length > 0),
          milestonesCount: processedGoals.reduce((total, g) => total + (g.milestones?.length || 0), 0),
          timestamp: new Date().toISOString(),
          firstGoalMilestones: processedGoals.length > 0 && processedGoals[0].milestones ? processedGoals[0].milestones : null,
          firstGoalGrowthPlan: processedGoals.length > 0 ? processedGoals[0].growthPlan : null
        })
        
        setInitialGoals(processedGoals)
      }
    } catch (error) {
      console.error("[FETCH_GOALS_ERROR]", {
        error,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      })
      toast.error("Failed to load goals")
    } finally {
      setIsLoading(false)
    }
  }, [refreshKey, processGoalData])

  useEffect(() => {
    const fetchApplicationData = async () => {
      try {
        const applicationResponse = await getCoachApplication({})
        
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
          })
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
      }
    }

    fetchApplicationData()
    loadGoals()
  }, [loadGoals])

  const handleGoalsSubmit = useCallback(async (formData: GoalFormValues) => {
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
      
      // Force immediate reload of goals after creation
      console.log('[GOAL_CREATED_SUCCESSFULLY]', {
        goalData: data,
        timestamp: new Date().toISOString()
      })
      
      toast.success('Goal created successfully!')
      
      // Reset refreshKey to trigger a full reload
      refreshGoals()
      
      // Small delay to ensure server has time to process before we fetch
      setTimeout(() => {
        loadGoals()
      }, 100)
    } catch (error) {
      console.error('[CREATE_GOAL_ERROR]', {
        error,
        timestamp: new Date().toISOString()
      })
      toast.error('Failed to create goal')
    }
  }, [refreshGoals, loadGoals])

  const handleGoalUpdated = useCallback(() => {
    console.log('[GOAL_UPDATED]', {
      timestamp: new Date().toISOString()
    })
    refreshGoals()
  }, [refreshGoals])

  const formattedGoals = initialGoals.map(goal => ({
    id: goal.id || goal.ulid,
    status: goal.status || "IN_PROGRESS",
    deadline: goal.dueDate || goal.deadline || new Date().toISOString(),
    title: goal.title || "Untitled Goal",
    milestones: goal.milestones || [],
    growthPlan: goal.growthPlan || '',
    target: goal.target || 0,
    current: goal.current || 0
  }))

  // Get completed goals
  const completedGoals = initialGoals
    .filter(goal => 
      goal.status === "COMPLETED" || 
      goal.status === "completed" ||
      goal.status?.toLowerCase() === "completed"
    )
    .map(goal => ({
      id: goal.id || goal.ulid,
      title: goal.title || "Completed Goal",
      completedAt: goal.completedAt || new Date().toISOString()
    }))

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
      <h1 className="text-3xl font-bold mb-6">Your Growth Journey</h1>
      <p className="text-muted-foreground mt-2">
        Track your progress, celebrate achievements, and continue growing in your real estate career
      </p>
      <p className="text-sm text-muted-foreground mt-1 mb-6">
        Goals are visible to coaches you have booked sessions with
      </p>

      {!isLoading && initialGoals.length > 0 && (
        <div className="mb-8">
          <GrowthJourneyStats
            currentGoals={formattedGoals}
            completedGoals={completedGoals}
            key={`growth-stats-${refreshKey}`}
          />
        </div>
      )}

      <div className="space-y-6">
        <GoalsForm 
          open={true} 
          onClose={() => {}} 
          onSubmit={handleGoalsSubmit}
          onGoalUpdated={handleGoalUpdated}
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

export default function MenteeGoalsPage() {
  return <GoalsPageContent />
}
