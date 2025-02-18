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
    switch (severity) {
      case 'error':
        return 'destructive'
      default:
        return 'default'
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[100px] w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!data) {
    return (
      <Alert>
        <AlertTitle>No Data</AlertTitle>
        <AlertDescription>No dashboard data available</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">System Dashboard</h1>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
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
      <Alert variant={data.systemHealth.status === 'healthy' ? 'default' : 'destructive'}>
        <AlertTitle>System Status: {data.systemHealth.status}</AlertTitle>
        <AlertDescription>
          <div className="mt-2 grid gap-2">
            <div>Uptime: {formatNumber(data.systemHealth.uptime)}s</div>
            <div>Response Time: {data.systemHealth.responseTime}ms</div>
            <div>Error Rate: {data.systemHealth.errorRate}%</div>
            {data.systemHealth.issues.length > 0 && (
              <div className="mt-2">
                <strong>Active Issues:</strong>
                <ul className="list-disc list-inside mt-1">
                  {data.systemHealth.issues.map((issue, i) => (
                    <li key={i}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </AlertDescription>
      </Alert>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
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

        <Card>
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

        <Card>
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

        <Card>
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
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-4">
                <Badge variant={getAlertVariant(activity.severity)}>
                  {activity.type}
                </Badge>
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.action}</p>
                  <p className="text-sm text-muted-foreground">{activity.description}</p>
                </div>
                <div className="text-sm text-muted-foreground">
                  {new Date(activity.timestamp).toLocaleString()}
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
            <Alert key={alert.id} variant={getAlertVariant(alert.severity)}>
              <AlertTitle>{alert.title}</AlertTitle>
              <AlertDescription>
                <div className="mt-2 space-y-2">
                  <p>{alert.message}</p>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span>Category: {alert.category}</span>
                    <span>Status: {alert.status}</span>
                    <span>Created: {new Date(alert.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push('/dashboard/system/user-management')}
            >
              <Users className="mr-2 h-4 w-4" />
              User Management
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push('/dashboard/system/permissions')}
            >
              <Lock className="mr-2 h-4 w-4" />
              Permissions
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push('/dashboard/system/monitoring')}
            >
              <Activity className="mr-2 h-4 w-4" />
              Monitoring
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push('/dashboard/system/analytics')}
            >
              <BarChart className="mr-2 h-4 w-4" />
              Analytics
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

