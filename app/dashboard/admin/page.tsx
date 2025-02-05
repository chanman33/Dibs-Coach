"use client"

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { withRole } from "@/components/wrapper/with-role"
import { ROLES } from "@/utils/roles/roles"
import { 
  Users, 
  UserCheck,
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  RefreshCw,
  ArrowUpRight,
} from "lucide-react"
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { fetchAdminMetrics, refreshDashboardData } from '@/utils/actions/admin-actions'
import { AdminMetrics } from '@/utils/types/admin'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDistanceToNow } from 'date-fns'

function AdminDashboard() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const loadMetrics = async () => {
    try {
      setLoading(true)
      const { data, error } = await fetchAdminMetrics()
      if (error) throw error
      setMetrics(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metrics')
      console.error('[METRICS_LOAD_ERROR]', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    try {
      setRefreshing(true)
      await refreshDashboardData()
      await loadMetrics()
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadMetrics()
    // Set up polling every 5 minutes
    const interval = setInterval(loadMetrics, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <AlertTriangle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold">Failed to load dashboard</h2>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={loadMetrics}>Try Again</Button>
      </div>
    )
  }

  return (
    <div className='flex flex-col justify-center items-start flex-wrap px-4 pt-4 gap-4'>
      {/* Header with Refresh */}
      <div className="w-full flex justify-between items-center">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={refreshing || loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="w-full">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="flex gap-2 flex-wrap">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/admin/user-mgmt">
              Manage Users
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/admin/coach-applications">
              Review Applications ({metrics?.pendingCoaches ?? '...'})
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/admin/analytics/reports">
              View Reports
            </Link>
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 w-full">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-12 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{metrics?.totalUsers.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics?.activeUsers} active users
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Coaches</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-12 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{metrics?.activeCoaches}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics?.pendingCoaches} pending applications
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-12 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">${metrics?.monthlyRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  ${metrics?.totalRevenue.toLocaleString()} total revenue
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-12 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{metrics?.totalSessions}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics?.completedSessions} completed
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center">
          <div className="grid gap-2">
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest system and user activities
            </CardDescription>
          </div>
          <Button asChild size="sm" className="ml-auto gap-1">
            <Link href="/dashboard/admin/monitoring">
              View All
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center">
                    <div className="ml-4 space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Activity items will be populated from AdminActivity table */}
                <p className="text-sm text-muted-foreground">No recent activity to display</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default withRole(AdminDashboard, [ROLES.ADMIN])

