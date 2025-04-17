"use client"
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Target, Clock, ArrowUpRight, TrendingUp, DollarSign, Star, MessageSquare, Zap, BookOpen, Award, CalendarRange, AlertOctagon, Video, Calendar, Share2, Facebook, Twitter, Linkedin, Copy, X, Home, ChevronLeft, ChevronRight, Briefcase, Settings, Globe, Trophy, CreditCard, BarChart4, ArrowUpDown, FileText, Wallet } from "lucide-react"
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DEFAULT_AVATARS } from '@/utils/constants'
import { useEffect, useState } from 'react'
import { fetchCoachDashboardStats, CoachDashboardStats, fetchTopMentees } from '@/utils/actions/coach-dashboard-actions'
import { fetchUpcomingSessions } from '@/utils/actions/sessions'
import { fetchCoachAnalytics, type CoachAnalytics } from '@/utils/actions/analytics'
import { TransformedSession } from '@/utils/types/session'
import { TopMentee } from '@/utils/types/mentee'
import { format, isAfter } from 'date-fns'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client'
import { useCentralizedAuth } from '@/app/provider'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { fetchGoals } from "@/utils/actions/goals"
import type { ClientGoal } from "@/utils/types/goals"
import { Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

const DEFAULT_AVATAR = "https://utfs.io/f/[your-default-avatar-url]" // Replace with your default avatar URL

export default function CoachDashboard() {
  const [dashboardStats, setDashboardStats] = useState<CoachDashboardStats | null>(null)
  const [upcomingSessions, setUpcomingSessions] = useState<TransformedSession[]>([])
  const [topMentees, setTopMentees] = useState<TopMentee[]>([])
  const [goals, setGoals] = useState<ClientGoal[]>([])
  const [currentGoalIndex, setCurrentGoalIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingSessions, setIsLoadingSessions] = useState(true)
  const [isLoadingTopMentees, setIsLoadingTopMentees] = useState(true)
  const [isLoadingGoal, setIsLoadingGoal] = useState(true)
  const [topMenteesTimeframe, setTopMenteesTimeframe] = useState<'90days' | 'allTime'>('90days')
  const [coachProfileId, setCoachProfileId] = useState<string | null>(null)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [analyticsData, setAnalyticsData] = useState<CoachAnalytics | null>(null)
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true)
  const { authData } = useCentralizedAuth()
  const { userUlid } = authData || {}

  const currentGoal = goals[currentGoalIndex]

  const navigateGoal = (direction: 'next' | 'prev') => {
    if (direction === 'next' && currentGoalIndex < goals.length - 1) {
      setCurrentGoalIndex(currentGoalIndex + 1)
    } else if (direction === 'prev' && currentGoalIndex > 0) {
      setCurrentGoalIndex(currentGoalIndex - 1)
    }
  }

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
        return <Users className="h-3 w-3" />
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

  // Function to handle sharing coaching service
  const handleShareCoachingService = async () => {
    try {
      if (!coachProfileId) {
        // If we don't have the coach profile ID yet, fetch it
        const supabase = createClient()
        const { data, error } = await supabase
          .from('CoachProfile')
          .select('ulid')
          .eq('userUlid', userUlid || '')
          .single()
          
        if (error || !data) {
          console.error('[SHARE_ERROR]', error)
          toast.error('Unable to share your profile. Please try again.')
          return
        }
        
        setCoachProfileId(data.ulid)
      }
      
      // Open the share dialog
      setIsShareDialogOpen(true)
    } catch (error) {
      console.error('[SHARE_ERROR]', error)
      toast.error('Unable to share your profile. Please try again.')
    }
  }
  
  // Function to share on a specific platform
  const shareOnPlatform = (platform: string) => {
    if (!coachProfileId) return;
    
    const shareText = "I'm offering coaching services on Dibs! Check out my profile and book a session with me.";
    // Use the custom slug if available, otherwise use the profile ID
    const profilePath = dashboardStats?.profileSlug || coachProfileId;
    const shareUrl = `${window.location.origin}/coaches/${profilePath}`;
    let shareLink = '';
    
    switch (platform) {
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'linkedin':
        shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent('My Coaching Service on Dibs')}&summary=${encodeURIComponent(shareText)}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        toast.success('Link copied to clipboard!');
        return;
      default:
        return;
    }
    
    window.open(shareLink, '_blank');
    setIsShareDialogOpen(false);
  };

  useEffect(() => {
    // Prevent data fetching if user is not authenticated
    if (!userUlid) {
      // Optionally clear state or set loading to false if needed
      // setIsLoading(false);
      // setIsLoadingSessions(false);
      // ... etc. ...
      // setDashboardStats(null);
      // setUpcomingSessions([]);
      // ... etc. ...
      return; 
    }

    const loadDashboardStats = async () => {
      try {
        setIsLoading(true)
        const result = await fetchCoachDashboardStats({})
        
        if (result.error) {
          if (result.error.message) {
            console.error('[DASHBOARD_ERROR]', result.error)
            toast.error('Failed to load dashboard data')
          }
          return
        }
        
        setDashboardStats(result.data)
        
        // Try to get coach profile ID
        if (result.data && userUlid) {
          const supabase = createClient()
          const { data, error } = await supabase
            .from('CoachProfile')
            .select('ulid')
            .eq('userUlid', userUlid)
            .single()
            
          if (!error && data) {
            setCoachProfileId(data.ulid)
          }
        }
      } catch (error) {
        console.error('[DASHBOARD_ERROR]', error)
        if (error instanceof Error && error.message !== 'No data available') {
          toast.error('Failed to load dashboard data')
        }
      } finally {
        setIsLoading(false)
      }
    }

    const loadUpcomingSessions = async () => {
      try {
        setIsLoadingSessions(true)
        const result = await fetchUpcomingSessions({})
        
        if (result.error) {
          console.error('[UPCOMING_SESSIONS_ERROR]', result.error)
          return
        }
        
        setUpcomingSessions(result.data || [])
      } catch (error) {
        console.error('[UPCOMING_SESSIONS_ERROR]', error)
      } finally {
        setIsLoadingSessions(false)
      }
    }

    const loadTopMentees = async () => {
      try {
        setIsLoadingTopMentees(true)
        
        const result = await fetchTopMentees({
          timeframe: topMenteesTimeframe,
          limit: 5
        })
        
        if (result.error) {
          console.error('[TOP_MENTEES_ERROR]', result.error)
          return
        }
        
        setTopMentees(result.data || [])
      } catch (error) {
        console.error('[TOP_MENTEES_ERROR]', error)
      } finally {
        setIsLoadingTopMentees(false)
      }
    }

    const loadGoals = async () => {
      try {
        setIsLoadingGoal(true)
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
    
    const loadAnalyticsData = async () => {
      try {
        setIsLoadingAnalytics(true)
        const result = await fetchCoachAnalytics({})
        
        if (result.error) {
          console.error('[ANALYTICS_ERROR]', result.error)
          return
        }
        
        setAnalyticsData(result.data)
      } catch (error) {
        console.error('[ANALYTICS_ERROR]', error)
      } finally {
        setIsLoadingAnalytics(false)
      }
    }

    loadDashboardStats()
    loadUpcomingSessions()
    loadTopMentees()
    loadGoals()
    loadAnalyticsData()
  }, [userUlid, topMenteesTimeframe])

  return (
    <div className="flex flex-col justify-center items-start flex-wrap px-4 pt-4 gap-4">
      {/* Share Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Your Coaching Service</DialogTitle>
            <DialogDescription>
              Share your coaching profile on social media to attract new mentees.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-4 gap-4 py-4">
            <Button 
              variant="outline" 
              className="flex flex-col items-center justify-center h-20"
              onClick={() => shareOnPlatform('twitter')}
            >
              <Twitter className="h-8 w-8 mb-1 text-[#1DA1F2]" />
              <span className="text-xs">Twitter</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex flex-col items-center justify-center h-20"
              onClick={() => shareOnPlatform('facebook')}
            >
              <Facebook className="h-8 w-8 mb-1 text-[#1877F2]" />
              <span className="text-xs">Facebook</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex flex-col items-center justify-center h-20"
              onClick={() => shareOnPlatform('linkedin')}
            >
              <Linkedin className="h-8 w-8 mb-1 text-[#0A66C2]" />
              <span className="text-xs">LinkedIn</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex flex-col items-center justify-center h-20"
              onClick={() => shareOnPlatform('copy')}
            >
              <Copy className="h-8 w-8 mb-1" />
              <span className="text-xs">Copy Link</span>
            </Button>
          </div>
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={() => setIsShareDialogOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Actions */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Button onClick={handleShareCoachingService}>
            <Share2 className="mr-2 h-4 w-4" />
            Share Your Coaching Service
          </Button>
          <Button variant="outline">
            <DollarSign className="mr-2 h-4 w-4" />
            Request Early Payout
          </Button>
          <Button variant="outline">
            <CalendarRange className="mr-2 h-4 w-4" />
            Reschedule Upcoming
          </Button>
          <Button variant="outline">
            <AlertOctagon className="mr-2 h-4 w-4 text-red-500" />
            Emergency Cancel
          </Button>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 w-full">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[52px] flex items-center">
                <div className="h-4 w-16 bg-gray-200 animate-pulse rounded"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{dashboardStats?.totalClients || 0}</div>
                {dashboardStats?.totalClients === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No clients yet. Start by scheduling sessions!
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {dashboardStats?.newClientsThisMonth 
                      ? `${dashboardStats.newClientsThisMonth} new this month` 
                      : 'No new clients this month'}
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[52px] flex items-center">
                <div className="h-4 w-16 bg-gray-200 animate-pulse rounded"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">${dashboardStats?.revenue.toLocaleString() || 0}</div>
                {dashboardStats?.revenue === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Complete sessions to start earning
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {dashboardStats?.revenueGrowth !== undefined ? (
                      dashboardStats.revenueGrowth > 0 ? 
                        `+${dashboardStats.revenueGrowth}% from last month` : 
                        `${dashboardStats.revenueGrowth}% from last month`
                    ) : 'No data available'}
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mentee Retention</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[52px] flex items-center">
                <div className="h-4 w-16 bg-gray-200 animate-pulse rounded"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {dashboardStats?.menteeRetention.percentage || 0}%
                  <span className="text-xs text-muted-foreground ml-2">
                    ({dashboardStats?.menteeRetention.count || 0}/{dashboardStats?.menteeRetention.total || 0})
                  </span>
                </div>
                {dashboardStats?.menteeRetention.total === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Complete sessions to see retention data
                  </p>
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground">
                      Mentees booking 3+ sessions
                    </p>
                    {dashboardStats?.newClientsThisMonth ? (
                      <p className="text-xs text-emerald-500 mt-1">
                        +{dashboardStats.newClientsThisMonth} mentees this month
                      </p>
                    ) : null}
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[52px] flex items-center">
                <div className="h-4 w-16 bg-gray-200 animate-pulse rounded"></div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold">{dashboardStats?.rating || 0}/5</div>
                  {dashboardStats?.reviewCount === 0 && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                      New Coach
                    </span>
                  )}
                </div>
                {dashboardStats?.reviewCount === 0 ? (
                  <p className="text-xs text-muted-foreground mt-1">
                    No reviews yet. Complete sessions to get rated!
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Based on {dashboardStats?.reviewCount || 0} reviews
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 sm:grid-cols-1 w-full gap-3">
        <Card>
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Upcoming Sessions</CardTitle>
              <CardDescription>Scheduled coaching sessions for the next 7 days</CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
              <Link href="/dashboard/coach/sessions">
                View All
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div style={{ maxHeight: "320px", overflowY: "auto" }}>
              {isLoadingSessions ? (
                <div className="flex flex-col space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <div className="h-9 w-9 rounded-full bg-gray-200 animate-pulse" />
                      <div className="space-y-2 flex-1">
                        <div className="h-4 w-24 bg-gray-200 animate-pulse rounded" />
                        <div className="h-3 w-32 bg-gray-200 animate-pulse rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : upcomingSessions.length > 0 ? (
                <div className="space-y-6">
                  {upcomingSessions.map((session) => (
                    <div key={session.ulid} className="flex items-center">
                      <Avatar className="h-9 w-9">
                        <AvatarImage 
                          src={session.otherParty.profileImageUrl || DEFAULT_AVATARS.PLACEHOLDER} 
                          alt={`${session.otherParty.firstName || ''} ${session.otherParty.lastName || ''}`}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = DEFAULT_AVATARS.PLACEHOLDER;
                            target.onerror = null;
                          }}
                        />
                        <AvatarFallback>
                          {session.otherParty.firstName?.[0] || ''}
                          {session.otherParty.lastName?.[0] || ''}
                        </AvatarFallback>
                      </Avatar>
                      <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {session.otherParty.firstName || ''} {session.otherParty.lastName || ''}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{format(new Date(session.startTime), 'EEEE')} at {format(new Date(session.startTime), 'h:mm a')}</span>
                          <span>•</span>
                          <span>{session.durationMinutes} min session</span>
                        </div>
                      </div>
                      {session.zoomMeetingUrl && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="ml-auto"
                          asChild
                        >
                          <Link href={session.zoomMeetingUrl} target="_blank">
                            <Video className="h-4 w-4" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                  <p className="text-sm font-medium">No upcoming sessions</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Share your coaching service to attract new mentees
                  </p>
                  <Button className="mt-4" size="sm" onClick={handleShareCoachingService}>
                    <Share2 className="mr-2 h-4 w-4" />
                    Share Your Coaching Service
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <div className="flex items-center gap-4">
                <CardTitle>Top Mentees</CardTitle>
                <Select 
                  defaultValue="90days" 
                  onValueChange={(value) => setTopMenteesTimeframe(value as 'allTime' | '90days')}
                >
                  <SelectTrigger className="w-[130px] h-8 text-xs">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="90days">Last 90 Days</SelectItem>
                    <SelectItem value="allTime">All Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <CardDescription>Your most engaged and valuable mentees</CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
              <Link href="/dashboard/coach/crm">
                View All
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div style={{ maxHeight: "320px", overflowY: "auto" }}>
              {isLoadingTopMentees ? (
                <div className="flex flex-col space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <div className="h-9 w-9 rounded-full bg-gray-200 animate-pulse" />
                      <div className="space-y-2 flex-1">
                        <div className="h-4 w-24 bg-gray-200 animate-pulse rounded" />
                        <div className="h-3 w-32 bg-gray-200 animate-pulse rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : topMentees.length > 0 ? (
                <div className="space-y-6">
                  {topMentees.map((mentee) => (
                    <div key={mentee.ulid} className="flex items-center">
                      <Avatar className="h-9 w-9">
                        <AvatarImage 
                          src={mentee.profileImageUrl || DEFAULT_AVATARS.PLACEHOLDER} 
                          alt={`${mentee.firstName || ''} ${mentee.lastName || ''}`}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = DEFAULT_AVATARS.PLACEHOLDER;
                            target.onerror = null;
                          }}
                        />
                        <AvatarFallback>
                          {mentee.firstName?.[0] || ''}
                          {mentee.lastName?.[0] || ''}
                        </AvatarFallback>
                      </Avatar>
                      <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {mentee.firstName || ''} {mentee.lastName || ''}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{mentee.sessionsCompleted} sessions completed</span>
                          <span>•</span>
                          <span className="text-emerald-500">
                            {mentee.revenue >= 1000 
                              ? `$${(mentee.revenue / 1000).toFixed(1)}k revenue` 
                              : `$${mentee.revenue.toFixed(0)} revenue`}
                          </span>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="ml-auto"
                        asChild
                      >
                        <Link href={`/dashboard/coach/clients?menteeId=${mentee.ulid}`}>
                          <MessageSquare className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                  <p className="text-sm font-medium">No mentee data available</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Complete coaching sessions to see your top performing mentees
                  </p>
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
              <Link href="/dashboard/coach/profile?tab=goals">
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
                    Setting clear goals helps you track progress and achieve success in your coaching career.
                  </p>
                  <Button asChild variant="outline" className="hover:scale-105 transition-transform">
                    <Link href="/dashboard/coach/profile?tab=goals">
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

        <Card>
          <CardHeader className="flex flex-row items-center pb-3">
            <div className="grid gap-1.5">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Financial Overview
              </CardTitle>
              <CardDescription>
                Detailed revenue and payment tracking
              </CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1 hover:scale-105 transition-transform bg-primary hover:bg-primary/90">
              <Link href="/dashboard/coach/finances">
                View All
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-2">
            <div style={{ maxHeight: '320px', overflowY: 'auto' }} className="pr-2">
              {isLoading || isLoadingAnalytics ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {/* Payment Status */}
                  <div className="mb-6">
                    <h3 className="text-sm font-medium flex items-center mb-3">
                      <Wallet className="h-4 w-4 mr-2 text-primary" />
                      Payment Status
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-muted/30 rounded-lg hover:bg-muted/40 transition-colors">
                        <div className="text-xs text-muted-foreground">Pending Payout</div>
                        <div className="text-2xl font-semibold mt-1.5 flex items-baseline">
                          <span className="text-base mr-0.5">$</span>
                          <span>{analyticsData?.availableBalance || 0}</span>
                        </div>
                      </div>
                      <div className="p-3 bg-muted/30 rounded-lg hover:bg-muted/40 transition-colors">
                        <div className="text-xs text-muted-foreground">Next Payment</div>
                        <div className="text-2xl font-semibold mt-1.5">
                          {analyticsData?.nextPayoutDate ? format(new Date(analyticsData.nextPayoutDate), 'MMM d') : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Monthly Revenue Comparison */}
                  <div>
                    <h3 className="text-sm font-medium flex items-center mb-3">
                      <TrendingUp className="h-4 w-4 mr-2 text-primary" />
                      Monthly Performance
                    </h3>
                    <div className="p-3.5 bg-muted/30 rounded-lg hover:bg-muted/40 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Current Month</div>
                            <div className="text-2xl font-semibold flex items-baseline">
                              <span className="text-base mr-0.5">$</span>
                              <span>{analyticsData?.recentEarningsTotal || 0}</span>
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Total Revenue</div>
                            <div className="text-2xl font-semibold flex items-baseline">
                              <span className="text-base mr-0.5">$</span>
                              <span>{analyticsData?.totalEarnings || 0}</span>
                            </div>
                          </div>
                        </div>
                        <div className={`text-sm font-medium px-2 py-1 rounded ${dashboardStats?.revenueGrowth && dashboardStats.revenueGrowth > 0 ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'}`}>
                          <div className="flex items-center">
                            <ArrowUpDown className="h-4 w-4 mr-1" />
                            {dashboardStats?.revenueGrowth ? Math.abs(dashboardStats.revenueGrowth) : 0}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

