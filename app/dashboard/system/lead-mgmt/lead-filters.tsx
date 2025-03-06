import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { LeadPriority, LeadStatus } from "@/utils/types/leads"

interface LeadFiltersProps {
  statusOptions: LeadStatus[]
  priorityOptions: LeadPriority[]
}

export function LeadFilters({ statusOptions, priorityOptions }: LeadFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Get current filter values
  const currentStatus = searchParams.get("status") || ""
  const currentPriority = searchParams.get("priority") || ""
  const currentSearch = searchParams.get("search") || ""
  
  // Update filters
  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    
    // Reset to first page when filters change
    params.set("page", "1")
    
    router.push(`?${params.toString()}`)
  }
  
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center">
      {/* Search */}
      <div className="flex-1">
        <Input
          placeholder="Search leads..."
          value={currentSearch}
          onChange={(e) => updateFilters("search", e.target.value)}
          className="max-w-sm"
        />
      </div>
      
      {/* Status Filter */}
      <Select
        value={currentStatus}
        onValueChange={(value) => updateFilters("status", value)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Statuses</SelectItem>
          {statusOptions.map((status) => (
            <SelectItem key={status} value={status}>
              {status.charAt(0) + status.slice(1).toLowerCase().replace("_", " ")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {/* Priority Filter */}
      <Select
        value={currentPriority}
        onValueChange={(value) => updateFilters("priority", value)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter by priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Priorities</SelectItem>
          {priorityOptions.map((priority) => (
            <SelectItem key={priority} value={priority}>
              {priority.charAt(0) + priority.slice(1).toLowerCase()}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {/* Clear Filters */}
      <Button
        variant="outline"
        onClick={() => {
          router.push("?page=1")
        }}
      >
        Clear Filters
      </Button>
    </div>
  )
} 