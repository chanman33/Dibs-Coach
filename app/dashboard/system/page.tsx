"use client"

import { useEffect, useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SYSTEM_ROLES, PERMISSIONS } from '@/utils/roles/roles'
import { fetchDashboardData, refreshDashboardData } from '@/utils/actions/system-actions'
import { DashboardData, SystemAlert } from '@/utils/types/system'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  DollarSign, 
  Calendar, 
  RefreshCw, 
  Loader2, 
  Lock, 
  Activity, 
  BarChart 
} from 'lucide-react'

// Required role and permissions for this page
const requiredSystemRole = SYSTEM_ROLES.SYSTEM_OWNER
const requiredPermissions = [PERMISSIONS.MANAGE_SYSTEM, PERMISSIONS.VIEW_ANALYTICS]

// Format helpers
const formatNumber = (num: number) => new Intl.NumberFormat().format(num)
const formatCurrency = (num: number) => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD'
}).format(num)

// Status mapping
const getSystemStatus = (status: number): 'healthy' | 'degraded' | 'critical' => {
  switch (status) {
    case 1:
      return 'healthy'
    case 2:
      return 'degraded'
    case 3:
      return 'critical'
    default:
      return 'critical'
  }
}

export default function SystemDashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<DashboardData | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const result = await fetchDashboardData({})
      
      if (result.error) {
        setError(result.error.message)
        toast({
          title: 'Error',
          description: result.error.message,
          variant: 'destructive'
        })
        return
      }

      setData(result.data)
      setError(null)
    } catch (err) {
      console.error('[SYSTEM_DASHBOARD_ERROR]', err)
      setError('Failed to load dashboard data')
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    try {
      setRefreshing(true)
      const result = await refreshDashboardData({})
      
      if (result.error) {
        toast({
          title: 'Error',
          description: result.error.message,
          variant: 'destructive'
        })
        return
      }

      await loadDashboardData()
      toast({
        title: 'Success',
        description: 'Dashboard data refreshed'
      })
    } catch (err) {
      console.error('[REFRESH_DASHBOARD_ERROR]', err)
      toast({
        title: 'Error',
        description: 'Failed to refresh dashboard data',
        variant: 'destructive'
      })
    } finally {
      setRefreshing(false)
    }
  }

  const getAlertVariant = (severity: SystemAlert['severity']): 'default' | 'destructive' => {
    switch (severity.toLowerCase()) {
      case 'error':
      case 'critical':
        return 'destructive'
      default:
        return 'default'
    }
  }

  if (loading) {
    return (
      <div className="container space-y-6 p-6">
        <Skeleton className="h-[100px] w-full" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-[120px] w-full" />
          ))}
        </div>
        <Skeleton className="h-[300px] w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container p-6">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="container p-6">
        <Alert>
          <AlertTitle>No Data</AlertTitle>
          <AlertDescription>No dashboard data available</AlertDescription>
        </Alert>
      </div>
    )
  }

  const systemStatus = getSystemStatus(data.systemHealth.status)

  return (
    <div className="container space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">System Dashboard</h1>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          size="sm"
        >
          {refreshing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </>
          )}
        </Button>
      </div>

      {/* System Health */}
      <Alert variant={systemStatus === 'healthy' ? 'default' : 'destructive'} className="border-2">
        <AlertTitle className="text-lg">System Status: {systemStatus}</AlertTitle>
        <AlertDescription>
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-background/50 p-3">
              <p className="text-sm font-medium">Active Sessions</p>
              <p className="mt-1 text-2xl font-bold">{data.systemHealth.activeSessions}</p>
            </div>
            <div className="rounded-lg bg-background/50 p-3">
              <p className="text-sm font-medium">Pending Reviews</p>
              <p className="mt-1 text-2xl font-bold">{data.systemHealth.pendingReviews}</p>
            </div>
            <div className="rounded-lg bg-background/50 p-3">
              <p className="text-sm font-medium">Security Alerts</p>
              <p className="mt-1 text-2xl font-bold">{data.systemHealth.securityAlerts}</p>
            </div>
            <div className="rounded-lg bg-background/50 p-3">
              <p className="text-sm font-medium">Uptime</p>
              <p className="mt-1 text-2xl font-bold">{formatNumber(data.systemHealth.uptime)}s</p>
            </div>
          </div>
        </AlertDescription>
      </Alert>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.metrics.totalUsers)}</div>
            <p className="text-xs text-muted-foreground">
              {data.metrics.metrics.userGrowth >= 0 ? '+' : ''}
              {data.metrics.metrics.userGrowth}% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Coaches</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.metrics.activeCoaches)}</div>
            <p className="text-xs text-muted-foreground">
              {data.metrics.metrics.coachGrowth >= 0 ? '+' : ''}
              {data.metrics.metrics.coachGrowth}% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.metrics.monthlyRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {data.metrics.metrics.revenueGrowth >= 0 ? '+' : ''}
              {data.metrics.metrics.revenueGrowth}% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.metrics.totalSessions)}</div>
            <p className="text-xs text-muted-foreground">
              {data.metrics.metrics.sessionGrowth >= 0 ? '+' : ''}
              {data.metrics.metrics.sessionGrowth}% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.recentActivity.map((activity) => (
              <div key={activity.ulid} className="flex items-center space-x-4 rounded-lg border p-4">
                <Badge variant={getAlertVariant(activity.severity || 'info')}>
                  {activity.type}
                </Badge>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">{activity.title}</p>
                  <p className="text-sm text-muted-foreground">{activity.description}</p>
                </div>
                <div className="text-sm text-muted-foreground">
                  {new Date(activity.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Alerts */}
      {data.systemAlerts.length > 0 && (
        <div className="space-y-4">
          {data.systemAlerts.map((alert) => (
            <Alert key={alert.ulid} variant={getAlertVariant(alert.severity)} className="border-2">
              <AlertTitle>{alert.title}</AlertTitle>
              <AlertDescription>
                <div className="mt-2 space-y-2">
                  <p>{alert.message}</p>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span>Type: {alert.type}</span>
                    <span>Severity: {alert.severity}</span>
                    <span>Created: {new Date(alert.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Button
              variant="outline"
              className="h-20 w-full"
              onClick={() => router.push('/dashboard/system/user-management')}
            >
              <div className="flex flex-col items-center space-y-2">
                <Users className="h-5 w-5" />
                <span>User Management</span>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-20 w-full"
              onClick={() => router.push('/dashboard/system/permissions')}
            >
              <div className="flex flex-col items-center space-y-2">
                <Lock className="h-5 w-5" />
                <span>Permissions</span>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-20 w-full"
              onClick={() => router.push('/dashboard/system/monitoring')}
            >
              <div className="flex flex-col items-center space-y-2">
                <Activity className="h-5 w-5" />
                <span>Monitoring</span>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-20 w-full"
              onClick={() => router.push('/dashboard/system/analytics')}
            >
              <div className="flex flex-col items-center space-y-2">
                <BarChart className="h-5 w-5" />
                <span>Analytics</span>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

