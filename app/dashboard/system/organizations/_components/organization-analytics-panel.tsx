"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/use-toast'
import { 
  BarChart3, 
  LineChart, 
  PieChart, 
  Users, 
  DollarSign,
  Calendar,
  Building2,
  RefreshCw,
  Download
} from 'lucide-react'

interface OrganizationAnalyticsPanelProps {
  orgId: string
}

export function OrganizationAnalyticsPanel({ orgId }: OrganizationAnalyticsPanelProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState({
    memberCount: 0,
    activeMembers: 0,
    monthlyActive: 0,
    totalSessions: 0,
    revenue: {
      current: 0,
      previous: 0,
      percentage: 0
    },
    engagement: {
      current: 0,
      previous: 0,
      percentage: 0
    }
  })
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      
      // In a real implementation, this would be an API call
      // For now, mock the data
      setTimeout(() => {
        setMetrics({
          memberCount: 28,
          activeMembers: 22,
          monthlyActive: 19,
          totalSessions: 156,
          revenue: {
            current: 4899,
            previous: 4250,
            percentage: 15.3
          },
          engagement: {
            current: 78,
            previous: 62,
            percentage: 25.8
          }
        })
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error('[FETCH_ANALYTICS_ERROR]', error)
      toast({
        title: 'Error',
        description: 'Failed to load analytics data',
        variant: 'destructive'
      })
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [orgId])

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true)
      await fetchAnalytics()
      toast({
        title: 'Success',
        description: 'Analytics data refreshed'
      })
    } catch (error) {
      console.error('[REFRESH_ANALYTICS_ERROR]', error)
      toast({
        title: 'Error',
        description: 'Failed to refresh analytics data',
        variant: 'destructive'
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Organization Analytics</h2>
          <p className="text-muted-foreground">Metrics and insights for this organization</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || loading}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <Users className="h-8 w-8 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Members</span>
            </div>
            {loading ? (
              <Skeleton className="h-8 w-24 mt-2" />
            ) : (
              <div className="mt-4">
                <div className="text-3xl font-bold">{metrics.memberCount}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.activeMembers} active ({Math.round(metrics.activeMembers / metrics.memberCount * 100)}%)
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <Calendar className="h-8 w-8 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Sessions</span>
            </div>
            {loading ? (
              <Skeleton className="h-8 w-24 mt-2" />
            ) : (
              <div className="mt-4">
                <div className="text-3xl font-bold">{metrics.totalSessions}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round(metrics.totalSessions / metrics.memberCount)} per member avg.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <DollarSign className="h-8 w-8 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Revenue</span>
            </div>
            {loading ? (
              <Skeleton className="h-8 w-24 mt-2" />
            ) : (
              <div className="mt-4">
                <div className="text-3xl font-bold">{formatCurrency(metrics.revenue.current)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className={metrics.revenue.percentage > 0 ? "text-green-500" : "text-red-500"}>
                    {metrics.revenue.percentage > 0 ? "+" : ""}{metrics.revenue.percentage}%
                  </span>
                  {" "}from previous month
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Engagement</span>
            </div>
            {loading ? (
              <Skeleton className="h-8 w-24 mt-2" />
            ) : (
              <div className="mt-4">
                <div className="text-3xl font-bold">{metrics.engagement.current}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className={metrics.engagement.percentage > 0 ? "text-green-500" : "text-red-500"}>
                    {metrics.engagement.percentage > 0 ? "+" : ""}{metrics.engagement.percentage}%
                  </span>
                  {" "}from previous month
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different analytics views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-3 md:w-[400px]">
          <TabsTrigger value="overview">
            <PieChart className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="members">
            <Users className="mr-2 h-4 w-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="revenue">
            <LineChart className="mr-2 h-4 w-4" />
            Revenue
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Overview</CardTitle>
              <CardDescription>
                Member engagement and activity metrics over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <div className="h-[300px] w-full flex items-center justify-center border rounded-md">
                  <div className="text-center text-muted-foreground">
                    <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Analytics Visualization</p>
                    <p className="text-sm">Activity charts would be displayed here</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Member Analytics</CardTitle>
              <CardDescription>
                Detailed member growth and engagement metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <div className="h-[300px] w-full flex items-center justify-center border rounded-md">
                  <div className="text-center text-muted-foreground">
                    <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Member Visualization</p>
                    <p className="text-sm">Member analytics would be displayed here</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Analytics</CardTitle>
              <CardDescription>
                Financial performance and revenue trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <div className="h-[300px] w-full flex items-center justify-center border rounded-md">
                  <div className="text-center text-muted-foreground">
                    <LineChart className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Revenue Visualization</p>
                    <p className="text-sm">Revenue charts would be displayed here</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 