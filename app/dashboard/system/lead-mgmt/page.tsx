import { Suspense } from "react"
import { getLeads, getLeadStats } from "@/utils/actions/lead-actions"
import { DataTable } from "@/components/ui/data-table"
import { Card, CardContent } from "@/components/ui/card"
import { LEAD_STATUS, LEAD_PRIORITY, type LeadStatus, type LeadPriority } from "@/utils/types/leads"
import { LeadFilters } from "./lead-filters"
import { LeadStats } from "./lead-stats"
import { columns } from "./columns"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function LeadsPage({
  searchParams
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const page = Number(searchParams.page) || 1
  const limit = Number(searchParams.limit) || 10
  const status = (searchParams.status as LeadStatus) || undefined
  const priority = (searchParams.priority as LeadPriority) || undefined
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
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
      </div>

      {/* Lead Stats */}
      <LeadStats stats={statsResponse.data} />

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