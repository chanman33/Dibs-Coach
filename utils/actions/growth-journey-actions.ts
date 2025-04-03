"use server";

import { createAuthClient } from "@/utils/auth";
import { withServerAction } from "@/utils/middleware/withServerAction";
import { ApiResponse } from "@/utils/types/api";
import { GOAL_STATUS } from "@/utils/types/goal";

interface GoalProgress {
  value: number;
  lastUpdated: string;
}

interface GoalTarget {
  value: number;
}

interface GoalWithProgress {
  ulid: string;
  title: string;
  status: string;
  progress: GoalProgress | null;
  target: GoalTarget | null;
}

export interface GrowthJourneyStats {
  currentGoals: {
    id: string;
    status: string;
    deadline: string;
    title: string;
    milestones?: { title: string; completed: boolean }[];
    growthPlan?: string;
    target?: number;
    current?: number;
  }[];
  completedGoals: {
    id: string;
    title: string;
    completedAt: string | null;
  }[];
}

/**
 * Fetch growth journey stats including current goals and completed goals
 * Progress is calculated as an average of each goal's individual progress towards its target
 */
export const fetchGrowthJourneyStats = withServerAction<GrowthJourneyStats>(
  async (_, context): Promise<ApiResponse<GrowthJourneyStats>> => {
    try {
      console.log("[GROWTH_JOURNEY_FETCH_START]", {
        userUlid: context.userUlid,
        timestamp: new Date().toISOString()
      });

      const supabase = await createAuthClient();

      // Fetch all active goals with their progress and target values
      const { data: allGoals, error: allGoalsError } = await supabase
        .from("Goal")
        .select(`
          ulid,
          title,
          status,
          progress,
          target
        `)
        .eq("userUlid", context.userUlid)
        .in("status", [GOAL_STATUS.IN_PROGRESS, GOAL_STATUS.OVERDUE]);

      if (allGoalsError) {
        console.error("[FETCH_ALL_GOALS_ERROR]", {
          error: allGoalsError,
          message: allGoalsError.message,
          userUlid: context.userUlid,
          timestamp: new Date().toISOString(),
        });
        throw allGoalsError;
      }

      // Log raw goals data
      console.log("[RAW_GOALS_DATA]", {
        totalGoals: allGoals?.length || 0,
        goals: allGoals?.map(goal => ({
          ulid: goal.ulid,
          status: goal.status,
          target: goal.target,
          progress: goal.progress,
        })),
        timestamp: new Date().toISOString()
      });

      // Calculate overall progress
      let overallProgress = 0;
      const goalsWithProgress = (allGoals as GoalWithProgress[] || []).filter(goal => {
        const targetValue = goal.target?.value;
        const progressValue = goal.progress?.value;
        const isValid = typeof targetValue === 'number' && typeof progressValue === 'number' && targetValue > 0;

        // Log validation of each goal's data
        console.log("[GOAL_DATA_VALIDATION]", {
          goalId: goal.ulid,
          hasTarget: goal.target !== null,
          hasProgress: goal.progress !== null,
          targetValue,
          progressValue,
          targetType: typeof targetValue,
          progressType: typeof progressValue,
          isValidForCalculation: isValid,
          timestamp: new Date().toISOString()
        });

        return isValid;
      });

      console.log("[FILTERED_GOALS]", {
        totalGoals: allGoals?.length || 0,
        validGoals: goalsWithProgress.length,
        invalidGoals: (allGoals?.length || 0) - goalsWithProgress.length,
        timestamp: new Date().toISOString()
      });

      if (goalsWithProgress.length > 0) {
        const progressPercentages = goalsWithProgress.map(goal => {
          // We can safely access these now because we filtered for valid values above
          const targetValue = goal.target!.value;
          const progressValue = goal.progress!.value;
          const percentage = Math.min((progressValue / targetValue) * 100, 100);
          
          // Log individual goal progress calculation
          console.log("[GOAL_PROGRESS_CALCULATION]", {
            goalId: goal.ulid,
            targetValue,
            progressValue,
            rawPercentage: (progressValue / targetValue) * 100,
            cappedPercentage: percentage,
            lastUpdated: goal.progress!.lastUpdated,
            timestamp: new Date().toISOString()
          });

          return percentage;
        });

        // Log all percentages before averaging
        console.log("[PROGRESS_PERCENTAGES]", {
          allPercentages: progressPercentages,
          count: progressPercentages.length,
          sum: progressPercentages.reduce((sum, p) => sum + p, 0),
          timestamp: new Date().toISOString()
        });

        overallProgress = Math.round(
          progressPercentages.reduce((sum, percentage) => sum + percentage, 0) / 
          progressPercentages.length
        );

        console.log("[OVERALL_PROGRESS_CALCULATION]", {
          sum: progressPercentages.reduce((sum, p) => sum + p, 0),
          count: progressPercentages.length,
          overallProgress,
          timestamp: new Date().toISOString()
        });
      }

      // Fetch current goals with full details
      const { data: activeGoals, error: goalsError } = await supabase
        .from("Goal")
        .select(`
          ulid,
          status,
          dueDate,
          milestones,
          growthPlan,
          title,
          target,
          progress
        `)
        .eq("userUlid", context.userUlid)
        .in("status", [GOAL_STATUS.IN_PROGRESS, GOAL_STATUS.OVERDUE])
        .order("dueDate", { ascending: true });

      if (goalsError) {
        console.error("[FETCH_GROWTH_JOURNEY_GOALS_ERROR]", {
          error: goalsError,
          message: goalsError.message,
          userUlid: context.userUlid,
          timestamp: new Date().toISOString(),
        });
        throw goalsError;
      }

      // Fetch completed goals
      const { data: completedGoals, error: completedGoalsError } = await supabase
        .from("Goal")
        .select(`
          ulid,
          title,
          completedAt
        `)
        .eq("userUlid", context.userUlid)
        .eq("status", GOAL_STATUS.COMPLETED)
        .order("completedAt", { ascending: false });

      if (completedGoalsError) {
        console.error("[FETCH_COMPLETED_GOALS_ERROR]", {
          error: completedGoalsError,
          message: completedGoalsError.message,
          userUlid: context.userUlid,
          timestamp: new Date().toISOString(),
        });
        throw completedGoalsError;
      }

      // Transform data to match component interface
      const formattedGoals = (activeGoals || []).map((goal) => {
        const targetObj = goal.target as GoalTarget | null;
        const progressObj = goal.progress as GoalProgress | null;
        
        const formatted = {
          id: goal.ulid,
          status: goal.status,
          deadline: goal.dueDate,
          title: goal.title,
          milestones: goal.milestones as { title: string; completed: boolean }[] || [],
          growthPlan: goal.growthPlan || undefined,
          target: targetObj?.value,
          current: progressObj?.value
        };

        // Log each goal's transformation
        console.log("[GOAL_DATA_TRANSFORM]", {
          original: goal,
          transformed: formatted,
          timestamp: new Date().toISOString()
        });

        return formatted;
      });

      const formattedCompletedGoals = (completedGoals || []).map((goal) => ({
        id: goal.ulid,
        title: goal.title,
        completedAt: goal.completedAt,
      }));

      // Log final data structure being sent to client
      console.log("[FINAL_CLIENT_DATA]", {
        totalActiveGoals: allGoals?.length || 0,
        goalsWithProgress: goalsWithProgress.length,
        overallProgress,
        formattedGoalsCount: formattedGoals.length,
        completedGoalsCount: formattedCompletedGoals.length,
        firstGoalSample: formattedGoals[0],
        firstCompletedGoalSample: formattedCompletedGoals[0],
        userUlid: context.userUlid,
        timestamp: new Date().toISOString(),
      });

      return {
        data: {
          currentGoals: formattedGoals,
          completedGoals: formattedCompletedGoals,
        },
        error: null,
      };
    } catch (error) {
      console.error("[FETCH_GROWTH_JOURNEY_STATS_ERROR]", {
        error,
        message: error instanceof Error ? error.message : "Unknown error",
        userUlid: context.userUlid,
        timestamp: new Date().toISOString(),
      });

      return {
        data: null,
        error: {
          code: "FETCH_ERROR",
          message: error instanceof Error ? error.message : "Failed to fetch growth journey stats",
        },
      };
    }
  }
); 