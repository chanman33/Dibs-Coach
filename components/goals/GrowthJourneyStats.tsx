import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Target, Trophy, TrendingUp, Calendar, Info, Clock, CheckCircle2, AlertTriangle } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { format } from "date-fns"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface GrowthJourneyStatsProps {
  currentGoals: {
    id: string
    status: string
    deadline: string
    title?: string
    milestones?: { title: string; completed: boolean }[]
    growthPlan?: string
    target?: number
    current?: number
  }[]
  completedGoals: {
    id: string
    title: string
    completedAt: string | null
  }[]
}

// Helper to format goal status for display
const getStatusDisplay = (status: string) => {
  const normalizedStatus = status.toUpperCase();
  
  switch (normalizedStatus) {
    case 'IN_PROGRESS':
      return {
        label: 'In Progress',
        icon: Clock,
        className: 'bg-blue-100 text-blue-700'
      };
    case 'COMPLETED':
      return {
        label: 'Completed',
        icon: CheckCircle2,
        className: 'bg-green-100 text-green-700'
      };
    case 'OVERDUE':
      return {
        label: 'Overdue',
        icon: AlertTriangle,
        className: 'bg-red-100 text-red-700'
      };
    default:
      return {
        label: status,
        icon: Info,
        className: 'bg-gray-100 text-gray-700'
      };
  }
};

function ProgressDetailsDialog({ goals, averageProgress }: { 
  goals: GrowthJourneyStatsProps['currentGoals'], 
  averageProgress: number 
}) {
  // Filter and sort goals by progress percentage, preserving all goal data
  const goalsWithProgress = goals
    .filter(goal => typeof goal.target === 'number' && typeof goal.current === 'number' && goal.target > 0)
    .map(goal => ({
      ...goal, // Keep all goal data including title
      progressPercent: Math.min((goal.current! / goal.target!) * 100, 100)
    }))
    .sort((a, b) => b.progressPercent - a.progressPercent);

  // Log the processed goals data to verify titles are present
  console.log("[PROGRESS_DETAILS_DIALOG]", {
    goalsWithProgress,
    timestamp: new Date().toISOString()
  });

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Detailed Progress Breakdown</DialogTitle>
      </DialogHeader>
      <div className="mt-4 space-y-4">
        <div className="rounded-lg bg-muted p-4">
          <div className="text-sm font-medium mb-2">Overall Progress</div>
          <div className="flex items-center gap-4">
            <div className="text-3xl font-bold">{averageProgress}%</div>
            <Progress value={averageProgress} className="flex-1" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Average progress across {goalsWithProgress.length} active goals
          </p>
        </div>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Goal</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {goalsWithProgress.map(goal => {
                const statusDisplay = getStatusDisplay(goal.status);
                const StatusIcon = statusDisplay.icon;
                
                return (
                  <TableRow key={goal.id}>
                    <TableCell className="font-medium">
                      {goal.title || "Untitled Goal"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-4">
                        <div className="w-16 text-sm">
                          {Math.round(goal.progressPercent)}%
                        </div>
                        <Progress value={goal.progressPercent} className="flex-1" />
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {goal.current?.toLocaleString()} / {goal.target?.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${statusDisplay.className}`}>
                        <StatusIcon className="h-3 w-3" />
                        <span>{statusDisplay.label}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="text-xs text-muted-foreground">
          <Info className="inline h-3 w-3 mr-1" />
          Progress is capped at 100% per goal for averaging
        </div>
      </div>
    </DialogContent>
  );
}

export function GrowthJourneyStats({ currentGoals, completedGoals }: GrowthJourneyStatsProps) {
  const [isProgressDialogOpen, setIsProgressDialogOpen] = useState(false);

  // Calculate average progress across all goals
  const calculateAverageProgress = () => {
    const goalsWithProgress = currentGoals.filter(
      goal => typeof goal.target === 'number' && 
             typeof goal.current === 'number' && 
             goal.target > 0
    );

    if (goalsWithProgress.length === 0) return 0;

    // Calculate individual progress percentages (capped at 100%)
    const progressPercentages = goalsWithProgress.map(goal => {
      const progressPercent = (goal.current! / goal.target!) * 100;
      return Math.min(progressPercent, 100); // Cap at 100%
    });

    // Calculate the average progress
    const averageProgress = progressPercentages.reduce((sum, percent) => sum + percent, 0) / 
                          progressPercentages.length;

    // Log the calculation for debugging
    console.log("[PROGRESS_CALCULATION]", {
      totalGoals: currentGoals.length,
      goalsWithValidProgress: goalsWithProgress.length,
      individualProgressValues: goalsWithProgress.map(g => ({
        id: g.id,
        current: g.current,
        target: g.target,
        progressPercent: (g.current! / g.target!) * 100
      })),
      averageProgress,
      timestamp: new Date().toISOString()
    });

    return Math.round(averageProgress);
  };

  const averageProgress = calculateAverageProgress();

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentGoals.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {currentGoals.filter(g => 
                g.status === "in_progress" || 
                g.status === "IN_PROGRESS"
              ).length} in progress
            </p>
          </CardContent>
        </Card>

        <Dialog open={isProgressDialogOpen} onOpenChange={setIsProgressDialogOpen}>
          <DialogTrigger asChild>
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {averageProgress}%
                </div>
                <Progress
                  className="mt-2"
                  value={averageProgress}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Click for detailed breakdown
                </p>
              </CardContent>
            </Card>
          </DialogTrigger>
          <ProgressDetailsDialog 
            goals={currentGoals} 
            averageProgress={averageProgress} 
          />
        </Dialog>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Goals</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedGoals.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {completedGoals.length > 0 && completedGoals[0].completedAt
                ? `Last completed: ${format(new Date(completedGoals[0].completedAt), "MMM d")}`
                : "No goals completed yet"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Deadline</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentGoals.length > 0 ? (
                format(
                  new Date(
                    currentGoals.reduce((closest, goal) => {
                      const goalDate = new Date(goal.deadline)
                      const closestDate = new Date(closest)
                      return goalDate < closestDate ? goal.deadline : closest
                    }, currentGoals[0].deadline)
                  ),
                  "MMM d"
                )
              ) : (
                "No deadlines"
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {currentGoals.length > 0 ? (
                (() => {
                  const nextDeadline = currentGoals.reduce((closest, goal) => {
                    const goalDate = new Date(goal.deadline)
                    const closestDate = new Date(closest)
                    return goalDate < closestDate ? goal.deadline : closest
                  }, currentGoals[0].deadline)
                  
                  const goalWithNextDeadline = currentGoals.find(
                    goal => goal.deadline === nextDeadline
                  )
                  
                  return goalWithNextDeadline?.title || "Untitled Goal"
                })()
              ) : (
                "No upcoming goals"
              )}
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  )
} 