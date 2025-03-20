"use client"
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Target, CalendarClock, GraduationCap, AlertCircle } from "lucide-react"
import Link from 'next/link'
import { RouteGuardProvider } from "@/components/auth/RouteGuardContext"
import { BusinessStats } from '@/components/business-portal/BusinessStats'
import { RecentCoachingSessions } from '@/components/business-portal/RecentCoachingSessions'
import { UpcomingTrainings } from '@/components/business-portal/UpcomingTrainings'

export default function BusinessDashboard() {
  return (
    <RouteGuardProvider required="business-dashboard">
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
        <BusinessStats />

        {/* Dashboard content sections */}
        <div className="grid md:grid-cols-2 sm:grid-cols-1 w-full gap-4">
          {/* Recent Coaching Sessions */}
          <RecentCoachingSessions />

          {/* Upcoming Training */}
          <UpcomingTrainings />
        </div>
      </div>
    </RouteGuardProvider>
  )
}

