import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Target } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { ClientGoal, GoalType, Milestone } from "@/utils/types/goals"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { updateGoalMilestone } from "@/utils/actions/goals"
import React, { useState, useEffect } from "react"

interface GoalCardProps {
  goal: ClientGoal;
  formatValue: (value: number, format: string) => string;
  getFormatForGoalType: (type: string) => "number" | "currency" | "percentage" | "time";
  getProgressPercentage: (current: number, target: number) => number;
  onEditGoal?: (goal: ClientGoal) => void;
  onUpdateProgress?: () => void;
  getStatusColor?: (status: string) => string;
  getGoalTypeIcon?: (type: string) => React.ReactNode;
}

// Add this helper function before the GoalCard component
// Safely parse the milestone data from various formats
const parseMilestones = (milestonesData: any): Milestone[] => {
  if (!milestonesData) return [];
  
  try {
    // If it's already an array, return it
    if (Array.isArray(milestonesData)) {
      return milestonesData;
    }
    
    // If it's a string, try to parse it as JSON
    if (typeof milestonesData === 'string') {
      const parsed = JSON.parse(milestonesData);
      return Array.isArray(parsed) ? parsed : [];
    }
    
    // If it's an object but not an array, wrap it in an array
    if (typeof milestonesData === 'object') {
      return [milestonesData];
    }
  } catch (e) {
    console.error('[MILESTONE_PARSE_ERROR]', {
      error: e,
      milestonesData,
      timestamp: new Date().toISOString()
    });
  }
  
  return [];
};

export function GoalCard({ 
  goal, 
  formatValue, 
  getFormatForGoalType, 
  getProgressPercentage,
  onEditGoal,
  onUpdateProgress,
  getStatusColor = (status) => status === "completed" 
    ? "bg-green-500" 
    : status === "in_progress" 
      ? "bg-blue-500" 
      : "bg-yellow-500",
  getGoalTypeIcon
}: GoalCardProps) {
  const [updatingMilestone, setUpdatingMilestone] = useState<number | null>(null);
  // Parse milestones safely
  const [milestones, setMilestones] = useState<Milestone[]>(() => 
    parseMilestones(goal.milestones)
  );
  
  // Update milestones when goal changes
  useEffect(() => {
    setMilestones(parseMilestones(goal.milestones));
  }, [goal.milestones]);

  // Handler for milestone checkbox changes
  const handleMilestoneChange = async (index: number, checked: boolean) => {
    if (!goal.ulid) return;
    
    setUpdatingMilestone(index);
    
    try {
      // Create a copy of milestones and update the one at the current index
      const updatedMilestones = [...milestones];
      if (updatedMilestones[index]) {
        updatedMilestones[index].completed = checked;
      }
      
      // Update UI immediately
      setMilestones(updatedMilestones);
      
      const { data, error } = await updateGoalMilestone({
        goalUlid: goal.ulid,
        milestoneIndex: index,
        completed: checked
      });
      
      if (error) {
        console.error('[UPDATE_MILESTONE_ERROR]', {
          error,
          goalId: goal.ulid,
          milestoneIndex: index,
          timestamp: new Date().toISOString()
        });
        
        // Revert the UI update on error
        const revertedMilestones = [...milestones];
        if (revertedMilestones[index]) {
          revertedMilestones[index].completed = !checked;
        }
        setMilestones(revertedMilestones);
        
        toast.error("Failed to update milestone");
        return;
      }
      
      toast.success(`Milestone ${checked ? 'completed' : 'reopened'}`);
    } catch (error) {
      console.error('[MILESTONE_UPDATE_ERROR]', {
        error,
        goalId: goal.ulid,
        milestoneIndex: index,
        timestamp: new Date().toISOString()
      });
      toast.error("Failed to update milestone");
    } finally {
      setUpdatingMilestone(null);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start mb-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              {getGoalTypeIcon ? getGoalTypeIcon(goal.type) : <Target className="h-5 w-5 text-primary" />}
              {goal.title}
            </CardTitle>
            <Badge variant="secondary" className="mt-1 flex items-center gap-1.5">
              {goal.type.split('_').map(word =>
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ')}
            </Badge>
          </div>
          <Badge className={getStatusColor(goal.status)}>
            {goal.status.replace(/_/g, " ").toUpperCase()}
          </Badge>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          {goal.description || 'No description provided.'}
        </p>
        {goal.growthPlan && goal.growthPlan.trim() !== '' && (
          <div className="mt-3">
            <h4 className="text-sm font-medium text-gray-700 mb-1">Growth Plan:</h4>
            <p className="text-sm text-gray-600">{goal.growthPlan}</p>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-sm font-medium text-gray-700">Progress:</span>
              <span className="text-sm text-gray-600">
                {formatValue(goal.current, getFormatForGoalType(goal.type))} / {formatValue(goal.target, getFormatForGoalType(goal.type))}
              </span>
            </div>
            <div className="flex-1 h-2 bg-gray-200 rounded-full">
              <div
                className="h-2 bg-blue-500 rounded-full"
                style={{ width: `${getProgressPercentage(goal.current, goal.target)}%` }}
              />
            </div>
          </div>

          {milestones.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Milestones:</h4>
              <div className="space-y-2">
                {milestones.map((milestone, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id={`milestone-${goal.ulid}-${idx}`}
                        checked={milestone.completed}
                        disabled={updatingMilestone === idx}
                        onCheckedChange={(checked) => handleMilestoneChange(idx, checked === true)}
                        className={cn(
                          milestone.completed ? "data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500" : "",
                          updatingMilestone === idx ? "opacity-50" : ""
                        )}
                      />
                      <label
                        htmlFor={`milestone-${goal.ulid}-${idx}`}
                        className={cn(
                          "text-sm cursor-pointer select-none",
                          milestone.completed && "text-muted-foreground line-through"
                        )}
                      >
                        {milestone.title}
                        {updatingMilestone === idx && (
                          <span className="ml-2 animate-pulse">Updating...</span>
                        )}
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-sm">
            <span className="text-sm text-gray-600">
              Due: {new Date(goal.deadline).toLocaleDateString()}
            </span>
            {onUpdateProgress && (
              <Button variant="ghost" size="sm" onClick={onUpdateProgress}>
                Update Progress
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 