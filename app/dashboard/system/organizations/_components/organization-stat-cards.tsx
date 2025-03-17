"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Users, Clock, CreditCard, BarChart3 } from "lucide-react"

// This is a placeholder type until we properly define it in utils/types
interface Organization {
  ulid: string
  name: string
  type: string
  industry?: string
  status: string
  tier: string
  createdAt: string
  updatedAt: string
  memberCount?: number
}

interface OrganizationStatCardsProps {
  data: Organization[]
}

export function OrganizationStatCards({ data }: OrganizationStatCardsProps) {
  // Calculate stats
  const totalOrganizations = data.length
  const activeOrganizations = data.filter(org => org.status === 'ACTIVE').length
  const enterpriseOrganizations = data.filter(org => org.tier === 'ENTERPRISE').length

  // Get most recent organization
  const sortedByDate = [...data].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
  const recentlyCreated = sortedByDate.length > 0 ? sortedByDate[0].name : 'None'

  // Calculate organization types
  const orgTypes = data.reduce((acc, org) => {
    acc[org.type] = (acc[org.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const topOrgType = Object.entries(orgTypes)
    .sort((a, b) => b[1] - a[1])
    .map(([type]) => type)[0] || 'None'

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="border-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalOrganizations}</div>
          <p className="text-xs text-muted-foreground">
            {activeOrganizations} active organizations
          </p>
        </CardContent>
      </Card>

      <Card className="border-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Enterprise Clients</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{enterpriseOrganizations}</div>
          <p className="text-xs text-muted-foreground">
            {((enterpriseOrganizations / totalOrganizations) * 100 || 0).toFixed(1)}% of total
          </p>
        </CardContent>
      </Card>

      <Card className="border-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Most Common Type</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{topOrgType}</div>
          <p className="text-xs text-muted-foreground">
            {orgTypes[topOrgType] || 0} organizations
          </p>
        </CardContent>
      </Card>

      <Card className="border-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Recently Created</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold truncate">{recentlyCreated}</div>
          <p className="text-xs text-muted-foreground">
            {sortedByDate.length > 0 
              ? new Date(sortedByDate[0].createdAt).toLocaleDateString() 
              : 'N/A'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
} 