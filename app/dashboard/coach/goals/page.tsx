"use client";

import { useState, useEffect, useCallback } from "react";
import { GoalFormValues } from "@/utils/types/goals";
import GoalsForm from "@/components/profile/common/GoalsForm";
import { fetchGoals, createGoal } from "@/utils/actions/goals";
import { toast } from "sonner";
import { useProfileContext, ProfileProvider } from "@/components/profile/context/ProfileContext";

function GoalsPageContent() {
  const [initialGoals, setInitialGoals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { updateGoalsData } = useProfileContext();

  useEffect(() => {
    const loadGoals = async () => {
      try {
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
          setInitialGoals(data);
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
    };

    loadGoals();
  }, []);

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

      toast.success('Goal created successfully!');
    } catch (error) {
      console.error('[CREATE_GOAL_ERROR]', {
        error,
        timestamp: new Date().toISOString()
      });
      toast.error('Failed to create goal');
    }
  }, [updateGoalsData]);

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Your Goals</h1>
      
      <div className="space-y-6">
        <GoalsForm 
          open={true} 
          onClose={() => {}} 
          onSubmit={handleGoalsSubmit}
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