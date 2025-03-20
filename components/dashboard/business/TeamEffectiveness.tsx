"use client"

import { useState } from "react"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle
} from "@/components/ui/card"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs"
import { 
  BarChart,
  ResponsiveContainer,
  Bar,
  XAxis,
  YAxis,
  Tooltip
} from "recharts"
import { TopFocusArea, TeamEffectivenessMetrics } from "@/utils/types/business"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"

interface TeamEffectivenessProps {
  data?: TeamEffectivenessMetrics | null
  isLoading?: boolean
  noCard?: boolean
  className?: string
}

export function TeamEffectiveness({ 
  data, 
  isLoading = false, 
  noCard = false,
  className
}: TeamEffectivenessProps) {
  const [timePeriod, setTimePeriod] = useState("6m")
  const [activeTab, setActiveTab] = useState("overview")
  
  // Format focus areas data for visualization
  const focusAreasData = data?.topFocusAreas?.map(area => ({
    name: area.area,
    value: area.count
  })) || []
  
  // Render empty state or loading state if needed
  if (isLoading) {
    return (
      <LoadingState noCard={noCard} className={className} />
    )
  }
  
  if (!data) {
    return (
      <EmptyState noCard={noCard} className={className} />
    )
  }
  
  // Render content based on whether we should show the card wrapper
  const content = (
    <>
      <div className="flex items-center justify-between">
        <div>
          <CardTitle>Team Effectiveness</CardTitle>
          <CardDescription>
            Impact metrics from your coaching investment
          </CardDescription>
        </div>
        <div>
          <Select 
            value={timePeriod} 
            onValueChange={setTimePeriod}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Time period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">Last Month</SelectItem>
              <SelectItem value="3m">Last 3 Months</SelectItem>
              <SelectItem value="6m">Last 6 Months</SelectItem>
              <SelectItem value="12m">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="mt-6"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="impact">Impact</TabsTrigger>
          <TabsTrigger value="focus">Focus Areas</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-2 gap-4">
            <MetricCard 
              title="Employee Participation" 
              value={`${data.employeeParticipation}%`} 
              description="of eligible employees engaged in coaching"
              trend={data.employeeParticipation > 50 ? "up" : "neutral"}
            />
            <MetricCard 
              title="Goal Achievement" 
              value={`${data.goalsAchievementRate}%`} 
              description="of set goals achieved through coaching"
              trend={data.goalsAchievementRate > 70 ? "up" : "neutral"}
            />
            <MetricCard 
              title="Sessions per Employee" 
              value={data.averageSessionsPerEmployee} 
              description="average coaching sessions per employee"
              trend={data.averageSessionsPerEmployee > 3 ? "up" : "neutral"}
            />
            <MetricCard 
              title="Upcoming Sessions" 
              value={data.scheduledSessionsNext30Days} 
              description="coaching sessions scheduled in next 30 days"
              trend="neutral"
            />
            <MetricCard 
              title="Employee Satisfaction" 
              value={`${data.employeeSatisfaction}%`} 
              description="satisfaction with coaching program"
              trend={data.employeeSatisfaction > 80 ? "up" : "neutral"}
            />
          </div>
        </TabsContent>
        
        {/* Engagement Tab */}
        <TabsContent value="engagement" className="mt-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2">
              <h3 className="text-lg font-semibold mb-2">Participation Rate</h3>
              <div className="flex items-end mb-3">
                <span className="text-3xl font-bold mr-2">{data.employeeParticipation}%</span>
                <span className="text-muted-foreground">of eligible employees</span>
              </div>
              <Progress value={data.employeeParticipation} className="h-2 mb-4" />
              <p className="text-sm text-muted-foreground mt-2">
                Target participation: 75% of eligible employees
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Sessions per Employee</h3>
              <div className="flex items-end mb-3">
                <span className="text-3xl font-bold mr-2">{data.averageSessionsPerEmployee}</span>
                <span className="text-muted-foreground">average per employee</span>
              </div>
              <div className="h-2 bg-muted rounded mb-4">
                <div 
                  className="h-full bg-primary rounded" 
                  style={{ width: `${Math.min(data.averageSessionsPerEmployee / 6 * 100, 100)}%` }}
                ></div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Target: 6 sessions per employee annually
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Employee Satisfaction</h3>
              <div className="flex items-end mb-3">
                <span className="text-3xl font-bold mr-2">{data.employeeSatisfaction}%</span>
                <span className="text-muted-foreground">satisfaction rating</span>
              </div>
              <Progress value={data.employeeSatisfaction} className="h-2 mb-4" />
              <p className="text-sm text-muted-foreground mt-2">
                Target satisfaction: 85% approval rating
              </p>
            </div>
          </div>
        </TabsContent>
        
        {/* Impact Tab */}
        <TabsContent value="impact" className="mt-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2">
              <h3 className="text-lg font-semibold mb-2">Goal Achievement Rate</h3>
              <div className="flex items-end mb-3">
                <span className="text-3xl font-bold mr-2">{data.goalsAchievementRate}%</span>
                <span className="text-muted-foreground">of goals achieved</span>
              </div>
              <Progress value={data.goalsAchievementRate} className="h-2 mb-4" />
              <p className="text-sm text-muted-foreground mt-2">
                Target goal achievement: 80% of set goals
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Skill Growth</h3>
              <div className="flex items-end mb-3">
                <span className="text-3xl font-bold mr-2">{data.skillGrowthRate}%</span>
                <span className="text-muted-foreground">reported improvement</span>
              </div>
              <Progress value={data.skillGrowthRate} className="h-2 mb-4" />
              <p className="text-sm text-muted-foreground mt-2">
                Target skill growth: 70% improvement
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Retention Impact</h3>
              <div className="flex items-end mb-3">
                <span className="text-3xl font-bold mr-2">{data.employeeRetention}%</span>
                <span className="text-muted-foreground">retention rate</span>
              </div>
              <Progress value={data.employeeRetention} className="h-2 mb-4" />
              <p className="text-sm text-muted-foreground mt-2">
                Industry average: 85% annual retention
              </p>
            </div>
          </div>
        </TabsContent>
        
        {/* Focus Areas Tab */}
        <TabsContent value="focus" className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Top Coaching Focus Areas</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={focusAreasData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                tickLine={false}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
              />
              <Tooltip />
              <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 text-sm text-muted-foreground">
            <p>Based on {data.topFocusAreas.reduce((sum, area) => sum + area.count, 0)} coaching sessions</p>
          </div>
        </TabsContent>
      </Tabs>
    </>
  )
  
  // Either return the content wrapped in a card or as-is
  if (noCard) {
    return (
      <div className={className}>
        {content}
      </div>
    )
  }
  
  return (
    <Card className={className}>
      <CardHeader className="pb-0">
        <div className="space-y-0">{content}</div>
      </CardHeader>
      <CardContent>
        {/* Content is already rendered in the header */}
      </CardContent>
    </Card>
  )
}

function MetricCard({ 
  title, 
  value, 
  description, 
  trend = "neutral" 
}: { 
  title: string
  value: string | number
  description: string
  trend?: "up" | "down" | "neutral"
}) {
  return (
    <div className="flex flex-col p-4 border rounded-lg">
      <div className="text-sm font-medium text-muted-foreground mb-1">{title}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="flex items-center mt-1">
        {trend === "up" && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-4 h-4 text-emerald-500 mr-1"
          >
            <path
              fillRule="evenodd"
              d="M12.577 4.878a.75.75 0 01.919-.53l4.78 1.281a.75.75 0 01.531.919l-1.281 4.78a.75.75 0 01-1.449-.387l.81-3.022a19.407 19.407 0 00-5.594 5.203.75.75 0 01-1.139.093L7 10.06l-4.72 4.72a.75.75 0 01-1.06-1.061l5.25-5.25a.75.75 0 011.06 0l3.074 3.073a20.923 20.923 0 015.545-4.931l-3.042-.815a.75.75 0 01-.53-.919z"
              clipRule="evenodd"
            />
          </svg>
        )}
        {trend === "down" && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-4 h-4 text-rose-500 mr-1"
          >
            <path
              fillRule="evenodd"
              d="M10.78 3.22a.75.75 0 01.44.67v6.36l1.07-1.07a.75.75 0 111.06 1.06l-2.35 2.35a.75.75 0 01-1.06 0l-2.35-2.35a.75.75 0 111.06-1.06l1.07 1.07V3.89a.75.75 0 01.44-.67l4-1.5a.75.75 0 11.52 1.41L12 4.51V8.5h.75a.75.75 0 010 1.5h-1.5A.75.75 0 0110.5 9V4.15l-2.82 1.05a.75.75 0 11-.52-1.41l4-1.5a.75.75 0 01.32-.07z"
              clipRule="evenodd"
            />
          </svg>
        )}
        <span className="text-sm text-muted-foreground">{description}</span>
      </div>
    </div>
  )
}

