"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Building, 
  Plus, 
  Search, 
  ArrowUpDown, 
  MoreHorizontal, 
  Edit, 
  Trash, 
  Eye,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { 
  Card, 
  CardContent, 
  CardFooter
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/use-toast'
import { Pagination } from '@/components/ui/pagination'
import { fetchAllOrganizations } from '@/utils/actions/organization-actions'

interface Organization {
  ulid: string
  name: string
  type: string
  industry: string
  tier: string
  status: string
  memberCount: number
}

export default function OrganizationsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [filteredOrganizations, setFilteredOrganizations] = useState<Organization[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchOrganizations = async () => {
    try {
      setLoading(true)
      const result = await fetchAllOrganizations()
      
      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive'
        })
        return
      }
      
      if (!result.data) {
        setOrganizations([])
        setFilteredOrganizations([])
        setLoading(false)
        return
      }
      
      const organizationsData = result.data as Organization[]
      setOrganizations(organizationsData)
      setFilteredOrganizations(organizationsData)
    } catch (error) {
      console.error('[FETCH_ORGANIZATIONS_ERROR]', error)
      toast({
        title: 'Error',
        description: 'Failed to load organizations',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrganizations()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      const filtered = organizations.filter(org => 
        org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.industry?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.tier.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.status.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredOrganizations(filtered)
      setCurrentPage(1) // Reset to first page when filtering
    } else {
      setFilteredOrganizations(organizations)
    }
  }, [searchTerm, organizations])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortDirection('asc')
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchOrganizations()
    setIsRefreshing(false)
  }

  const getSortedOrganizations = () => {
    return [...filteredOrganizations].sort((a, b) => {
      if (sortBy === 'memberCount') {
        return sortDirection === 'asc' 
          ? a.memberCount - b.memberCount
          : b.memberCount - a.memberCount
      }
      
      const aValue = a[sortBy as keyof Organization] || ''
      const bValue = b[sortBy as keyof Organization] || ''
      
      return sortDirection === 'asc'
        ? aValue.toString().localeCompare(bValue.toString())
        : bValue.toString().localeCompare(aValue.toString())
    })
  }

  // Pagination logic
  const totalPages = Math.ceil(filteredOrganizations.length / itemsPerPage)
  const paginatedOrganizations = getSortedOrganizations().slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // Scroll to top of the table
    const tableElement = document.querySelector('.organizations-table')
    if (tableElement) {
      tableElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return 'default'
      case 'PENDING':
        return 'secondary'
      case 'SUSPENDED':
        return 'destructive'
      case 'ARCHIVED':
        return 'secondary'
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
        return 'default'
      case 'PARTNER':
        return 'default'
      default:
        return 'outline'
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
          <p className="text-muted-foreground mt-1">
            Manage and monitor organizations in the platform
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link href="/dashboard/system/organizations/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Organization
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search by name, type, industry, tier or status..." 
          value={searchTerm}
          onChange={handleSearch}
          className="max-w-md pl-9"
        />
      </div>
      
      <Card>
        <CardContent className="organizations-table pt-6">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredOrganizations.length === 0 ? (
            <div className="text-center py-10">
              <Building className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No organizations found</h3>
              <p className="text-muted-foreground mt-2">
                {searchTerm 
                  ? "No organizations match your search criteria" 
                  : "No organizations have been created yet"}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <div className="max-h-[600px] overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead className="w-[250px]">
                        <Button
                          variant="ghost"
                          onClick={() => handleSort('name')}
                          className="flex items-center gap-1 font-medium"
                        >
                          Organization
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="hidden md:table-cell">
                        <Button
                          variant="ghost"
                          onClick={() => handleSort('type')}
                          className="flex items-center gap-1 font-medium"
                        >
                          Type
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="hidden lg:table-cell">
                        <Button
                          variant="ghost"
                          onClick={() => handleSort('tier')}
                          className="flex items-center gap-1 font-medium"
                        >
                          Tier
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort('status')}
                          className="flex items-center gap-1 font-medium"
                        >
                          Status
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-center hidden sm:table-cell">
                        <Button
                          variant="ghost"
                          onClick={() => handleSort('memberCount')}
                          className="flex items-center gap-1 font-medium justify-center"
                        >
                          Members
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="w-[120px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedOrganizations.map((org) => (
                      <TableRow key={org.ulid}>
                        <TableCell>
                          <div className="font-medium">{org.name}</div>
                          <div className="text-xs text-muted-foreground md:hidden">
                            {org.type} {org.industry ? `· ${org.industry}` : ''}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div>{org.type}</div>
                          <div className="text-xs text-muted-foreground hidden lg:block">
                            {org.industry}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <Badge variant={getTierBadgeVariant(org.tier) as any}>
                            {org.tier}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(org.status) as any}>
                            {org.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center hidden sm:table-cell">{org.memberCount}</TableCell>
                        <TableCell className="text-right space-x-1">
                          <Link href={`/dashboard/system/organizations/${org.ulid}`} className="inline-flex">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View</span>
                            </Button>
                          </Link>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">More options</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/system/organizations/${org.ulid}#members`}>
                                  Manage Members
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/system/organizations/${org.ulid}#settings`}>
                                  Settings
                                </Link>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
        {filteredOrganizations.length > 0 && !loading && (
          <CardFooter className="flex justify-between items-center border-t px-6 py-4">
            <div className="text-sm text-muted-foreground">
              Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredOrganizations.length)} to {Math.min(currentPage * itemsPerPage, filteredOrganizations.length)} of {filteredOrganizations.length} organizations
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
