"use client";

import { useState, useEffect, useCallback } from "react";
import { GoalFormValues } from "@/utils/types/goals";
import GoalsForm from "@/components/goals/GoalsForm";
import { fetchGoals, createGoal } from "@/utils/actions/goals";
import { toast } from "sonner";
import { GrowthJourneyStats } from "@/components/goals/GrowthJourneyStats";

// Simple goals context to avoid full profile context loading
function GoalsPageContent() {
  const [initialGoals, setInitialGoals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshGoals = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const processGoalData = useCallback((goal: any) => {
    let milestones = [];
    if (goal.milestones) {
      try {
        if (typeof goal.milestones === 'string') {
          milestones = JSON.parse(goal.milestones);
        } else if (Array.isArray(goal.milestones)) {
          milestones = goal.milestones;
        } else if (typeof goal.milestones === 'object') {
          milestones = [goal.milestones];
        }
      } catch (e) {
        console.error('[MILESTONE_PARSE_ERROR]', {
          error: e,
          milestones: goal.milestones,
          goalId: goal.ulid,
          timestamp: new Date().toISOString()
        });
      }
    }

    let growthPlan = '';
    if (goal.growthPlan) {
      if (typeof goal.growthPlan === 'string') {
        growthPlan = goal.growthPlan;
      } else if (typeof goal.growthPlan === 'object') {
        try {
          growthPlan = JSON.stringify(goal.growthPlan);
        } catch (e) {
          console.error('[GROWTH_PLAN_PARSE_ERROR]', {
            error: e,
            growthPlan: goal.growthPlan,
            goalId: goal.ulid,
            timestamp: new Date().toISOString()
          });
        }
      }
    }
    
    let target = 0;
    let current = 0;
    
    if (goal.target) {
      if (typeof goal.target === 'string') {
        try { target = JSON.parse(goal.target).value || 0; } catch (e) {}
      } else if (typeof goal.target === 'object') {
        target = goal.target.value || 0;
      }
    }
    
    if (goal.progress) {
      if (typeof goal.progress === 'string') {
        try { current = JSON.parse(goal.progress).value || 0; } catch (e) {}
      } else if (typeof goal.progress === 'object') {
        current = goal.progress.value || 0;
      }
    }

    return {
      ...goal,
      target,
      current,
      milestones,
      growthPlan,
      deadline: goal.dueDate || new Date().toISOString()
    };
  }, []);

  const loadGoals = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log("[LOADING_GOALS]", {
        timestamp: new Date().toISOString(),
        refreshKey
      });
      
      const { data, error } = await fetchGoals({});
      if (error) {
        console.error("[FETCH_GOALS_ERROR]", {
          error,
          timestamp: new Date().toISOString(),
        });
        toast.error("Failed to load goals");
        return;
      }

      if (data) {
        const processedGoals = data.map(processGoalData);

        console.log("[GOALS_LOADED]", {
          count: processedGoals.length,
          hasGoalsMilestones: processedGoals.some(g => g.milestones && g.milestones.length > 0),
          hasGrowthPlans: processedGoals.some(g => g.growthPlan && g.growthPlan.length > 0),
          milestonesCount: processedGoals.reduce((total, g) => total + (g.milestones?.length || 0), 0),
          timestamp: new Date().toISOString(),
          firstGoalMilestones: processedGoals.length > 0 && processedGoals[0].milestones ? processedGoals[0].milestones : null,
          firstGoalGrowthPlan: processedGoals.length > 0 ? processedGoals[0].growthPlan : null
        });
        
        setInitialGoals(processedGoals);
      }
    } catch (error) {
      console.error("[FETCH_GOALS_ERROR]", {
        error,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      });
      toast.error("Failed to load goals");
    } finally {
      setIsLoading(false);
    }
  }, [refreshKey, processGoalData]);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const handleGoalsSubmit = useCallback(async (formData: GoalFormValues) => {
    try {
      const { data, error } = await createGoal(formData);

      if (error) {
        console.error('[CREATE_GOAL_ERROR]', {
          error,
          timestamp: new Date().toISOString()
        });
        toast.error(error.message || 'Failed to create goal');
        return;
      }
      
      // Force immediate reload of goals after creation
      console.log('[GOAL_CREATED_SUCCESSFULLY]', {
        goalData: data,
        timestamp: new Date().toISOString()
      });
      
      toast.success('Goal created successfully!');
      
      // Reset refreshKey to trigger a full reload
      refreshGoals();
      
      // Small delay to ensure server has time to process before we fetch
      setTimeout(() => {
        loadGoals();
      }, 100);
    } catch (error) {
      console.error('[CREATE_GOAL_ERROR]', {
        error,
        timestamp: new Date().toISOString()
      });
      toast.error('Failed to create goal');
    }
  }, [refreshGoals, loadGoals]);

  const handleGoalUpdated = useCallback(() => {
    console.log('[GOAL_UPDATED]', {
      timestamp: new Date().toISOString()
    });
    refreshGoals();
  }, [refreshGoals]);

  const formattedGoals = initialGoals.map(goal => ({
    id: goal.id || goal.ulid,
    status: goal.status || "IN_PROGRESS",
    deadline: goal.dueDate || goal.deadline || new Date().toISOString(),
    title: goal.title || "Untitled Goal",
    milestones: goal.milestones || [],
    growthPlan: goal.growthPlan || '',
    target: goal.target || 0,
    current: goal.current || 0
  }));

  // Replace recentAchievements with completedGoals
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
    }));

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Your Growth Journey</h1>
      <p className="text-muted-foreground mt-2">
        Track your progress, celebrate achievements, and continue growing in your coaching career
      </p>
      <p className="text-sm text-muted-foreground mt-1 mb-6">
        Goals are visible to coaches you have booked sessions with and to your brokerage if connected
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
          onClose={() => { }}
          onSubmit={handleGoalsSubmit}
          onGoalUpdated={handleGoalUpdated}
        />
      </div>
    </div>
  );
}

export default function CoachGoalsPage() {
  return <GoalsPageContent />;
} 