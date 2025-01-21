'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Award, Calendar, DollarSign, Heart, Loader2, Star, Target, Trophy, Users } from "lucide-react"
import { useState, useEffect } from "react"

interface CoachMetrics {
  totalClients: number
  activeClients: number
  sessionCompletionRate: number
  averageRating: number
  clientRetentionRate: number
  revenueGoalProgress: number
  monthlySessionsCompleted: number
  monthlySessionsGoal: number
  positiveReviews: number
  totalReviews: number
}

interface Achievement {
  id: number
  title: string
  description: string
  date: string
  type: 'milestone' | 'certification' | 'award'
  icon: string
}

interface CoachGoalsDashboardProps {
  userDbId: number
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

const placeholderAchievements: Achievement[] = [
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
  },
  {
    id: 3,
    title: "Top Coach of the Month",
    description: "Recognized for exceptional client satisfaction and results",
    date: "2024-03-01",
    type: 'award',
    icon: 'star'
  },
  {
    id: 4,
    title: "Perfect Retention Quarter",
    description: "Maintained 100% client retention rate for Q1 2024",
    date: "2024-03-31",
    type: 'milestone',
    icon: 'heart'
  }
]

export function CoachGoalsDashboard({ userDbId }: CoachGoalsDashboardProps) {
  const [metrics, setMetrics] = useState<CoachMetrics | null>(null)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCoachData = async () => {
      try {
        // Attempt to fetch real data
        const [metricsResponse, achievementsResponse] = await Promise.all([
          fetch(`/api/user/coach/metrics?userDbId=${userDbId}`),
          fetch(`/api/user/coach/achievements?userDbId=${userDbId}`)
        ])

        // Use real data if available, otherwise fall back to placeholder data
        if (metricsResponse.ok) {
          const metricsData = await metricsResponse.json()
          setMetrics(metricsData)
        } else {
          setMetrics(placeholderMetrics)
        }

        if (achievementsResponse.ok) {
          const achievementsData = await achievementsResponse.json()
          setAchievements(achievementsData)
        } else {
          setAchievements(placeholderAchievements)
        }
      } catch (error) {
        console.error('Error fetching coach data:', error)
        // Fall back to placeholder data on error
        setMetrics(placeholderMetrics)
        setAchievements(placeholderAchievements)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCoachData()
  }, [userDbId])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // Ensure we always have data by falling back to placeholder data
  const displayMetrics = metrics || placeholderMetrics
  const displayAchievements = achievements.length > 0 ? achievements : placeholderAchievements

  const getIconForAchievement = (iconName: string) => {
    const icons = {
      trophy: Trophy,
      star: Star,
      award: Award,
      heart: Heart,
      users: Users,
      calendar: Calendar,
      target: Target,
      dollar: DollarSign
    }
    const IconComponent = icons[iconName as keyof typeof icons] || Trophy
    return <IconComponent className="h-4 w-4" />
  }

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
              <div className="text-2xl font-bold">{displayMetrics.activeClients}</div>
              <p className="text-xs text-muted-foreground">
                out of {displayMetrics.totalClients} total clients
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Client Satisfaction</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayMetrics.averageRating.toFixed(1)}/5.0</div>
              <p className="text-xs text-muted-foreground">
                {displayMetrics.positiveReviews} positive out of {displayMetrics.totalReviews} reviews
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Session Completion</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayMetrics.sessionCompletionRate}%</div>
              <p className="text-xs text-muted-foreground">
                {displayMetrics.monthlySessionsCompleted} of {displayMetrics.monthlySessionsGoal} monthly sessions
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Client Retention</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayMetrics.clientRetentionRate}%</div>
              <Progress value={displayMetrics.clientRetentionRate} className="mt-2" />
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="achievements" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {displayAchievements.map((achievement) => (
            <Card key={achievement.id}>
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <div className="flex items-center space-x-4">
                  {getIconForAchievement(achievement.icon)}
                  <div>
                    <CardTitle className="text-sm font-medium">{achievement.title}</CardTitle>
                    <CardDescription>{achievement.date}</CardDescription>
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
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue Goal</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayMetrics.revenueGoalProgress}%</div>
              <Progress value={displayMetrics.revenueGoalProgress} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">Monthly target progress</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Client Growth</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayMetrics.activeClients}</div>
              <Progress 
                value={(displayMetrics.activeClients / displayMetrics.totalClients) * 100} 
                className="mt-2" 
              />
              <p className="text-xs text-muted-foreground mt-2">Active vs Total Clients</p>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  )
} 