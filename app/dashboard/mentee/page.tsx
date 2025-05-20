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
import type { ClientGoal, GoalType } from "@/utils/types/goals"
import { format, isAfter } from "date-fns"

// Helper function to map goal types to coach focus areas
const getCoachFocusForGoal = (goalType?: GoalType): string => {
  if (!goalType) return ''; // Default if no goal or type

  switch (goalType) {
    // Financial & Sales Volume Related
    case 'sales_volume':
    case 'commission_income':
    case 'gci':
    case 'avg_sale_price':
      return 'BUSINESS_DEVELOPMENT'; // Skill Category
    case 'session_revenue': // Could also be business development or a specific service focus
      return 'BUSINESS_DEVELOPMENT'; 

    // Transaction Related (Primarily Realtor focus)
    case 'listings':
    case 'buyer_transactions':
    case 'closed_deals':
      return 'REALTOR'; // Real Estate Domain & Skill Category
    case 'days_on_market':
      return 'REALTOR'; // Or potentially a more specific market analysis skill

    // Client Relationship Focused
    case 'new_clients':
    case 'referrals':
    case 'client_retention':
    case 'reviews': // Client satisfaction aspect
      return 'CLIENT_RELATIONS'; // Skill Category

    // Market Presence & Marketing
    case 'market_share':
    case 'territory_expansion':
      return 'BUSINESS_DEVELOPMENT'; // Broader business growth
    case 'social_media':
      return 'SOCIAL_MEDIA'; // Skill Category
    case 'website_traffic':
      return 'MARKET_INNOVATION'; // Skill Category (broader digital marketing)

    // Professional Development
    case 'certifications':
    case 'training_hours':
    case 'networking_events':
      return 'PROFESSIONAL_DEVELOPMENT'; // Skill Category
    
    // Coaching specific goals (less relevant for mentee searching for coach)
    // case 'coaching_sessions':
    // case 'group_sessions':
    // case 'active_mentees':
    // case 'mentee_satisfaction':
    // case 'response_time':
    // case 'session_completion':
    // case 'mentee_milestones':
    //   return ''; // Or a general category if applicable

    case 'custom':
    default:
      return ''; // Default to no specific focus or a general one
  }
};

