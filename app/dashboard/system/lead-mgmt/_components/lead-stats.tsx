"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LEAD_STATUS, LEAD_PRIORITY, type LeadStatus, type LeadPriority } from "@/utils/types/leads"
import { ArrowUp, ArrowDown, Minus, TrendingUp, Users, Award, AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"

interface LeadStatsProps {
  stats: {
    total: number
    byStatus: Record<LeadStatus, number>
    byPriority: Record<LeadPriority, number>
  } | null
}

const statusColors: Record<LeadStatus, string> = {
  NEW: "bg-blue-100 text-blue-800",
  CONTACTED: "bg-orange-100 text-orange-800",
  QUALIFIED: "bg-gray-100 text-gray-800",
  PROPOSAL: "bg-yellow-100 text-yellow-800",
  NEGOTIATION: "bg-purple-100 text-purple-800",
  WON: "bg-green-100 text-green-800",
  LOST: "bg-red-100 text-red-800",
  ARCHIVED: "bg-slate-100 text-slate-800"
}

const statusProgressColors: Record<LeadStatus, string> = {
  NEW: "bg-[#4472C4]", // Excel blue
  CONTACTED: "bg-[#ED7D31]", // Excel orange
  QUALIFIED: "bg-[#A5A5A5]", // Excel gray
  PROPOSAL: "bg-[#FFC000]", // Excel yellow
  NEGOTIATION: "bg-[#5B9BD5]", // Excel light blue
  WON: "bg-[#70AD47]", // Excel green
  LOST: "bg-[#C00000]", // Excel red
  ARCHIVED: "bg-[#7F7F7F]" // Excel dark gray
}

const priorityProgressColors: Record<LeadPriority, string> = {
  LOW: "bg-[#70AD47]", // Excel green
  MEDIUM: "bg-[#FFC000]", // Excel yellow
  HIGH: "bg-[#C00000]" // Excel red
}

const statusIcons: Record<LeadStatus, React.ReactNode> = {
  NEW: <Users className="h-4 w-4 text-[#4472C4]" />,
  CONTACTED: <ArrowUp className="h-4 w-4 text-[#ED7D31]" />,
  QUALIFIED: <Award className="h-4 w-4 text-[#A5A5A5]" />,
  PROPOSAL: <TrendingUp className="h-4 w-4 text-[#FFC000]" />,
  NEGOTIATION: <TrendingUp className="h-4 w-4 text-[#5B9BD5]" />,
  WON: <Award className="h-4 w-4 text-[#70AD47]" />,
  LOST: <AlertTriangle className="h-4 w-4 text-[#C00000]" />,
  ARCHIVED: <Minus className="h-4 w-4 text-[#7F7F7F]" />
}

const priorityColors: Record<LeadPriority, string> = {
  LOW: "bg-green-100 text-green-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  HIGH: "bg-red-100 text-red-800"
}

const priorityBgColors: Record<LeadPriority, string> = {
  LOW: "bg-green-50",
  MEDIUM: "bg-yellow-50",
  HIGH: "bg-red-50"
}

export function LeadStats({ stats }: LeadStatsProps) {
  const router = useRouter();
  
  if (!stats) return null
  
  const wonLeads = stats.byStatus.WON || 0
  const totalLeads = stats.total || 0
  const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : "0.0"
  const activeLeads = totalLeads - (stats.byStatus.ARCHIVED || 0) - (stats.byStatus.LOST || 0) - (stats.byStatus.WON || 0);
  const activeLeadsPercentage = totalLeads > 0 ? ((activeLeads / totalLeads) * 100).toFixed(1) : "0.0";

  // Sort status entries by pipeline order
  const pipelineOrder: LeadStatus[] = [
    "NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST", "ARCHIVED"
  ];
  
  const sortedStatusEntries = Object.entries(stats.byStatus)
    .sort(([statusA], [statusB]) => {
      return pipelineOrder.indexOf(statusA as LeadStatus) - pipelineOrder.indexOf(statusB as LeadStatus);
    });

  // Group statuses for the funnel visualization
  const earlyStageLeads = (stats.byStatus.NEW || 0) + (stats.byStatus.CONTACTED || 0);
  const midStageLeads = (stats.byStatus.QUALIFIED || 0) + (stats.byStatus.PROPOSAL || 0);
  const lateStageLeads = (stats.byStatus.NEGOTIATION || 0);
  const closedLeads = (stats.byStatus.WON || 0) + (stats.byStatus.LOST || 0);

  // Calculate percentages for the funnel
  const earlyStagePercentage = totalLeads > 0 ? (earlyStageLeads / totalLeads) * 100 : 0;
  const midStagePercentage = totalLeads > 0 ? (midStageLeads / totalLeads) * 100 : 0;
  const lateStagePercentage = totalLeads > 0 ? (lateStageLeads / totalLeads) * 100 : 0;
  const closedPercentage = totalLeads > 0 ? (closedLeads / totalLeads) * 100 : 0;

  // Handle filtering by status
  const filterByStatus = (status: LeadStatus) => {
    router.push(`?status=${status}`);
  };

  // Handle filtering by priority
  const filterByPriority = (priority: LeadPriority) => {
    router.push(`?priority=${priority}`);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Leads */}
        <Card className="border-l-4 border-l-[#4472C4]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-[#4472C4]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {activeLeads} active ({activeLeadsPercentage}%)
            </div>
          </CardContent>
        </Card>
        
        {/* High Priority */}
        <Card className="border-l-4 border-l-[#C00000]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <AlertTriangle className="h-4 w-4 text-[#C00000]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byPriority.HIGH || 0}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {totalLeads > 0 ? (((stats.byPriority.HIGH || 0) / totalLeads) * 100).toFixed(1) : "0"}% of total
            </div>
          </CardContent>
        </Card>
        
        {/* Conversion Rate */}
        <Card className="border-l-4 border-l-[#70AD47]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-[#70AD47]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate}%</div>
            <div className="text-xs text-muted-foreground mt-1">
              {wonLeads} won out of {totalLeads} total
            </div>
          </CardContent>
        </Card>
        
        {/* Active Deals */}
        <Card className="border-l-4 border-l-[#5B9BD5]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
            <TrendingUp className="h-4 w-4 text-[#5B9BD5]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byStatus.NEGOTIATION || 0}</div>
            <div className="text-xs text-muted-foreground mt-1">
              In negotiation stage
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Detailed Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Lead Pipeline Status */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lead Pipeline Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Sales Funnel Visualization */}
              <div className="mb-6 pt-2">
                <div className="flex justify-between mb-1 text-xs text-muted-foreground">
                  <span>Early Stage</span>
                  <span>Mid Stage</span>
                  <span>Late Stage</span>
                  <span>Closed</span>
                </div>
                <div className="relative h-8 flex">
                  <div 
                    className="bg-[#4472C4] rounded-l-lg flex items-center justify-center text-white text-xs font-medium"
                    style={{ width: `${Math.max(earlyStagePercentage, 10)}%` }}
                  >
                    {earlyStageLeads}
                  </div>
                  <div 
                    className="bg-[#FFC000] flex items-center justify-center text-white text-xs font-medium"
                    style={{ width: `${Math.max(midStagePercentage, 10)}%` }}
                  >
                    {midStageLeads}
                  </div>
                  <div 
                    className="bg-[#5B9BD5] flex items-center justify-center text-white text-xs font-medium"
                    style={{ width: `${Math.max(lateStagePercentage, 10)}%` }}
                  >
                    {lateStageLeads}
                  </div>
                  <div 
                    className="bg-[#70AD47] rounded-r-lg flex items-center justify-center text-white text-xs font-medium"
                    style={{ width: `${Math.max(closedPercentage, 10)}%` }}
                  >
                    {closedLeads}
                  </div>
                </div>
              </div>
              
              {/* Detailed Status Breakdown */}
              <div className="space-y-3">
                {sortedStatusEntries.map(([status, count]) => {
                  const percentage = totalLeads > 0 ? (count / totalLeads) * 100 : 0;
                  return (
                    <div 
                      key={status} 
                      className="space-y-1 p-2 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => filterByStatus(status as LeadStatus)}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="mr-2">
                            {statusIcons[status as LeadStatus]}
                          </div>
                          <span className="text-sm font-medium">{status}</span>
                        </div>
                        <span className="text-sm font-semibold">{count}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${statusProgressColors[status as LeadStatus] || "bg-gray-500"}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{percentage.toFixed(1)}% of total</span>
                        {status === "WON" && <span className="text-[#70AD47] font-medium">Converted</span>}
                        {status === "LOST" && <span className="text-[#C00000] font-medium">Lost opportunity</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Priority Distribution */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Priority Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Priority Pie Chart Visualization */}
              <div className="flex justify-center py-4">
                <div className="relative w-32 h-32">
                  {Object.entries(stats.byPriority).map(([priority, count], index) => {
                    const priorityKey = priority as LeadPriority;
                    const total = Object.values(stats.byPriority).reduce((sum, val) => sum + val, 0);
                    const percentage = total > 0 ? (count / total) * 100 : 0;
                    const offset = index * 120; // 120 degrees per segment
                    
                    return (
                      <div 
                        key={priority}
                        className="absolute inset-0 flex items-center justify-center"
                        style={{
                          clipPath: `conic-gradient(from ${offset}deg, transparent 0%, transparent 120deg, transparent 120deg)`,
                        }}
                      >
                        <div 
                          className={`w-full h-full rounded-full ${priorityBgColors[priorityKey]}`}
                          style={{
                            background: `conic-gradient(${priorityProgressColors[priorityKey]} ${percentage}%, transparent ${percentage}%)`,
                          }}
                        />
                      </div>
                    );
                  })}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center">
                      <span className="text-lg font-bold">{totalLeads}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Priority Breakdown */}
              <div className="space-y-2">
                {Object.entries(stats.byPriority).map(([priority, count]) => {
                  const priorityKey = priority as LeadPriority;
                  const percentage = totalLeads > 0 ? (count / totalLeads) * 100 : 0;
                  
                  return (
                    <div 
                      key={priority}
                      className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => filterByPriority(priorityKey)}
                    >
                      <div className="flex items-center">
                        <div 
                          className={`w-3 h-3 rounded-full mr-2 ${priorityProgressColors[priorityKey]}`}
                        />
                        <div 
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            priorityColors[priorityKey] || "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {priority}
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm font-semibold mr-2">{count}</span>
                        <span className="text-xs text-muted-foreground">({percentage.toFixed(1)}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
