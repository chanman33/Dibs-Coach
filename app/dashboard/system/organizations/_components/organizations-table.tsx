"use client"

import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  MoreHorizontal, 
  Building2, 
  Edit, 
  Users, 
  Settings, 
  BarChart3, 
  CreditCard,
  FileText,
  Clock
} from "lucide-react"
import { format } from 'date-fns'
import config from "@/config"

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

interface OrganizationsTableProps {
  organizations: Organization[]
  loading: boolean
}

export function OrganizationsTable({ organizations, loading }: OrganizationsTableProps) {
  const router = useRouter()

  const getBadgeVariant = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return 'success'
      case 'INACTIVE':
        return 'secondary'
      case 'SUSPENDED':
        return 'destructive'
      case 'PENDING':
        return 'warning'
      default:
        return 'outline'
    }
  }

  const getTierBadgeVariant = (tier: string) => {
    switch (tier.toUpperCase()) {
      case 'FREE':
        return 'secondary'
      case 'STARTER':
        return 'default'
      case 'PROFESSIONAL':
        return 'default'
      case 'ENTERPRISE':
        return 'success'
      case 'PARTNER':
        return 'default'
      default:
        return 'outline'
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy')
    } catch (error) {
      return 'Invalid date'
    }
  }

  const handleNavigation = (orgId: string, path: string) => {
    router.push(`/dashboard/system/organizations/${orgId}${path}`)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Organization</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Tier</TableHead>
            <TableHead>Members</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {organizations.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                No organizations found.
              </TableCell>
            </TableRow>
          ) : (
            organizations.map((org) => (
              <TableRow key={org.ulid}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{org.name}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {org.ulid}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {org.type}
                    {org.industry && (
                      <span className="text-xs text-muted-foreground">
                        ({org.industry})
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getBadgeVariant(org.status)}>{org.status}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getTierBadgeVariant(org.tier)}>{org.tier}</Badge>
                </TableCell>
                <TableCell>{org.memberCount || 0}</TableCell>
                <TableCell>{formatDate(org.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleNavigation(org.ulid, '')}>
                        <Building2 className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleNavigation(org.ulid, '/edit')}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Organization
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleNavigation(org.ulid, '/members')}>
                        <Users className="mr-2 h-4 w-4" />
                        Manage Members
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleNavigation(org.ulid, '/settings')}>
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleNavigation(org.ulid, '/analytics')}>
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Analytics
                      </DropdownMenuItem>
                      {config.payments.enabled && (
                        <DropdownMenuItem onClick={() => handleNavigation(org.ulid, '/billing')}>
                          <CreditCard className="mr-2 h-4 w-4" />
                          Billing
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleNavigation(org.ulid, '/activity')}>
                        <Clock className="mr-2 h-4 w-4" />
                        Activity Log
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
} 