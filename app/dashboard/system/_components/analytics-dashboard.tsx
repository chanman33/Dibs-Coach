"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { UserAnalytics } from "@/utils/types/system"
import { 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

interface AnalyticsDashboardProps {
  analytics: UserAnalytics
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

export function AnalyticsDashboard({ analytics }: AnalyticsDashboardProps) {
  // Prepare data for role distribution chart
  const roleData = [
    { name: 'Mentees', value: analytics.usersByRole.mentee },
    { name: 'Coaches', value: analytics.usersByRole.coach },
    { name: 'Admins', value: analytics.usersByRole.admin },
  ]

  // Prepare data for status distribution chart
  const statusData = [
    { name: 'Active', value: analytics.usersByStatus.active },
    { name: 'Inactive', value: analytics.usersByStatus.inactive },
    { name: 'Suspended', value: analytics.usersByStatus.suspended },
  ]

  // Prepare data for revenue metrics
  const revenueData = [
    { name: 'Total Revenue', value: analytics.revenueMetrics.totalRevenue },
    { name: 'Monthly Revenue', value: analytics.revenueMetrics.monthlyRevenue },
    { name: 'Avg Session Value', value: analytics.revenueMetrics.averageSessionValue },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>User Distribution by Role</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roleData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {roleData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Metrics</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => 
                    new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    }).format(value as number)
                  }
                />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Session Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm font-medium">Total Sessions</p>
              <p className="text-2xl font-bold">{analytics.sessionMetrics.totalSessions}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Completion Rate</p>
              <p className="text-2xl font-bold">{analytics.sessionMetrics.completionRate}%</p>
            </div>
            <div>
              <p className="text-sm font-medium">Cancellation Rate</p>
              <p className="text-2xl font-bold">{analytics.sessionMetrics.cancelationRate}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
