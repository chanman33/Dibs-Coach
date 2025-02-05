import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { fetchUserAnalytics } from "@/utils/actions/admin-actions"
import { UserManagementTable } from "./_components/user-management-table"
import { AnalyticsDashboard } from "./_components/analytics-dashboard"
import { ReportingDashboard } from "./_components/reporting-dashboard"
import { 
  Users, 
  UserPlus, 
  UserMinus, 
  UserCog,
  TrendingUp,
  DollarSign,
  Calendar,
  AlertCircle 
} from "lucide-react"

// Types for our admin dashboard
interface UserAnalytics {
  totalUsers: number
  activeUsers: number
  newUsersThisMonth: number
  usersByRole: {
    mentee: number
    coach: number
    admin: number
  }
  revenueMetrics: {
    totalRevenue: number
    monthlyRevenue: number
    averageSessionValue: number
  }
  sessionMetrics: {
    totalSessions: number
    completionRate: number
    cancelationRate: number
  }
}

export default async function AdminUserManagement() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  // Fetch analytics data
  const { data: analytics, error } = await fetchUserAnalytics()
  if (error) {
    console.error("[USER_ANALYTICS_ERROR]", error)
    // You might want to handle this error differently
    return <div>Error loading analytics</div>
  }
  
  if (!analytics) {
    return <div>No analytics data available</div>
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage users and view platform analytics
          </p>
        </div>
        <div className="flex gap-2">
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
          <Button variant="outline">
            <UserCog className="h-4 w-4 mr-2" />
            Bulk Actions
          </Button>
        </div>
      </div>

      {/* Analytics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.newUsersThisMonth} new this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${analytics.revenueMetrics.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              ${analytics.revenueMetrics.monthlyRevenue.toLocaleString()} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.sessionMetrics.totalSessions}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.sessionMetrics.completionRate}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Issues</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.sessionMetrics.cancelationRate}%</div>
            <p className="text-xs text-muted-foreground">
              Cancellation rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-between items-center">
            <Input
              placeholder="Search users..."
              className="max-w-sm"
            />
            <div className="flex gap-2">
              <Button variant="outline">Export</Button>
              <Button variant="outline">Filter</Button>
            </div>
          </div>
          <UserManagementTable />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <AnalyticsDashboard analytics={analytics} />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <ReportingDashboard />
        </TabsContent>
      </Tabs>
    </div>
  )
}
