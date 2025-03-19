"use client"
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Target, ArrowUpRight, Calendar, DollarSign, Star, CalendarClock, GraduationCap, AlertCircle } from "lucide-react"
import { PERMISSIONS } from "@/utils/roles/roles"
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DEFAULT_AVATARS } from '@/utils/constants'
import { useEffect, useState } from "react"
import { useOrganization } from "@/utils/auth/OrganizationContext"
import { useAuthContext } from "@/components/auth/providers"
import { hasPermission } from "@/utils/roles/roles"
import { useRouter } from "next/navigation"
import { ContainerLoading } from "@/components/loading"

export default function BusinessDashboard() {
  const { organizationRole, isLoading } = useOrganization()
  const authContext = useAuthContext()
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

  // Check for organization analytics permission
  useEffect(() => {
    // Skip if still loading or user is not authenticated
    if (isLoading) return
    
    // Check permission
    const effectiveContext = {
      ...authContext,
      orgRole: authContext.orgRole || (organizationRole as any) || undefined,
      orgLevel: authContext.orgLevel || (organizationRole ? 'LOCAL' : undefined)
    }
    
    const hasAnalyticsAccess = hasPermission(effectiveContext, PERMISSIONS.VIEW_ORG_ANALYTICS)
    console.log("[BUSINESS_PAGE] Analytics permission check:", { 
      hasAnalyticsAccess,
      orgRole: effectiveContext.orgRole 
    })
    
    setIsAuthorized(hasAnalyticsAccess)
  }, [authContext, organizationRole, isLoading])
  
  // Handle unauthorized users
  useEffect(() => {
    if (isAuthorized === false) {
      router.push('/not-authorized?message=You%20need%20organization%20analytics%20permission')
    }
  }, [isAuthorized, router])
  
  // Show loading while checking permissions
  if (isLoading || isAuthorized === null) {
    return (
      <ContainerLoading 
        message="Loading dashboard..." 
        spinnerSize="md"
        minHeight="h-full"
      />
    )
  }
  
  // Dashboard UI - only renders if authorized
  return (
    <div className="flex flex-col justify-center items-start flex-wrap px-4 pt-4 gap-4">
      {/* Business Overview */}
      <div className="w-full">
        <h1 className="text-2xl font-bold mb-2">Business Dashboard</h1>
        <p className="text-muted-foreground mb-4">Welcome back! Here's an overview of your business operations.</p>
      </div>

      {/* Quick Actions */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Button asChild>
            <Link href="/dashboard/business/team/members">
              <Users className="mr-2 h-4 w-4" />
              Manage Team
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/business/coaching/sessions">
              <CalendarClock className="mr-2 h-4 w-4" />
              Schedule Coaching
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/business/performance/goals">
              <Target className="mr-2 h-4 w-4" />
              Set Goals
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/business/coaching/training">
              <GraduationCap className="mr-2 h-4 w-4" />
              Training Programs
            </Link>
          </Button>
          <Button asChild variant="outline" className="relative">
            <Link href="/dashboard/business/admin/billing">
              <AlertCircle className="mr-2 h-4 w-4 text-amber-500" />
              View Alerts
              <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center">
                2
              </span>
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 w-full">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">+3 this quarter</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active in Coaching</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
            <p className="text-xs text-muted-foreground">75% participation rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coaching Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$12,500</div>
            <p className="text-xs text-muted-foreground">42% utilized this quarter</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">Next 7 days</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 sm:grid-cols-1 w-full gap-4">
        {/* Recent Coaching Sessions */}
        <Card>
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Recent Coaching Sessions</CardTitle>
              <CardDescription>Latest team coaching activity</CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
              <Link href="/dashboard/business/coaching/sessions">
                View All
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div style={{ maxHeight: "320px", overflowY: "auto" }}>
              <div className="space-y-4">
                <div className="flex items-center">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={DEFAULT_AVATARS.COACH} alt="Avatar" />
                    <AvatarFallback>SJ</AvatarFallback>
                  </Avatar>
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">Sarah Johnson</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Listing Presentation Skills</span>
                      <span>•</span>
                      <span>Yesterday</span>
                    </div>
                  </div>
                  <div className="ml-auto text-xs text-muted-foreground">Completed</div>
                </div>

                <div className="flex items-center">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={DEFAULT_AVATARS.COACH} alt="Avatar" />
                    <AvatarFallback>MR</AvatarFallback>
                  </Avatar>
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">Michael Rodriguez</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Buyer Consultation</span>
                      <span>•</span>
                      <span>2 days ago</span>
                    </div>
                  </div>
                  <div className="ml-auto text-xs text-muted-foreground">Completed</div>
                </div>

                <div className="flex items-center">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={DEFAULT_AVATARS.COACH} alt="Avatar" />
                    <AvatarFallback>AW</AvatarFallback>
                  </Avatar>
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">Alex Wong</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Market Analysis</span>
                      <span>•</span>
                      <span>Mar 15, 2023</span>
                    </div>
                  </div>
                  <div className="ml-auto text-xs text-muted-foreground">Completed</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Training */}
        <Card>
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Upcoming Training</CardTitle>
              <CardDescription>Scheduled sessions and deadlines</CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
              <Link href="/dashboard/business/coaching/training">
                View All
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100">
                  <GraduationCap className="h-5 w-5 text-blue-700" />
                </div>
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium">New Team Member Orientation</p>
                  <p className="text-xs text-muted-foreground">Tomorrow, 10:00 AM • 2 new members</p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100">
                  <Calendar className="h-5 w-5 text-amber-700" />
                </div>
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium">License Renewal Workshop</p>
                  <p className="text-xs text-muted-foreground">Mar 22, 2023 • 5 attendees</p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100">
                  <Target className="h-5 w-5 text-green-700" />
                </div>
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium">Q2 Goal Setting Session</p>
                  <p className="text-xs text-muted-foreground">Mar 28, 2023 • All team members</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Performance */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Team Performance</CardTitle>
          <CardDescription>Key metrics and coaching impact</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {/* Coaching Program Effectiveness */}
            <div>
              <h3 className="text-sm font-medium mb-3">Coaching Program Effectiveness</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Participation Rate</span>
                    <span className="text-sm font-medium">75%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                    <div className="h-full w-[75%] bg-blue-500 rounded-full"></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Completion Rate</span>
                    <span className="text-sm font-medium">88%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                    <div className="h-full w-[88%] bg-green-500 rounded-full"></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Satisfaction Score</span>
                    <span className="text-sm font-medium">92%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                    <div className="h-full w-[92%] bg-amber-500 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Training Completion */}
            <div>
              <h3 className="text-sm font-medium mb-3">Training Program Completion</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">New Member Onboarding</span>
                    <span className="text-sm font-medium">100%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                    <div className="h-full w-full bg-blue-500 rounded-full"></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Continuing Education</span>
                    <span className="text-sm font-medium">65%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                    <div className="h-full w-[65%] bg-amber-500 rounded-full"></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Advanced Skills</span>
                    <span className="text-sm font-medium">42%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                    <div className="h-full w-[42%] bg-green-500 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts and Notices */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Alerts & Notices</CardTitle>
          <CardDescription>Important business information requiring attention</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Certification Renewal Alert</p>
                <p className="text-xs text-amber-700 mt-1">3 team members have credentials expiring in the next 30 days</p>
                <Button size="sm" variant="outline" className="mt-2 h-8 text-xs">View Details</Button>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">Training Deadline</p>
                <p className="text-xs text-blue-700 mt-1">Annual compliance training due by April 15th</p>
                <Button size="sm" variant="outline" className="mt-2 h-8 text-xs">Schedule Training</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

