import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LEAD_STATUS, LEAD_PRIORITY, type LeadStatus, type LeadPriority } from "@/utils/types/leads"

interface LeadStatsProps {
  stats: {
    total: number
    byStatus: Record<LeadStatus, number>
    byPriority: Record<LeadPriority, number>
  } | null
}

const statusColors: Record<LeadStatus, string> = {
  NEW: "bg-blue-100 text-blue-800",
  CONTACTED: "bg-yellow-100 text-yellow-800",
  QUALIFIED: "bg-purple-100 text-purple-800",
  PROPOSAL: "bg-indigo-100 text-indigo-800",
  NEGOTIATION: "bg-orange-100 text-orange-800",
  WON: "bg-green-100 text-green-800",
  LOST: "bg-red-100 text-red-800",
  ARCHIVED: "bg-gray-100 text-gray-800"
}

const priorityColors: Record<LeadPriority, string> = {
  LOW: "bg-green-100 text-green-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  HIGH: "bg-red-100 text-red-800"
}

export function LeadStats({ stats }: LeadStatsProps) {
  if (!stats) return null
  
  const wonLeads = stats.byStatus.WON || 0
  const totalLeads = stats.total || 0
  const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : "0.0"

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      {/* Total Leads */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
        </CardContent>
      </Card>
      
      {/* By Status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">By Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.byStatus).map(([status, count]) => (
              <div
                key={status}
                className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  statusColors[status as LeadStatus] || "bg-gray-100 text-gray-800"
                }`}
              >
                {status}: {count}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* By Priority */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">By Priority</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.byPriority).map(([priority, count]) => (
              <div
                key={priority}
                className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  priorityColors[priority as LeadPriority] || "bg-gray-100 text-gray-800"
                }`}
              >
                {priority}: {count}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Conversion Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{conversionRate}%</div>
          <p className="text-xs text-muted-foreground">
            {wonLeads} won out of {totalLeads} total
          </p>
        </CardContent>
      </Card>
    </div>
  )
} 