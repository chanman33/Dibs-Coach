'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Award, 
  Calendar, 
  DollarSign, 
  Heart, 
  Star, 
  Target, 
  Trophy, 
  Users,
  Plus
} from "lucide-react"
import clsx from 'clsx'
import { CoachGoal, CoachAchievement, CoachMetrics } from '@/utils/types/goals'

interface CoachGoalsDashboardProps {
  userDbId: number
  isRealtorCoach?: boolean
}

// Placeholder data
const placeholderMetrics: CoachMetrics = {
  totalClients: 25,
  activeClients: 18,
  sessionCompletionRate: 92,
  averageRating: 4.8,
  clientRetentionRate: 85,
  revenueGoalProgress: 78,
  monthlySessionsCompleted: 45,
  monthlySessionsGoal: 50,
  positiveReviews: 42,
  totalReviews: 45
}

const placeholderAchievements: CoachAchievement[] = [
  {
    id: 1,
    title: "100 Sessions Milestone",
    description: "Successfully completed 100 coaching sessions with outstanding feedback",
    date: "2024-03-15",
    type: 'milestone',
    icon: 'trophy'
  },
  {
    id: 2,
    title: "Advanced Coaching Certification",
    description: "Completed advanced real estate coaching certification program",
    date: "2024-02-20",
    type: 'certification',
    icon: 'award'
  }
]

const placeholderGoals: CoachGoal[] = [
  {
    id: 1,
    title: "Monthly Revenue Target",
    target: 10000,
    current: 7800,
    deadline: "2024-03-31",
    status: "in_progress",
    type: "revenue"
  },
  {
    id: 2,
    title: "Client Growth",
    target: 30,
    current: 18,
    deadline: "2024-06-30",
    status: "in_progress",
    type: "clients"
  }
]

export function CoachGoalsDashboard({ userDbId, isRealtorCoach }: CoachGoalsDashboardProps) {
  const [goals] = useState<CoachGoal[]>(placeholderGoals)
  const [achievements] = useState<CoachAchievement[]>(placeholderAchievements)
  const [metrics] = useState<CoachMetrics>(placeholderMetrics)

  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="achievements">Achievements</TabsTrigger>
        <TabsTrigger value="goals">Goals</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.activeClients}</div>
              <p className="text-xs text-muted-foreground">
                out of {metrics.totalClients} total clients
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Client Satisfaction</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.averageRating.toFixed(1)}/5.0</div>
              <p className="text-xs text-muted-foreground">
                {metrics.positiveReviews} positive out of {metrics.totalReviews} reviews
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Session Completion</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.sessionCompletionRate}%</div>
              <p className="text-xs text-muted-foreground">
                {metrics.monthlySessionsCompleted} of {metrics.monthlySessionsGoal} monthly sessions
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Client Retention</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.clientRetentionRate}%</div>
              <Progress value={metrics.clientRetentionRate} className="mt-2" />
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="achievements" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {achievements.map((achievement) => (
            <Card key={achievement.id}>
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <div className="flex items-center space-x-4">
                  {achievement.icon === 'trophy' && <Trophy className="h-4 w-4 text-yellow-500" />}
                  {achievement.icon === 'award' && <Award className="h-4 w-4 text-blue-500" />}
                  <div>
                    <CardTitle className="text-sm font-medium">{achievement.title}</CardTitle>
                    <CardDescription>
                      {new Date(achievement.date).toLocaleDateString()}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{achievement.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="goals" className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-3xl font-bold tracking-tight">Coaching Goals</h2>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Set New Goal
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {goals.map((goal) => (
            <Card key={goal.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{goal.title}</CardTitle>
                {goal.type === 'revenue' ? (
                  <DollarSign className="h-4 w-4 text-green-500" />
                ) : goal.type === 'clients' ? (
                  <Users className="h-4 w-4 text-blue-500" />
                ) : (
                  <Target className="h-4 w-4 text-purple-500" />
                )}
              </CardHeader>
              <CardContent>
                <div className="mt-2">
                  <Progress 
                    value={(goal.current / goal.target) * 100} 
                    className="h-2"
                  />
                </div>
                <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                  <span>Progress: {((goal.current / goal.target) * 100).toFixed(0)}%</span>
                  <span>Due: {new Date(goal.deadline).toLocaleDateString()}</span>
                </div>
                <div className="mt-2">
                  <span className={clsx(
                    "text-xs px-2 py-1 rounded-full",
                    {
                      "bg-green-100 text-green-800": goal.status === "completed",
                      "bg-yellow-100 text-yellow-800": goal.status === "in_progress",
                      "bg-red-100 text-red-800": goal.status === "overdue"
                    }
                  )}>
                    {goal.status.replace('_', ' ')}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  )
} 