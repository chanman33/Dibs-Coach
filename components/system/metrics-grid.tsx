'use client'

import { SystemMetrics } from '@/utils/types/system'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Users, 
  UserCheck,
  DollarSign,
  Calendar,
  TrendingUp
} from 'lucide-react'

interface MetricsGridProps {
  metrics: SystemMetrics
}

export function MetricsGrid({ metrics }: MetricsGridProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value)
  }

  const getGrowthIndicator = (value: number) => {
    if (value > 0) {
      return <TrendingUp className="h-4 w-4 text-green-500" />
    }
    return null
  }

  // Default value for monthlyRevenue if not available
  const monthlyRevenue = metrics.monthlyRevenue || metrics.totalRevenue / 12;
  // Default value for revenueGrowth if not available
  const revenueGrowth = metrics.metrics.revenueGrowth || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Users</p>
              <h3 className="text-2xl font-bold">{formatNumber(metrics.totalUsers)}</h3>
              <p className="text-sm text-gray-500">{formatNumber(metrics.activeUsers)} active</p>
            </div>
            <Users className="h-5 w-5 text-gray-400" />
          </div>
          {metrics.metrics.userGrowth > 0 && (
            <div className="mt-2 flex items-center gap-1 text-sm text-green-500">
              <TrendingUp className="h-4 w-4" />
              <span>+{metrics.metrics.userGrowth}%</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Coaches</p>
              <h3 className="text-2xl font-bold">{formatNumber(metrics.activeCoaches)}</h3>
              <p className="text-sm text-gray-500">{formatNumber(metrics.pendingCoaches)} pending</p>
            </div>
            <UserCheck className="h-5 w-5 text-gray-400" />
          </div>
          {metrics.metrics.coachGrowth > 0 && (
            <div className="mt-2 flex items-center gap-1 text-sm text-green-500">
              <TrendingUp className="h-4 w-4" />
              <span>+{metrics.metrics.coachGrowth}%</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Monthly Revenue</p>
              <h3 className="text-2xl font-bold">{formatCurrency(monthlyRevenue)}</h3>
              <p className="text-sm text-gray-500">Total: {formatCurrency(metrics.totalRevenue)}</p>
            </div>
            <DollarSign className="h-5 w-5 text-gray-400" />
          </div>
          {revenueGrowth > 0 && (
            <div className="mt-2 flex items-center gap-1 text-sm text-green-500">
              <TrendingUp className="h-4 w-4" />
              <span>+{revenueGrowth}%</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Sessions</p>
              <h3 className="text-2xl font-bold">{formatNumber(metrics.totalSessions)}</h3>
              <p className="text-sm text-gray-500">{formatNumber(metrics.completedSessions)} completed</p>
            </div>
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
          {metrics.metrics.sessionGrowth > 0 && (
            <div className="mt-2 flex items-center gap-1 text-sm text-green-500">
              <TrendingUp className="h-4 w-4" />
              <span>+{metrics.metrics.sessionGrowth}%</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 