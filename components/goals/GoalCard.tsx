import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Target } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { ClientGoal, GoalType, Milestone } from "@/utils/types/goals"
import React from "react"

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
          {goal.growthPlan || goal.description}
        </p>
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

          {goal.milestones && goal.milestones.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Milestones:</h4>
              <div className="space-y-2">
                {(goal.milestones || []).map((milestone, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <div
                      className={cn(
                        "h-4 w-4 rounded-full border-2 flex items-center justify-center",
                        milestone.completed
                          ? "border-green-500 bg-green-500"
                          : "border-muted-foreground"
                      )}
                    >
                      {milestone.completed && (
                        <svg
                          className="h-3 w-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                    <span
                      className={cn(
                        milestone.completed && "text-muted-foreground line-through"
                      )}
                    >
                      {milestone.title}
                    </span>
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