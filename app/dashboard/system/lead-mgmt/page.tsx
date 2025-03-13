import { Suspense } from "react"
import { getLeads, getLeadStats } from "@/utils/actions/lead-actions"
import { DataTable } from "@/components/ui/data-table"
import { Card, CardContent } from "@/components/ui/card"
import { LEAD_STATUS, LEAD_PRIORITY, type LeadStatus, type LeadPriority } from "@/utils/types/leads"
import { LeadFilters } from "./_components/lead-filters"
import { LeadStats } from "./_components/lead-stats"
import { columns } from "./_components/columns"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function LeadsPage({
  searchParams
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const page = Number(searchParams.page) || 1
  const limit = Number(searchParams.limit) || 10
  
  // Handle 'all' value for status and priority
  const statusParam = searchParams.status as string
  const priorityParam = searchParams.priority as string
  
  const status = statusParam && statusParam !== 'all' ? (statusParam as LeadStatus) : undefined
  const priority = priorityParam && priorityParam !== 'all' ? (priorityParam as LeadPriority) : undefined
  const search = searchParams.search as string || undefined

  const [leadsResponse, statsResponse] = await Promise.all([
    getLeads({
      page,
      limit,
      status,
      priority,
      search
    }),
    getLeadStats()
  ])

  return (
    <div className="container space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Lead Management</h1>
      </div>


      {/* Lead Filters */}
      <LeadFilters
        statusOptions={Object.values(LEAD_STATUS)}
        priorityOptions={Object.values(LEAD_PRIORITY)}
      />

      {/* Leads Table */}
      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={leadsResponse.data?.leads || []}
            searchKey="companyName"
          />
        </CardContent>
      </Card>
    </div>
  )
} 