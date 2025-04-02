import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Target, Trophy, TrendingUp, Calendar } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { format } from "date-fns"

interface GrowthJourneyStatsProps {
  currentGoals: {
    id: string
    status: string
    deadline: string
  }[]
  recentAchievements: {
    date: string
  }[]
}

export function GrowthJourneyStats({ currentGoals, recentAchievements }: GrowthJourneyStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{currentGoals.length}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {currentGoals.filter(g => g.status === "in_progress").length} in progress
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {Math.round(
              (currentGoals.filter(g => g.status === "completed").length /
                currentGoals.length) *
                100
            )}
            %
          </div>
          <Progress
            className="mt-2"
            value={
              (currentGoals.filter(g => g.status === "completed").length /
                currentGoals.length) *
              100
            }
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Recent Achievements</CardTitle>
          <Trophy className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{recentAchievements.length}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Last achievement: {format(new Date(recentAchievements[0].date), "MMM d")}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Next Milestone</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {format(
              new Date(
                currentGoals.reduce((closest, goal) => {
                  const goalDate = new Date(goal.deadline)
                  const closestDate = new Date(closest)
                  return goalDate < closestDate ? goal.deadline : closest
                }, currentGoals[0].deadline)
              ),
              "MMM d"
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Upcoming deadline</p>
        </CardContent>
      </Card>
    </div>
  )
} 