function MenteeDashboard() {
  const [goals, setGoals] = useState<ClientGoal[]>([])
  const [currentGoalIndex, setCurrentGoalIndex] = useState(0)
  const [upcomingSessions, setUpcomingSessions] = useState<TransformedSession[]>([])
  const [isLoadingGoal, setIsLoadingGoal] = useState(true)
  const [isLoadingSession, setIsLoadingSession] = useState(true)

  const currentGoal = goals[currentGoalIndex]

  // Define SessionCard component inside MenteeDashboard to access necessary variables
  function SessionCard({ session }: { session: TransformedSession }) {
    const sessionDate = new Date(session.startTime);
    const endDate = new Date(session.endTime);
    
    // Format the coach's name
    const coachName = [
      session.otherParty.firstName, 
      session.otherParty.lastName
    ].filter(Boolean).join(' ');
    
    // Get day, date, and time information
    const dayName = format(sessionDate, 'EEE');
    const dayNumber = format(sessionDate, 'd');
    const startTime = format(sessionDate, 'h:mm a');
    const endTime = format(endDate, 'h:mm a');
    
    // Calculate days until the session
    const daysUntil = Math.ceil((sessionDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    // Determine if the session is today, tomorrow, or in the future
    let timingLabel = "";
    let accentColor = "bg-blue-500";
    
    if (daysUntil === 0) {
      timingLabel = "Today";
      accentColor = "bg-green-500";
    } else if (daysUntil === 1) {
      timingLabel = "Tomorrow";
      accentColor = "bg-amber-500";
    } else if (daysUntil <= 7) {
      timingLabel = `In ${daysUntil} days`;
      accentColor = "bg-blue-500";
    } else {
      timingLabel = format(sessionDate, 'MMM d');
      accentColor = "bg-slate-500";
    }
    
    return (
      <div className="group relative border rounded-lg p-4 hover:shadow-md transition-all duration-200 hover:border-primary/50 hover:bg-muted/20">
        <div className="absolute top-0 left-0 w-1 h-full rounded-l-lg transition-all duration-200 group-hover:h-full" 
             style={{ backgroundColor: accentColor.replace('bg-', '') }}></div>
        
        <div className="flex items-start space-x-3">
          {/* Date calendar indicator */}
          <div className="flex-shrink-0">
            <div className="flex flex-col items-center justify-center rounded-md overflow-hidden border w-12">
              <div className={`${accentColor} text-white text-xs font-medium w-full text-center py-0.5`}>
                {dayName}
              </div>
              <div className="text-xl font-bold w-full text-center py-1 bg-card">
                {dayNumber}
              </div>
            </div>
          </div>
          
          {/* Session details */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-base truncate">
              Coaching session: {coachName}
            </h3>
            
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="mr-1.5 h-3.5 w-3.5" />
                {startTime} - {endTime}
              </div>
              
              {session.sessionType && (
                <div className="text-sm text-muted-foreground">
                  <span className="capitalize">{session.sessionType.toLowerCase()}</span>
                </div>
              )}
              
              <div className="text-sm">
                <Badge variant="outline" className="font-normal text-xs">
                  {session.durationMinutes}min
                </Badge>
              </div>
            </div>
          </div>
          
          {/* Action button and timing indicator */}
          <div className="flex flex-col items-end space-y-2">
            <Badge variant="secondary" className="text-xs whitespace-nowrap">
              {timingLabel}
            </Badge>
            
            {session.zoomJoinUrl && daysUntil <= 0 && (
              <Button asChild size="sm" variant="outline" className="text-xs h-8 px-3">
                <Link href={session.zoomJoinUrl} target="_blank" rel="noopener noreferrer">
                  Join Call
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

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

    const loadSessions = async () => {
      try {
        const { data, error } = await fetchUserSessions({})
        if (error) {
          console.error('[FETCH_SESSIONS_ERROR]', error)
          toast.error('Failed to load session data')
          return
        }

        // Find all upcoming sessions
        const now = new Date()
        const upcoming = data?.filter((session: TransformedSession) =>
          session.status === 'SCHEDULED' &&
          isAfter(new Date(session.startTime), now)
        ).sort((a: TransformedSession, b: TransformedSession) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        ) || []

        setUpcomingSessions(upcoming)
      } catch (error) {
        console.error('[FETCH_SESSIONS_ERROR]', error)
        toast.error('Failed to load session data')
      } finally {
        setIsLoadingSession(false)
      }
    }

    loadGoals()
    loadSessions()
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
              ) : upcomingSessions.length > 0 ? (
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
                      <Link href="/dashboard/mentee/browse-coaches?focus=BUSINESS_DEVELOPMENT">
                        <span className="hidden sm:inline">Sales</span>
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" className="w-full hover:bg-primary/5 px-2 sm:px-4" asChild>
                      <Link href="/dashboard/mentee/browse-coaches?focus=SOCIAL_MEDIA">
                        <span className="hidden sm:inline">Marketing</span>
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" className="w-full hover:bg-primary/5 px-2 sm:px-4" asChild>
                      <Link href="/dashboard/mentee/browse-coaches?focus=INVESTOR">
                        <span className="hidden sm:inline">Investing</span>
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
                  <Link href={`/dashboard/mentee/browse-coaches${currentGoal ? '?focus=' + getCoachFocusForGoal(currentGoal.type as GoalType) : ''}`}>
                    <div className="flex items-center gap-2">
                      <span>Find a Coach</span>
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
                        {upcomingSessions.length > 0 ? "1" : "0"} / 2 completed
                      </span>
                    </div>
                    <Progress value={upcomingSessions.length > 0 ? 50 : 0} className="h-2 [&>div]:bg-green-500 bg-green-100" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-foreground">Coaching Hours</span>
                      <span className="font-medium">
                        {upcomingSessions.length > 0 ? "1" : "0"} / 1 hr
                      </span>
                    </div>
                    <Progress value={upcomingSessions.length > 0 ? 100 : 0} className="h-2 [&>div]:bg-green-500 bg-green-100" />
                  </div>
                </div>
                <Button
                  className="w-full h-10 bg-green-500 hover:bg-green-600 text-white transition-colors mt-4"
                  asChild
                >
                  <Link href="/dashboard/mentee/sessions">
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
                Team Integration
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
            <div className="max-h-[320px] overflow-y-auto pr-1">
              {isLoadingSession ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : upcomingSessions.length === 0 ? (
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
                <div className="space-y-3">
                  {/* Show all real upcoming sessions */}
                  {upcomingSessions.map(session => (
                    <SessionCard key={session.ulid} session={session} />
                  ))}
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
              <Link href="/dashboard/mentee/goals">
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
                    <Link href="/dashboard/mentee/goals">
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
