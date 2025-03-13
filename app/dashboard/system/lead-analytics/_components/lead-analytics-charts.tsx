"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LEAD_STATUS, LEAD_PRIORITY, type LeadStatus, type LeadPriority } from "@/utils/types/leads"
import { BarChart, LineChart, PieChart, TrendingUp, Users, Calendar, ArrowRight } from "lucide-react"

// Excel-inspired colors
const excelBlue = "#4472C4"
const excelLightBlue = "#5B9BD5"
const excelRed = "#C00000"
const excelGreen = "#70AD47"
const excelYellow = "#FFC000"
const excelOrange = "#ED7D31"
const excelGray = "#A5A5A5"
const excelDarkGray = "#7F7F7F"

interface LeadAnalyticsChartsProps {
  stats: {
    total: number
    byStatus: Record<LeadStatus, number>
    byPriority: Record<LeadPriority, number>
  } | null
}

export function LeadAnalyticsCharts({ stats }: LeadAnalyticsChartsProps) {
  if (!stats) return null

  // Calculate some metrics
  const totalLeads = stats.total || 0
  const wonLeads = stats.byStatus.WON || 0
  const lostLeads = stats.byStatus.LOST || 0
  const activeLeads = totalLeads - wonLeads - lostLeads - (stats.byStatus.ARCHIVED || 0)

  // Mock data for charts
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']

  return (
    <div className="space-y-6">
      <Card className="border-t-4 border-t-[#4472C4]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Lead Conversion Metrics</CardTitle>
          <TrendingUp className="h-4 w-4 text-[#4472C4]" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg border-l-4 border-l-[#4472C4]">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Average Time to Qualify</div>
                  <div className="text-2xl font-bold text-[#4472C4]">3.2 days</div>
                </div>
                <Calendar className="h-5 w-5 text-[#4472C4] opacity-70" />
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                From first contact to qualification
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border-l-4 border-l-[#70AD47]">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Average Time to Close</div>
                  <div className="text-2xl font-bold text-[#70AD47]">14.5 days</div>
                </div>
                <Calendar className="h-5 w-5 text-[#70AD47] opacity-70" />
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                From qualification to won/lost
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border-l-4 border-l-[#ED7D31]">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Lead-to-Deal Ratio</div>
                  <div className="text-2xl font-bold text-[#ED7D31]">18.3%</div>
                </div>
                <TrendingUp className="h-5 w-5 text-[#ED7D31] opacity-70" />
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Percentage of leads that convert to deals
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-t-4 border-t-[#70AD47]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Timeline</CardTitle>
            <LineChart className="h-4 w-4 text-[#70AD47]" />
          </CardHeader>
          <CardContent className="px-4">
            <div className="h-[200px] flex flex-col justify-center">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-[#70AD47] mr-2"></div>
                  <span className="text-xs">Won Leads</span>
                </div>
                <span className="text-xs font-medium">{wonLeads} leads</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#70AD47] h-full rounded-full"
                  style={{ width: `${(wonLeads / totalLeads) * 100}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                {months.map((month) => (
                  <span key={month}>{month}</span>
                ))}
              </div>

              <div className="mt-6 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Average Time to Close</span>
                  <span className="text-lg font-bold">14.5 days</span>
                </div>
                <ArrowRight className="h-4 w-4 text-[#70AD47]" />
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Conversion Rate</span>
                  <span className="text-lg font-bold">{((wonLeads / totalLeads) * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-[#5B9BD5]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lead Assignment</CardTitle>
            <Users className="h-4 w-4 text-[#5B9BD5]" />
          </CardHeader>
          <CardContent className="px-4">
            <div className="h-[200px] flex flex-col justify-center">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-[#5B9BD5] mr-2"></div>
                  <span className="text-xs">Assigned Leads</span>
                </div>
                <span className="text-xs font-medium">{Math.round(totalLeads * 0.75)} leads</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#5B9BD5] h-full rounded-full"
                  style={{ width: '75%' }}
                ></div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs text-muted-foreground">Assigned</div>
                  <div className="text-lg font-bold">{Math.round(totalLeads * 0.75)}</div>
                  <div className="text-xs text-[#5B9BD5]">75%</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs text-muted-foreground">Unassigned</div>
                  <div className="text-lg font-bold">{Math.round(totalLeads * 0.25)}</div>
                  <div className="text-xs text-[#ED7D31]">25%</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-t-4 border-t-[#ED7D31]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monthly Lead Acquisition</CardTitle>
          <BarChart className="h-4 w-4 text-[#ED7D31]" />
        </CardHeader>
        <CardContent className="px-4">
          <div className="h-[250px] flex flex-col justify-end">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-[#ED7D31] mr-2"></div>
                <span className="text-xs">New Leads</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-[#4472C4] mr-2"></div>
                <span className="text-xs">Qualified Leads</span>
              </div>
            </div>

            <div className="flex items-end justify-between h-[150px]">
              {months.map((month, index) => {
                const height1 = 30 + Math.random() * 70;
                const height2 = height1 * (0.4 + Math.random() * 0.3);

                return (
                  <div key={month} className="flex flex-col items-center w-1/6">
                    <div className="w-full flex justify-center space-x-1">
                      <div
                        className="w-5 bg-[#ED7D31] rounded-t-sm"
                        style={{ height: `${height1}%` }}
                      ></div>
                      <div
                        className="w-5 bg-[#4472C4] rounded-t-sm"
                        style={{ height: `${height2}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">{month}</div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex justify-between">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Total New Leads</span>
                <span className="text-lg font-bold">{totalLeads}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs text-muted-foreground">Monthly Average</span>
                <span className="text-lg font-bold">{Math.round(totalLeads / 6)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>


    </div>
  )
} 