'use client'

import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Target, Clock, TrendingUp, ArrowUpRight, Trophy, Loader2, Calendar, Instagram, AlertCircle, ChevronRight, BarChart, ChevronLeft, Home, DollarSign, Users as UsersIcon, Star, Globe, Award, BookOpen, Briefcase, Settings, Building, Gift } from "lucide-react"
import Link from 'next/link'
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { fetchGoals } from "@/utils/actions/goals"
import { fetchUserSessions } from "@/utils/actions/sessions"
import { SessionStatus, type TransformedSession } from "@/utils/types/session"
import { toast } from "sonner"
import type { ClientGoal } from "@/utils/types/goals"
import { format, isAfter } from "date-fns"

function MenteeDashboard() {
  const [goals, setGoals] = useState<ClientGoal[]>([])
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

        // Transform the data to match ClientGoal interface and sort by personal/org goals
        const transformedGoals = (data || []).map(goal => {
          const typedGoal = goal as any;

          // Parse target value correctly
          let targetValue = 0;
          if (typedGoal.target) {
            try {
              if (typeof typedGoal.target === 'string') {
                const parsedTarget = JSON.parse(typedGoal.target);
                targetValue = parsedTarget?.value || 0;
              } else if (typeof typedGoal.target === 'object') {
                targetValue = typedGoal.target?.value || 0;
              }
            } catch (e) {
              console.error('[TARGET_PARSE_ERROR]', {
                error: e,
                target: typedGoal.target,
                goalId: typedGoal.ulid,
                timestamp: new Date().toISOString()
              });
            }
          }

          // Parse progress value correctly
          let progressValue = 0;
          if (typedGoal.progress) {
            try {
              if (typeof typedGoal.progress === 'string') {
                const parsedProgress = JSON.parse(typedGoal.progress);
                progressValue = parsedProgress?.value || 0;
              } else if (typeof typedGoal.progress === 'object') {
                progressValue = typedGoal.progress?.value || 0;
              }
            } catch (e) {
              console.error('[PROGRESS_PARSE_ERROR]', {
                error: e,
                progress: typedGoal.progress,
                goalId: typedGoal.ulid,
                timestamp: new Date().toISOString()
              });
            }
          }

          // Parse the due date correctly
          let deadline = typedGoal.dueDate;
          if (deadline) {
            try {
              const date = new Date(deadline);
              if (!isNaN(date.getTime())) {
                deadline = date.toISOString().split('T')[0];
              }
            } catch (e) {
              console.error('[DATE_PARSE_ERROR]', {
                error: e,
                dueDate: typedGoal.dueDate,
                goalId: typedGoal.ulid,
                timestamp: new Date().toISOString()
              });
            }
          }

          return {
            ulid: typedGoal.ulid,
            userUlid: typedGoal.userUlid,
            organizationUlid: typedGoal.organizationUlid,
            title: typedGoal.title,
            description: typedGoal.description || null,
            target: targetValue,
            current: progressValue,
            deadline: deadline,
            type: typedGoal.type,
            status: typedGoal.status,
            createdAt: typedGoal.createdAt || new Date().toISOString(),
            updatedAt: typedGoal.updatedAt || new Date().toISOString(),
            organization: typedGoal.organization,
            user: typedGoal.user
          };
        });

        // Sort goals: personal goals first, then organization goals
        const sortedGoals = transformedGoals.sort((a, b) => {
          // If a is a personal goal and b is an org goal, a comes first
          if (!a.organizationUlid && b.organizationUlid) return -1;
          // If a is an org goal and b is a personal goal, b comes first
          if (a.organizationUlid && !b.organizationUlid) return 1;
          // If both are the same type, sort by creation date (newest first)
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        setGoals(sortedGoals);
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
        const upcomingSessions = data?.filter((session: TransformedSession) =>
          session.status === 'SCHEDULED' &&
          isAfter(new Date(session.startTime), now)
        ).sort((a: TransformedSession, b: TransformedSession) =>
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
    const deadlineDate = new Date(deadline)
    const now = new Date()
    const diffTime = deadlineDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return {
        value: Math.abs(diffDays),
        unit: 'days',
        isNearDeadline: true,
        text: `${Math.abs(diffDays)} days overdue`
      }
    } else if (diffDays === 0) {
      return {
        value: 0,
        unit: 'days',
        isNearDeadline: true,
        text: 'Due today'
      }
    } else if (diffDays === 1) {
      return {
        value: 1,
        unit: 'day',
        isNearDeadline: true,
        text: 'Due tomorrow'
      }
    } else if (diffDays <= 7) {
      return {
        value: diffDays,
        unit: 'days',
        isNearDeadline: true,
        text: `${diffDays} days left`
      }
    } else {
      return {
        value: diffDays,
        unit: 'days',
        isNearDeadline: false,
        text: `${diffDays} days left`
      }
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
    // Handle null or undefined values
    if (value === null || value === undefined) {
      return '0'
    }

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
    <div className='space-y-6 p-6'>
      {/* Quick Action Center */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 relative min-h-[240px] flex flex-col">
          <CardHeader className="pb-3 flex-none">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Quick Schedule
            </CardTitle>
            <CardDescription className="line-clamp-2">
              {isLoadingSession ? (
                <span className="animate-pulse">Loading recommendations...</span>
              ) : nextSession ? (
                "Book additional sessions to accelerate growth"
              ) : (
                "Find the perfect time with top coaches"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between pb-4">
            {isLoadingSession ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                    <Button variant="outline" size="sm" className="w-full hover:bg-primary/5 px-2 sm:px-4" asChild>
                      <Link href="/dashboard/mentee/calendar?time=morning">
                        <span className="hidden sm:inline">Morning</span>
                        <span className="sm:hidden">AM</span>
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" className="w-full hover:bg-primary/5 px-2 sm:px-4" asChild>
                      <Link href="/dashboard/mentee/calendar?time=afternoon">
                        <span className="hidden sm:inline">Afternoon</span>
                        <span className="sm:hidden">PM</span>
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" className="w-full hover:bg-primary/5 px-2 sm:px-4" asChild>
                      <Link href="/dashboard/mentee/calendar?time=evening">
                        <span className="hidden sm:inline">Evening</span>
                        <span className="sm:hidden">Eve</span>
                      </Link>
                    </Button>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Recommended:</span>
                      <Badge variant="outline" className="text-xs hidden sm:inline-flex">
                        Based on your goals
                      </Badge>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      {isLoadingGoal ? (
                        <span className="animate-pulse">Finding best match...</span>
                      ) : currentGoal ? (
                        <div className="flex items-center gap-2">
                          {getGoalTypeIcon(currentGoal.type)}
                          <span className="font-medium line-clamp-1">
                            {currentGoal.type === 'sales_volume' ? 'Sales Strategy Session' :
                              currentGoal.type === 'listings' ? 'Listing Optimization Session' :
                                currentGoal.type === 'buyer_transactions' ? 'Buyer Strategy Session' :
                                  currentGoal.type === 'market_share' ? 'Market Analysis Session' :
                                    'General Goal Strategy Session'}
                          </span>
                        </div>
                      ) : (
                        <span className="font-medium">General Coaching Session</span>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="default"
                  className="w-full h-10 justify-center hover:bg-primary/90 transition-colors mt-4"
                  asChild
                >
                  <Link href="/dashboard/mentee/browse-coaches?focus=sales">
                    <div className="flex items-center gap-2">
                      <span>Book Now</span>
                    </div>
                  </Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20 relative min-h-[240px] flex flex-col">
          <CardHeader className="pb-3 flex-none">
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-green-500" />
              Training Progress
            </CardTitle>
            <CardDescription className="line-clamp-2">
              {isLoadingSession ? (
                <span className="animate-pulse">Loading engagement data...</span>
              ) : (
                "Track your monthly coaching engagement"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between pb-4">
            {isLoadingSession ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-foreground">Monthly Sessions</span>
                      <span className="font-medium">
                        {nextSession ? "1" : "0"} / 2 completed
                      </span>
                    </div>
                    <Progress value={nextSession ? 50 : 0} className="h-2 [&>div]:bg-green-500 bg-green-100" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-foreground">Coaching Hours</span>
                      <span className="font-medium">
                        {nextSession ? "1" : "0"} / 1 hr
                      </span>
                    </div>
                    <Progress value={nextSession ? 100 : 0} className="h-2 [&>div]:bg-green-500 bg-green-100" />
                  </div>
                </div>
                <Button
                  className="w-full h-10 bg-green-500 hover:bg-green-600 text-white transition-colors mt-4"
                  asChild
                >
                  <Link href="/dashboard/mentee/history">
                    View Training History
                  </Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20 relative min-h-[240px] flex flex-col">
          <CardHeader className="pb-3 flex-none">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building className="h-5 w-5 text-blue-500" />
                Business Connection
              </CardTitle>
            </div>
            <CardDescription className="line-clamp-2">
              Unlock team-wide benefits when you connect with your brokerage
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between pb-4">
            <div className="space-y-2.5">
              <div className="flex items-start gap-2 text-sm">
                <Users className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                <span>
                  <span className="font-semibold text-foreground">Company-sponsored coaching</span>
                </span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <BarChart className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                <span>
                  <span className="font-semibold text-foreground">Enhanced team performance</span>
                </span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <Gift className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                <span>
                  <span className="font-semibold text-foreground">Early access to new features</span>
                </span>
              </div>
            </div>

            <Button
              className="w-full h-10 bg-blue-500 hover:bg-blue-600 text-white transition-colors mt-4"
              asChild
            >
              <Link href="/business-solutions">
                Learn More
              </Link>
            </Button>
          </CardContent>

        </Card>
      </div>

      <div className='grid md:grid-cols-2 sm:grid-cols-1 w-full gap-3'>
        <Card>
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Upcoming Sessions</CardTitle>
              <CardDescription>
                Your scheduled coaching sessions
              </CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
              <Link href="/dashboard/mentee/calendar">
                View All
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
              {isLoadingSession ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : !nextSession ? (
                <div className="text-center py-6 bg-muted/30 rounded-lg">
                  <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-4 animate-bounce" />
                  <h3 className="font-semibold mb-2">No Upcoming Sessions</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Regular coaching sessions are key to achieving your real estate goals. Book your next session to stay on track.
                  </p>
                  <div className="space-y-2 sm:space-y-0 sm:space-x-2 flex flex-col sm:flex-row justify-center">
                    <Button asChild variant="default" className="w-full sm:w-auto hover:scale-105 transition-transform">
                      <Link href="/dashboard/mentee/browse-coaches">
                        Find a Coach
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="font-medium text-lg">
                        {nextSession.sessionType || 'Coaching Session'}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4" />
                          {format(new Date(nextSession.startTime), 'EEEE, MMMM d')}
                        </div>
                        <div className="flex items-center">
                          <Clock className="mr-2 h-4 w-4" />
                          {format(new Date(nextSession.startTime), 'h:mm a')}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {nextSession.durationMinutes} mins
                    </Badge>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        Coach {nextSession.otherParty.firstName} {nextSession.otherParty.lastName}
                      </p>
                    </div>
                    {nextSession.zoomJoinUrl && (
                      <Button asChild size="sm" variant="outline">
                        <Link href={nextSession.zoomJoinUrl} target="_blank" rel="noopener noreferrer">
                          Join Call
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center pb-3">
            <div className="grid gap-1.5">
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Current Goals
              </CardTitle>
              <CardDescription>
                Track your progress and milestones
              </CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1 hover:scale-105 transition-transform">
              <Link href="/dashboard/mentee/profile?tab=goals">
                View All
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-2">
            <div style={{ maxHeight: '320px', overflowY: 'auto' }} className="pr-2">
              {isLoadingGoal ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : !currentGoal ? (
                <div className="text-center py-6 bg-muted/30 rounded-lg">
                  <Target className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No Goals Set</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Setting clear goals helps you track progress and achieve success in your real estate career.
                  </p>
                  <Button asChild variant="outline" className="hover:scale-105 transition-transform">
                    <Link href="/dashboard/mentee/profile?tab=goals">
                      Set Your First Goal
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-medium text-lg leading-tight">{currentGoal.title}</h3>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Badge variant="outline" className="flex items-center gap-1">
                              {getGoalTypeIcon(currentGoal.type)}
                              {currentGoal.type.split('_').map(word =>
                                word.charAt(0).toUpperCase() + word.slice(1)
                              ).join(' ')}
                            </Badge>
                            {currentGoal.organizationUlid && currentGoal.organization && (
                              <Badge variant="secondary" className="flex items-center gap-1">
                                <Briefcase className="h-3 w-3" />
                                {currentGoal.organization.name}
                              </Badge>
                            )}

                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="hover:scale-105 transition-transform"
                            onClick={() => navigateGoal('prev')}
                            disabled={currentGoalIndex === 0}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="hover:scale-105 transition-transform"
                            onClick={() => navigateGoal('next')}
                            disabled={currentGoalIndex === goals.length - 1}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {currentGoal.description && (
                        <p className="text-sm text-muted-foreground mt-2">{currentGoal.description}</p>
                      )}
                    </div>

                    <div className="space-y-2.5 bg-muted/30 p-3.5 rounded-lg">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-muted-foreground">Current Progress</span>
                        <span className="font-medium">
                          {formatValue(currentGoal.current, getFormatForGoalType(currentGoal.type))} / {formatValue(currentGoal.target, getFormatForGoalType(currentGoal.type))}
                        </span>
                      </div>
                      <div className="relative h-2.5 overflow-hidden rounded-full">
                        <div className="absolute inset-0 bg-muted" />
                        <div
                          className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80 transition-all duration-500"
                          style={{ width: `${getProgressPercentage(currentGoal.current, currentGoal.target)}%` }}
                        />
                        <div
                          className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20 animate-pulse"
                          style={{ width: `${getProgressPercentage(currentGoal.current, currentGoal.target)}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm bg-muted/20 p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>Time Remaining</span>
                      </div>
                      {(() => {
                        const timeRemaining = getTimeUntilDeadline(currentGoal.deadline)
                        return (
                          <div className={`flex items-center gap-1.5 font-medium ${timeRemaining.isNearDeadline
                            ? 'text-destructive'
                            : ''}`}>
                            <Clock className="h-3.5 w-3.5" />
                            {timeRemaining.text}
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  )
}

// Export the component wrapped in Suspense
export default function MenteeDashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <MenteeDashboard />
    </Suspense>
  )
} 