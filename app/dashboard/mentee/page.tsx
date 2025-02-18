'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { withRole } from "@/components/wrapper/with-role"
import { USER_CAPABILITIES } from "@/utils/roles/roles"
import { Users, Target, Clock, TrendingUp, ArrowUpRight, Trophy } from "lucide-react"
import Link from 'next/link'
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

function MenteeDashboard() {
  return (
    <div className='space-y-6 p-6'>
      {/* Quick Action Center */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">Book Your Next Session</CardTitle>
            <CardDescription>
              Schedule your next coaching session
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">
              Schedule Now
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardHeader>
            <CardTitle className="text-lg">Weekly Progress</CardTitle>
            <CardDescription>
              You're ahead of 75% of peers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Progress value={75} className="flex-1" />
              <span className="text-sm font-medium">75%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardHeader>
            <CardTitle className="text-lg">Premium Features</CardTitle>
            <CardDescription>
              Access advanced tools & resources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              View Features
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Achievement Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Growth Journey</CardTitle>
              <Badge variant="outline">Level 3</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Experience Points</span>
                    <span className="text-sm">750/1000</span>
                  </div>
                  <Progress value={75} />
                </div>
              </div>
              <div className="flex gap-2">
                <Badge variant="secondary">🎯 Goal Setter</Badge>
                <Badge variant="secondary">💫 Rising Star</Badge>
                <Badge variant="secondary">🤝 Networker</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Next Milestones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium">First $1M in Sales</h4>
                  <p className="text-sm text-muted-foreground">$750,000 to go</p>
                  <Progress value={25} className="mt-2" />
                </div>
              </div>
            </div>
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
              <Link href="/dashboard/sessions">
                View All
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
              <div className="space-y-8">
                <div className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">Career Development Session</p>
                    <p className="text-sm text-muted-foreground">Tomorrow at 3:00 PM</p>
                  </div>
                  <div className="ml-auto font-medium">Coach Smith</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Current Goals</CardTitle>
              <CardDescription>
                Track your progress
              </CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
              <Link href="/dashboard/goals">
                View All
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
              <div className="space-y-8">
                <div className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">Complete Market Analysis</p>
                    <p className="text-sm text-muted-foreground">75% Complete</p>
                  </div>
                  <div className="ml-auto font-medium">Due in 5 days</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Simple role check using withRole HOC
export default withRole(MenteeDashboard, {
  requiredCapabilities: [USER_CAPABILITIES.MENTEE],
  requireAll: true
}); 