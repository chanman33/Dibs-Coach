"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/use-toast'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  BarChart3, 
  LineChart, 
  PieChart, 
  Users, 
  DollarSign,
  Calendar,
  Building2,
  RefreshCw,
  Download,
  AlertCircle
} from 'lucide-react'
import { fetchOrganizationAnalytics, fetchOrganizationMemberGrowth, OrganizationAnalyticsData } from '@/utils/actions/admin-organizations-analytics'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface OrganizationAnalyticsPanelProps {
  orgId: string
}

export function OrganizationAnalyticsPanel({ orgId }: OrganizationAnalyticsPanelProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<OrganizationAnalyticsData | null>(null)
  const [memberGrowthData, setMemberGrowthData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [usageData, setUsageData] = useState<any>(null)

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)
      
      if (!orgId) {
        setError("Organization ID is missing. Please try again later.")
        setLoading(false)
        return
      }
      
      console.log('[ANALYTICS_PANEL] Fetching analytics for organization:', orgId)
      
      // Fetch main analytics data
      const result = await fetchOrganizationAnalytics({ orgId })
      
      if (result.error) {
        console.error('[ANALYTICS_FETCH_ERROR]', result.error)
        setError(formatErrorMessage(result.error))
        setLoading(false)
        return
      }
      
      // Fetch member growth data for charts - this is optional, so we don't need to block on it
      try {
        const growthResult = await fetchOrganizationMemberGrowth(orgId)
        if (!growthResult.error && growthResult.data) {
          setMemberGrowthData(growthResult.data)
        } else if (growthResult.error) {
          console.warn('[MEMBER_GROWTH_FETCH_WARNING]', growthResult.error)
          // Don't set error state for this - it's optional data
        }
      } catch (growthErr) {
        console.warn('[MEMBER_GROWTH_FETCH_ERROR]', growthErr)
        // Continue anyway - this is optional data
      }
      
      setMetrics(result.data)
      console.log('[ANALYTICS_LOADED]', { 
        hasData: !!result.data,
        memberCount: result.data?.memberCount,
        hasGrowthData: !!memberGrowthData
      })
    } catch (error) {
      console.error('[FETCH_ANALYTICS_ERROR]', error)
      setError('An unexpected error occurred while loading analytics data. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  // Format error messages to be more user-friendly
  const formatErrorMessage = (error: string): string => {
    if (error.includes('Failed to fetch member data')) {
      return 'Unable to retrieve member information. The organization might not exist or you may not have access.'
    }
    
    if (error.includes('not found') || error.includes('does not exist')) {
      return 'The organization data could not be found. Please verify the organization exists.'
    }
    
    if (error.includes('in.(')) {
      return 'No members found for this organization. Analytics cannot be displayed.'
    }
    
    if (error.includes('permission denied') || error.includes('access')) {
      return 'You don\'t have permission to view analytics for this organization.'
    }
    
    // Default error message for other cases
    return 'Failed to load analytics data. Please try again later.'
  }

  useEffect(() => {
    if (orgId) {
      fetchAnalytics()
    } else {
      setError("Organization ID is missing")
      setLoading(false)
    }
  }, [orgId])

  useEffect(() => {
    // Simulate API fetch for usage data
    const timer = setTimeout(() => {
      setUsageData({
        sessionsBooked: 43,
        sessionsCompleted: 38,
        totalSpent: 3870,
        avgSessionCost: 101.84,
        departmentUsage: [
          { department: "Sales", sessions: 19, spend: 1920, percentage: 49.6 },
          { department: "Marketing", sessions: 12, spend: 1210, percentage: 31.3 },
          { department: "Operations", sessions: 7, spend: 740, percentage: 19.1 }
        ],
        topUsers: [
          { name: "John Smith", sessions: 12, spend: 630, department: "Sales" },
          { name: "Emily Johnson", sessions: 8, spend: 510, department: "Marketing" },
          { name: "Michael Davis", sessions: 6, spend: 420, department: "Sales" }
        ]
      })
      setLoading(false)
    }, 1500)
    
    return () => clearTimeout(timer)
  }, [orgId])

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true)
      setError(null)
      await fetchAnalytics()
      toast({
        title: 'Success',
        description: 'Analytics data refreshed successfully',
      })
    } catch (error) {
      console.error('[REFRESH_ANALYTICS_ERROR]', error)
      toast({
        title: 'Error',
        description: 'Failed to refresh analytics data. Please try again.',
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

  if (error && !loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Organization Analytics</h2>
            <p className="text-muted-foreground">Metrics and insights for this organization</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Retry
          </Button>
        </div>
        
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Unable to Load Analytics</AlertTitle>
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
        
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mt-4">
              Please try refreshing the data or contact support if the problem persists.
            </p>
          </CardContent>
        </Card>
      </div>
    )
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
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing || loading ? 'animate-spin' : ''}`} />
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
                <div className="text-3xl font-bold">{metrics?.memberCount || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics?.activeMembers || 0} active ({metrics && metrics.memberCount > 0 
                    ? Math.round((metrics.activeMembers / metrics.memberCount) * 100) 
                    : 0}%)
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
                <div className="text-3xl font-bold">{metrics?.totalSessions || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics && metrics.memberCount > 0 
                    ? Math.round(metrics.totalSessions / metrics.memberCount) 
                    : 0} per member avg.
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
                <div className="text-3xl font-bold">
                  {formatCurrency(metrics?.revenue.current || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics && metrics.revenue.percentage !== 0 && (
                    <span className={metrics.revenue.percentage > 0 ? "text-green-500" : "text-red-500"}>
                      {metrics.revenue.percentage > 0 ? "+" : ""}{metrics.revenue.percentage}%
                    </span>
                  )}
                  {metrics && metrics.revenue.percentage !== 0 && " from previous month"}
                  {(!metrics || metrics.revenue.percentage === 0) && "No previous data"}
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
                <div className="text-3xl font-bold">{metrics?.engagement.current || 0}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics && metrics.engagement.percentage !== 0 && (
                    <span className={metrics.engagement.percentage > 0 ? "text-green-500" : "text-red-500"}>
                      {metrics.engagement.percentage > 0 ? "+" : ""}{metrics.engagement.percentage}%
                    </span>
                  )}
                  {metrics && metrics.engagement.percentage !== 0 && " from previous month"}
                  {(!metrics || metrics.engagement.percentage === 0) && "No previous data"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Data availability warning */}
      {!loading && metrics && !error && (metrics.memberCount === 0 || metrics.totalSessions === 0) && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Limited Data Available</AlertTitle>
          <AlertDescription>
            {metrics.memberCount === 0 
              ? "This organization currently has no members. Some analytics metrics may show placeholder values."
              : "This organization has limited activity data. Some metrics may be estimates."}
          </AlertDescription>
        </Alert>
      )}

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
                    <p className="text-sm">
                      {!metrics || metrics.memberCount === 0 
                        ? "No member data available to display activity charts"
                        : "Activity charts would be displayed here"}
                    </p>
                    {metrics && metrics.memberCount > 0 && (
                      <div className="mt-4 text-xs">
                        <p>Monthly Active Users: {metrics.monthlyActive}</p>
                        <p>Total Sessions: {metrics.totalSessions}</p>
                        <p>Average Engagement: {metrics.engagement.current}%</p>
                      </div>
                    )}
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
                    <p className="text-lg font-medium">Member Growth</p>
                    {!metrics || metrics.memberCount === 0 ? (
                      <p className="text-sm">No member data available to display growth chart</p>
                    ) : (
                      <>
                        <p className="text-sm">Member growth chart would be displayed here</p>
                        <div className="mt-4 flex justify-center gap-8 text-sm">
                          <div>
                            <p className="font-medium">Total Members</p>
                            <p className="text-2xl">{metrics.memberCount}</p>
                          </div>
                          <div>
                            <p className="font-medium">Active Members</p>
                            <p className="text-2xl">{metrics.activeMembers}</p>
                          </div>
                        </div>
                        {memberGrowthData && (
                          <div className="mt-4 text-xs">
                            <p>Growth data available for visualization</p>
                            <p className="mt-1">Recent months: {memberGrowthData.labels.join(', ')}</p>
                          </div>
                        )}
                      </>
                    )}
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
                    <p className="text-lg font-medium">Revenue Trends</p>
                    <p className="text-sm">
                      {!metrics || metrics.revenue.current === 0 
                        ? "No revenue data available to display charts" 
                        : "Revenue charts would be displayed here"}
                    </p>
                    {metrics && metrics.revenue.current > 0 && (
                      <div className="mt-4 flex justify-center gap-8 text-sm">
                        <div>
                          <p className="font-medium">Current Month</p>
                          <p className="text-2xl">{formatCurrency(metrics.revenue.current)}</p>
                        </div>
                        <div>
                          <p className="font-medium">Previous Month</p>
                          <p className="text-2xl">{formatCurrency(metrics.revenue.previous)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Usage Analytics</CardTitle>
          <CardDescription>
            Detailed coaching usage and spending metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <div className="bg-muted p-4 rounded-lg border">
              <div className="text-sm text-muted-foreground mb-1">Sessions Booked</div>
              <div className="text-2xl font-bold">
                {loading || !usageData ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  usageData.sessionsBooked
                )}
              </div>
            </div>
            <div className="bg-muted p-4 rounded-lg border">
              <div className="text-sm text-muted-foreground mb-1">Sessions Completed</div>
              <div className="text-2xl font-bold">
                {loading || !usageData ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  usageData.sessionsCompleted
                )}
              </div>
            </div>
            <div className="bg-muted p-4 rounded-lg border">
              <div className="text-sm text-muted-foreground mb-1">Total Spent</div>
              <div className="text-2xl font-bold">
                {loading || !usageData ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  `$${usageData.totalSpent}`
                )}
              </div>
            </div>
            <div className="bg-muted p-4 rounded-lg border">
              <div className="text-sm text-muted-foreground mb-1">Avg Cost Per Session</div>
              <div className="text-2xl font-bold">
                {loading || !usageData ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  `$${usageData.avgSessionCost.toFixed(2)}`
                )}
              </div>
            </div>
          </div>
          
          <div className="h-80 flex items-center justify-center border rounded-lg mb-6">
            <div className="text-muted-foreground">Usage chart would go here</div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="text-lg font-medium mb-2">Department Usage</h3>
              {loading || !usageData ? (
                <Skeleton className="h-[200px] w-full" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Department</TableHead>
                      <TableHead>Sessions</TableHead>
                      <TableHead>Spend</TableHead>
                      <TableHead>% of Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usageData.departmentUsage.map((dept: any) => (
                      <TableRow key={dept.department}>
                        <TableCell className="font-medium">{dept.department}</TableCell>
                        <TableCell>{dept.sessions}</TableCell>
                        <TableCell>${dept.spend}</TableCell>
                        <TableCell>{dept.percentage}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Top Users</h3>
              {loading || !usageData ? (
                <Skeleton className="h-[200px] w-full" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Sessions</TableHead>
                      <TableHead>Spend</TableHead>
                      <TableHead>Department</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usageData.topUsers.map((user: any) => (
                      <TableRow key={user.name}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.sessions}</TableCell>
                        <TableCell>${user.spend}</TableCell>
                        <TableCell>{user.department}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            Data for current billing period
          </div>
          <div className="flex gap-2">
            <Button variant="outline">Download Report</Button>
            <Button>Schedule Reports</Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
