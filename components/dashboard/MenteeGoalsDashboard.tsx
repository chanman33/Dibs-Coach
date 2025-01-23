'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { DollarSign, Plus, Target, Users, Trophy, TrendingUp, CheckCircle2 } from "lucide-react"
import clsx from 'clsx'
import { MenteeGoal, MenteeAchievement } from '@/utils/types/goals'

interface MenteeGoalsDashboardProps {
  userDbId: number
}

// Placeholder data
const placeholderGoals: MenteeGoal[] = [
  {
    id: 1,
    title: "Monthly Sales Target",
    target: 500000,
    current: 350000,
    deadline: "2024-03-31",
    status: "in_progress",
    type: "sales"
  },
  {
    id: 2,
    title: "Active Listings",
    target: 10,
    current: 7,
    deadline: "2024-06-30",
    status: "in_progress",
    type: "listings"
  },
  {
    id: 3,
    title: "Client Consultations",
    target: 20,
    current: 15,
    deadline: "2024-03-31",
    status: "in_progress",
    type: "clients"
  }
]

const placeholderAchievements: MenteeAchievement[] = [
  {
    id: 1,
    title: "First Million Dollar Sale",
    description: "Closed your first million-dollar property deal",
    date: "2024-02-15",
    type: "sales",
    icon: "trophy"
  },
  {
    id: 2,
    title: "Top Performer",
    description: "Ranked in the top 10% of realtors this month",
    date: "2024-03-01",
    type: "performance",
    icon: "trending-up"
  },
  {
    id: 3,
    title: "Perfect Reviews",
    description: "Received 5-star reviews from 10 consecutive clients",
    date: "2024-02-28",
    type: "client_satisfaction",
    icon: "check-circle"
  }
]

export function MenteeGoalsDashboard({ userDbId }: MenteeGoalsDashboardProps) {
  const [goals] = useState<MenteeGoal[]>(placeholderGoals)
  const [achievements] = useState<MenteeAchievement[]>(placeholderAchievements)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Goals & Achievements</h2>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Set New Goal
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {goals.map((goal) => (
          <Card key={goal.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{goal.title}</CardTitle>
              {goal.type === 'sales' ? (
                <DollarSign className="h-4 w-4 text-green-500" />
              ) : goal.type === 'listings' ? (
                <Target className="h-4 w-4 text-blue-500" />
              ) : (
                <Users className="h-4 w-4 text-purple-500" />
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

      <h3 className="text-2xl font-semibold tracking-tight mt-8 mb-4">Recent Achievements</h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {achievements.map((achievement) => (
          <Card key={achievement.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{achievement.title}</CardTitle>
              {achievement.icon === 'trophy' && <Trophy className="h-4 w-4 text-yellow-500" />}
              {achievement.icon === 'trending-up' && <TrendingUp className="h-4 w-4 text-blue-500" />}
              {achievement.icon === 'check-circle' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{achievement.description}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Earned on {new Date(achievement.date).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 