function LoadingState({ noCard = false, className }: { noCard?: boolean, className?: string }) {
  const content = (
    <>
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-6 w-[180px] mb-2" />
          <Skeleton className="h-4 w-[240px]" />
        </div>
        <Skeleton className="h-10 w-[160px]" />
      </div>
      <div className="mt-6">
        <Skeleton className="h-10 w-full mb-6" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-[120px] w-full" />
          <Skeleton className="h-[120px] w-full" />
          <Skeleton className="h-[120px] w-full" />
          <Skeleton className="h-[120px] w-full" />
        </div>
      </div>
    </>
  )
  
  if (noCard) {
    return <div className={className}>{content}</div>
  }
  
  return (
    <Card className={className}>
      <CardHeader className="pb-0">
        <div className="space-y-0">{content}</div>
      </CardHeader>
      <CardContent>
        {/* Content already in header */}
      </CardContent>
    </Card>
  )
}

function EmptyState({ noCard = false, className }: { noCard?: boolean, className?: string }) {
  const content = (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6 text-muted-foreground"
        >
          <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
          <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
          <line x1="6" x2="6" y1="2" y2="4" />
          <line x1="10" x2="10" y1="2" y2="4" />
          <line x1="14" x2="14" y1="2" y2="4" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold">No Team Data Available</h3>
      <p className="text-sm text-muted-foreground text-center mt-2 max-w-[85%]">
        There isn't enough coaching data yet to show team effectiveness metrics.
      </p>
    </div>
  )
  
  if (noCard) {
    return <div className={cn("rounded-lg border bg-card", className)}>{content}</div>
  }
  
  return (
    <Card className={className}>
      <CardContent className="pt-6">
        {content}
      </CardContent>
    </Card>
  )
} 