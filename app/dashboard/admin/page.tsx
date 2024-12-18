"use client"
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { withRole } from "@/components/wrapper/with-role"
import { ROLES } from "@/utils/roles/roles"
import { BarChart, Users, Building2, ActivitySquare, ArrowUpRight } from "lucide-react"
import Link from 'next/link'

function AdminDashboard() {
  return (
    <div className='flex flex-col justify-center items-start flex-wrap px-4 pt-4 gap-4'>
      <Card className='w-[20rem]'>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            System Overview
          </CardTitle>
          <ActivitySquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">99.9%</div>
          <p className="text-xs text-muted-foreground">
            System Uptime
          </p>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 w-full">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Properties</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">845</div>
            <p className="text-xs text-muted-foreground">Across all realtors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">99.9%</div>
            <p className="text-xs text-muted-foreground">Uptime this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <ActivitySquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">284</div>
            <p className="text-xs text-muted-foreground">Actions today</p>
          </CardContent>
        </Card>
      </div>

      <div className='grid md:grid-cols-2 sm:grid-cols-1 w-full gap-3'>
        <Card>
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest system and user activities
              </CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
              <Link href="/dashboard-admin/activity">
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
                    <p className="text-sm font-medium leading-none">New User Registration</p>
                    <p className="text-sm text-muted-foreground">john.doe@example.com</p>
                  </div>
                  <div className="ml-auto font-medium">2 min ago</div>
                </div>
                <div className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">Property Update</p>
                    <p className="text-sm text-muted-foreground">123 Main St modified</p>
                  </div>
                  <div className="ml-auto font-medium">15 min ago</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>System Notifications</CardTitle>
              <CardDescription>
                Important system updates and alerts
              </CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
              <Link href="/dashboard-admin/notifications">
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
                    <p className="text-sm font-medium leading-none">Database Backup</p>
                    <p className="text-sm text-muted-foreground">Completed successfully</p>
                  </div>
                  <div className="ml-auto font-medium">Success</div>
                </div>
                <div className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">System Update</p>
                    <p className="text-sm text-muted-foreground">Version 2.1.0 available</p>
                  </div>
                  <div className="ml-auto font-medium">Pending</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default withRole(AdminDashboard, [ROLES.ADMIN])
