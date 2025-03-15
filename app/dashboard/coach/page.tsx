"use client"
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Target, Clock, ArrowUpRight, TrendingUp, DollarSign, Star, MessageSquare, Zap, BookOpen, Award, CalendarRange, AlertOctagon, Video, Calendar, Share2, Facebook, Twitter, Linkedin, Copy, X } from "lucide-react"
import { WithAuth } from "@/components/auth/with-auth"
import { USER_CAPABILITIES } from "@/utils/roles/roles"
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
import { fetchCoachDashboardStats, CoachDashboardStats } from '@/utils/actions/coach-dashboard-actions'
import { fetchUpcomingSessions } from '@/utils/actions/sessions'
import { TransformedSession } from '@/utils/types/session'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client'
import { useAuthContext } from '@/components/auth/providers'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const DEFAULT_AVATAR = "https://utfs.io/f/[your-default-avatar-url]" // Replace with your default avatar URL

function CoachDashboard() {
  const [dashboardStats, setDashboardStats] = useState<CoachDashboardStats | null>(null)
  const [upcomingSessions, setUpcomingSessions] = useState<TransformedSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingSessions, setIsLoadingSessions] = useState(true)
  const [coachProfileId, setCoachProfileId] = useState<string | null>(null)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const { userUlid } = useAuthContext()

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
    const shareUrl = window.location.origin + "/coaches/" + coachProfileId;
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

    loadDashboardStats()
    loadUpcomingSessions()
  }, [])

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
          {/* <Button variant="outline" className="relative">
            <MessageSquare className="mr-2 h-4 w-4" />
            View Unread Messages
            <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
              3
            </span>
          </Button> */}
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
                <Select defaultValue="90days">
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
              <Link href="/dashboard/coach/clients">
                View All
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div style={{ maxHeight: "320px", overflowY: "auto" }}>
              <div className="space-y-6">
                <div className="flex items-center">
                <Avatar className="h-9 w-9">
                    <AvatarImage 
                      src={DEFAULT_AVATARS.COACH} 
                      alt="Avatar"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = DEFAULT_AVATARS.PLACEHOLDER;
                        target.onerror = null;
                      }}
                    />
                    <AvatarFallback>RK</AvatarFallback>
                  </Avatar>
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">Sarah Johnson</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>12 sessions completed</span>
                      <span>•</span>
                      <span className="text-emerald-500">$2.4k revenue</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="ml-auto">
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center">
                  <Avatar className="h-9 w-9">
                    <AvatarImage 
                      src={DEFAULT_AVATARS.COACH} 
                      alt="Avatar"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = DEFAULT_AVATARS.PLACEHOLDER;
                        target.onerror = null;
                      }}
                    />
                    <AvatarFallback>RK</AvatarFallback>
                  </Avatar>
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">Michael Rodriguez</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>8 sessions completed</span>
                      <span>•</span>
                      <span className="text-emerald-500">$1.6k revenue</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="ml-auto">
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center">
                  <Avatar className="h-9 w-9">
                    <AvatarImage 
                      src={DEFAULT_AVATARS.COACH} 
                      alt="Avatar"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = DEFAULT_AVATARS.PLACEHOLDER;
                        target.onerror = null;
                      }}
                    />
                    <AvatarFallback>EL</AvatarFallback>
                  </Avatar>
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">Emma Liu</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>7 sessions completed</span>
                      <span>•</span>
                      <span className="text-emerald-500">$1.4k revenue</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="ml-auto">
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* News & Updates Section */}
      {/* <Card className="w-full">
        <CardHeader>
          <CardTitle>News & Updates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Tip of the Day</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  "Help your clients create a strong online presence. Encourage them to regularly update their social
                  media with local market insights."
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Latest Market Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  "Eco-friendly homes are gaining popularity. 68% of millennials prefer energy-efficient features in
                  their homes."
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Your Achievements</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center">
                <Award className="h-9 w-9 text-yellow-500 mr-2" />
                <div>
                  <p className="text-sm font-medium">Top Coach of the Month</p>
                  <p className="text-xs text-muted-foreground">2 months streak!</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card> */}

      {/* Educational Resources */}
      {/* <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Library & Resources</CardTitle>
          <Button variant="ghost" size="sm">
            <BookOpen className="mr-2 h-4 w-4" />
            View Library
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium">Advanced Negotiation Techniques</p>
                <p className="text-xs text-muted-foreground">Webinar • 45 mins</p>
              </div>
              <Button variant="outline" size="sm">
                Watch
              </Button>
            </div>
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium">Mastering Social Media for Real Estate</p>
                <p className="text-xs text-muted-foreground">Article • 10 min read</p>
              </div>
              <Button variant="outline" size="sm">
                Read
              </Button>
            </div>
          </div>
        </CardContent>
      </Card> */}
    </div>
  )
}

export default WithAuth(CoachDashboard, {
  requiredCapabilities: [USER_CAPABILITIES.COACH]
});

