'use client'

import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { WithAuth } from "@/components/auth/with-auth"
import { USER_CAPABILITIES } from "@/utils/roles/roles"
import { Users, Target, Clock, TrendingUp, ArrowUpRight, Trophy, Loader2, Calendar, Instagram, AlertCircle, ChevronRight, BarChart, ChevronLeft, Home, DollarSign, Users as UsersIcon, Star, Globe, Award, BookOpen, Briefcase, Settings } from "lucide-react"
import Link from 'next/link'
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { fetchGoals } from "@/utils/actions/goals"
import { fetchUserSessions } from "@/utils/actions/sessions"
import { SessionStatus, type TransformedSession } from "@/utils/types/session"
import { toast } from "sonner"
import type { Goal } from "@/utils/types/goals"
import { format, isAfter } from "date-fns"

function MenteeDashboardContent() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [currentGoalIndex, setCurrentGoalIndex] = useState(0)
  const [nextSession, setNextSession] = useState<TransformedSession | null>(null)
  const [isLoadingGoal, setIsLoadingGoal] = useState(true)
  const [isLoadingSession, setIsLoadingSession] = useState(true)

  const currentGoal = goals[currentGoalIndex]

  const navigateGoal = (direction: 'next' | 'prev') => {
    if (direction === 'next' && currentGoalIndex < goals.length - 1) {
      setCurrentGoalIndex(currentGoalIndex + 1)
    } else if (direction === 'prev' && currentGoalIndex > 0) {
      setCurrentGoalIndex(currentGoalIndex - 1)
    }
  }

  useEffect(() => {
    const loadGoals = async () => {
      try {
        const { data, error } = await fetchGoals({})
        if (error) {
          console.error('[FETCH_GOALS_ERROR]', error)
          toast.error('Failed to load goal data')
          return
        }
        setGoals(data || [])
      } catch (error) {
        console.error('[FETCH_GOALS_ERROR]', error)
        toast.error('Failed to load goal data')
      } finally {
        setIsLoadingGoal(false)
      }
    }

    const loadNextSession = async () => {
      try {
        const { data, error } = await fetchUserSessions({})
        if (error) {
          console.error('[FETCH_SESSIONS_ERROR]', error)
          toast.error('Failed to load session data')
          return
        }

        // Find the next upcoming session
        const now = new Date()
        const upcomingSessions = data?.filter(session =>
          session.status === SessionStatus.SCHEDULED &&
          isAfter(new Date(session.startTime), now)
        ).sort((a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        )

        setNextSession(upcomingSessions && upcomingSessions.length > 0 ? upcomingSessions[0] : null)
      } catch (error) {
        console.error('[FETCH_SESSIONS_ERROR]', error)
        toast.error('Failed to load session data')
      } finally {
        setIsLoadingSession(false)
      }
    }

    loadGoals()
    loadNextSession()
  }, [])

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min(Math.round((current / target) * 100), 100)
  }

  const getTimeUntilDeadline = (deadline: string) => {
    const today = new Date()
    const deadlineDate = new Date(deadline)
    const diffTime = deadlineDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    // For periods longer than a year
    if (diffDays >= 365) {
      const years = Math.floor(diffDays / 365)
      return {
        value: years,
        unit: 'year' + (years === 1 ? '' : 's'),
        isNearDeadline: false
      }
    }

    // For periods longer than 45 days, show in months
    if (diffDays > 45) {
      // More accurate month calculation
      const months = Math.round(diffDays / 30.44) // Average days in a month
      return {
        value: months,
        unit: 'month' + (months === 1 ? '' : 's'),
        isNearDeadline: false
      }
    }

    // For 45 days or less, show in days
    return {
      value: diffDays,
      unit: 'day' + (diffDays === 1 ? '' : 's'),
      isNearDeadline: diffDays < 7
    }
  }

  const getGoalTypeIcon = (type: string) => {
    switch (type) {
      // Financial Goals
      case 'sales_volume':
      case 'commission_income':
      case 'gci':
      case 'session_revenue':
        return <DollarSign className="h-3 w-3" />
      case 'avg_sale_price':
        return <TrendingUp className="h-3 w-3" />

      // Transaction Goals
      case 'listings':
      case 'buyer_transactions':
      case 'closed_deals':
        return <Home className="h-3 w-3" />
      case 'days_on_market':
        return <Clock className="h-3 w-3" />

      // Client Goals
      case 'new_clients':
      case 'referrals':
      case 'client_retention':
        return <UsersIcon className="h-3 w-3" />
      case 'reviews':
        return <Star className="h-3 w-3" />

      // Market Presence
      case 'market_share':
      case 'territory_expansion':
        return <Globe className="h-3 w-3" />
      case 'social_media':
      case 'website_traffic':
        return <TrendingUp className="h-3 w-3" />

      // Professional Development
      case 'certifications':
        return <Award className="h-3 w-3" />
      case 'training_hours':
        return <BookOpen className="h-3 w-3" />
      case 'networking_events':
        return <Users className="h-3 w-3" />

      // Coaching Goals
      case 'coaching_sessions':
      case 'group_sessions':
      case 'active_mentees':
      case 'mentee_satisfaction':
      case 'response_time':
      case 'session_completion':
      case 'mentee_milestones':
        return <Trophy className="h-3 w-3" />

      // Custom/Other
      case 'custom':
        return <Settings className="h-3 w-3" />

      default:
        return <Target className="h-3 w-3" />
    }
  }

  const getFormatForGoalType = (type: string): "number" | "currency" | "percentage" | "time" => {
    switch (type) {
      // Currency format
      case "sales_volume":
      case "commission_income":
      case "gci":
      case "avg_sale_price":
      case "session_revenue":
        return "currency"
      
      // Percentage format
      case "market_share":
      case "client_retention":
      case "mentee_satisfaction":
      case "session_completion":
        return "percentage"
      
      // Time format (hours)
      case "response_time":
      case "training_hours":
      case "days_on_market":
        return "time"
      
      // Number format (default)
      default:
        return "number"
    }
  }

  const formatValue = (value: number, format: string) => {
    switch (format) {
      case "currency":
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value)
      case "percentage":
        return `${value}%`
      case "time":
        return `${value} hrs`
      default:
        return value.toLocaleString()
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold">Welcome to Your Dashboard</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/dashboard/mentee/browse-coaches">
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Browse Coaches
              </Button>
            </Link>
            <Link href="/dashboard/mentee/goals">
              <Button variant="outline" className="w-full justify-start">
                <Target className="mr-2 h-4 w-4" />
                Set Goals
              </Button>
            </Link>
            <Link href="/dashboard/mentee/schedule">
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="mr-2 h-4 w-4" />
                Schedule Session
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Progress Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Progress Overview</CardTitle>
            <CardDescription>Your learning journey</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">Sessions Completed</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">Goals Achieved</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <Trophy className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Sessions */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Sessions</CardTitle>
            <CardDescription>Your scheduled coaching sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-sm text-muted-foreground">
                No upcoming sessions scheduled
              </p>
              <Link href="/dashboard/mentee/schedule">
                <Button variant="outline" className="mt-4">
                  Schedule a Session
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Create the protected component using WithAuth HOC
const ProtectedMenteeDashboard = WithAuth(MenteeDashboardContent);

// Export the protected component wrapped in Suspense
export default function MenteeDashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <ProtectedMenteeDashboard />
    </Suspense>
  )
} 