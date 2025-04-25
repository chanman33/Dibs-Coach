import { Suspense } from "react"
import { getLeadStats, getLeadAnalytics } from "@/utils/actions/lead-actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LeadStats } from "../lead-mgmt/_components/lead-stats"
import { LeadAnalyticsCharts } from "./_components/lead-analytics-charts"
import { TimePeriodFilter, type TimePeriod } from "./_components/time-period-filter"
import { BarChart3, ArrowUp, ArrowDown } from "lucide-react"

export const dynamic = "force-dynamic"

interface PageProps {
  searchParams: {
    period?: TimePeriod
  }
}

export default async function LeadAnalyticsPage({ searchParams }: PageProps) {
  const period = searchParams.period || "30d"
  
  const { data: stats, error: statsError } = await getLeadStats()
  const { data: analytics, error: analyticsError } = await getLeadAnalytics(period)
  
  // Calculate metrics for display
  const totalLeads = stats?.total || 0
  
  // Use real growth data from analytics
  const growthRate = analytics?.growthRate || 0
  const isPositiveGrowth = growthRate > 0

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lead Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive analytics and insights for your CRM data
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
          <TimePeriodFilter initialPeriod={period as TimePeriod} />
          
          <Card className="border shadow-sm w-full sm:w-auto">
            <div className="w-full justify-between border-0 bg-white h-[60px] px-4 flex items-center">
              <div className="flex flex-col items-start">
                <span className="text-xs text-muted-foreground">Total Leads</span>
                <div className="flex items-center mt-1">
                  <BarChart3 className="mr-2 h-4 w-4 text-[#4472C4]" />
                  <span className="font-medium">{totalLeads}</span>
                  <div className={`flex items-center text-xs font-medium ml-2 ${isPositiveGrowth ? 'text-[#70AD47]' : 'text-[#C00000]'}`}>
                    {isPositiveGrowth ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
                    {Math.abs(growthRate)}%
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Suspense fallback={<div>Loading statistics...</div>}>
        <LeadStats stats={stats} />
      </Suspense>

      <Suspense fallback={<div>Loading analytics charts...</div>}>
        <LeadAnalyticsCharts stats={stats} analytics={analytics} />
      </Suspense>
    </div>
  )
}
