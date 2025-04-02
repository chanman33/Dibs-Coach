"use client";

import { useState, useEffect, useCallback } from "react";
import { GoalFormValues } from "@/utils/types/goals";
import GoalsForm from "@/components/goals/GoalsForm";
import { fetchGoals, createGoal } from "@/utils/actions/goals";
import { toast } from "sonner";
import { useProfileContext, ProfileProvider } from "@/components/profile/context/ProfileContext";
import { GrowthJourneyStats } from "@/components/goals/GrowthJourneyStats";

function GoalsPageContent() {
  const [initialGoals, setInitialGoals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { updateGoalsData } = useProfileContext();

  const refreshGoals = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const loadGoals = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log("[LOADING_GOALS]", {
        timestamp: new Date().toISOString(),
        refreshCount: refreshTrigger
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
        const processedGoals = data.map(goal => {
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

          let growthPlan = goal.growthPlan || '';
          
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
        });

        console.log("[GOALS_LOADED]", {
          count: processedGoals.length,
          hasGoalsMilestones: processedGoals.some(g => g.milestones && g.milestones.length > 0),
          hasGrowthPlans: processedGoals.some(g => g.growthPlan && g.growthPlan.length > 0),
          timestamp: new Date().toISOString()
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
  }, [refreshTrigger]);

  useEffect(() => {
    loadGoals();
  }, [loadGoals, refreshTrigger]);

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

      if (updateGoalsData) {
        await updateGoalsData([]);
      }
      
      refreshGoals();
      toast.success('Goal created successfully!');
    } catch (error) {
      console.error('[CREATE_GOAL_ERROR]', {
        error,
        timestamp: new Date().toISOString()
      });
      toast.error('Failed to create goal');
    }
  }, [updateGoalsData, refreshGoals]);

  const formattedGoals = initialGoals.map(goal => ({
    id: goal.id || goal.ulid,
    status: goal.status || "in_progress",
    deadline: goal.dueDate || goal.deadline || new Date().toISOString()
  }));

  const recentAchievements = [
    { date: new Date().toISOString() }
  ];

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
            recentAchievements={recentAchievements}
          />
        </div>
      )}

      <div className="space-y-6">
        <GoalsForm
          open={true}
          onClose={() => { }}
          onSubmit={handleGoalsSubmit}
          onGoalUpdated={refreshGoals}
        />
      </div>
    </div>
  );
}

export default function CoachGoalsPage() {
  return (
    <ProfileProvider>
      <GoalsPageContent />
    </ProfileProvider>
  );
} 