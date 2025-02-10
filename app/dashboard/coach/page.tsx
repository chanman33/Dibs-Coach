"use client"
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Target, Clock, ArrowUpRight, TrendingUp, DollarSign, Star, MessageSquare, Zap, BookOpen, Award, CalendarRange, AlertOctagon, Video } from "lucide-react"
import { withRole } from "@/components/wrapper/with-role"
import { ROLES } from "@/utils/roles/roles"
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

const DEFAULT_AVATAR = "https://utfs.io/f/[your-default-avatar-url]" // Replace with your default avatar URL

function CoachDashboard() {
  return (
    <div className="flex flex-col justify-center items-start flex-wrap px-4 pt-4 gap-4">
      {/* Quick Actions */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Button>
            <Clock className="mr-2 h-4 w-4" />
            Schedule Session
          </Button>
          <Button variant="outline" className="relative">
            <MessageSquare className="mr-2 h-4 w-4" />
            View Unread Messages
            <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
              3
            </span>
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
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">3 new this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$4,250</div>
            <p className="text-xs text-muted-foreground">+18% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mentee Retention</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              45%
              <span className="text-xs text-muted-foreground ml-2">
                (9/20)
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Mentees booking 3+ sessions
            </p>
            <p className="text-xs text-emerald-500 mt-1">
              +3 mentees this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.8/5</div>
            <p className="text-xs text-muted-foreground">Based on 56 reviews</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 sm:grid-cols-1 w-full gap-3">
        <Card>
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Upcoming Sessions</CardTitle>
              <CardDescription>Your scheduled coaching sessions for the next 7 days</CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
              <Link href="/dashboard-coach/sessions">
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
                        target.onerror = null; // Prevents infinite loop if default image also fails
                      }}

                    />
                    <AvatarFallback>JS</AvatarFallback>
                  </Avatar>
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">John Smith</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Today at 2:00 PM</span>
                      <span>•</span>
                      <span>60 min session</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="ml-auto">
                    <Video className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center">
                  <Avatar className="h-9 w-9">
                    <AvatarImage 
                      src={DEFAULT_AVATARS.COACH} 
                      alt="Avatar"

                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = DEFAULT_AVATAR;
                        target.onerror = null; // Prevents infinite loop if default image also fails
                      }}
                    />
                    <AvatarFallback>AW</AvatarFallback>
                  </Avatar>
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">Amanda Wilson</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Tomorrow at 10:00 AM</span>
                      <span>•</span>
                      <span>30 min session</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="ml-auto">
                    <Video className="h-4 w-4" />
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
                        target.onerror = null; // Prevents infinite loop if default image also fails
                      }}
                    />
                    <AvatarFallback>RK</AvatarFallback>
                  </Avatar>
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">Robert Kim</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Thursday at 3:30 PM</span>
                      <span>•</span>
                      <span>45 min session</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="ml-auto">
                    <Video className="h-4 w-4" />
                  </Button>
                </div>
              </div>
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
              <Link href="/dashboard-coach/clients">
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
                        target.onerror = null; // Prevents infinite loop if default image also fails
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
                        target.onerror = null; // Prevents infinite loop if default image also fails
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
                        target.onerror = null; // Prevents infinite loop if default image also fails
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
      <Card className="w-full">
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
      </Card>

      {/* Educational Resources */}
      <Card className="w-full">
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
      </Card>
    </div>
  )
}
export default withRole(CoachDashboard, [ROLES.COACH])

