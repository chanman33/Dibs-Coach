"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { LeadPriority, LeadStatus } from "@/utils/types/leads"
import { Search, Filter, X } from "lucide-react"

interface LeadFiltersProps {
  statusOptions: LeadStatus[]
  priorityOptions: LeadPriority[]
}

// Excel-inspired colors
const excelBlue = "#4472C4"
const excelRed = "#C00000"
const excelGreen = "#70AD47"
const excelYellow = "#FFC000"
const excelOrange = "#ED7D31"

export function LeadFilters({ statusOptions, priorityOptions }: LeadFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Get current filter values
  const currentStatus = searchParams.get("status") || "all"
  const currentPriority = searchParams.get("priority") || "all"
  const currentSearch = searchParams.get("search") || ""
  
  // Update filters
  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (value && value !== "all") {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    
    // Reset to first page when filters change
    params.set("page", "1")
    
    router.push(`?${params.toString()}`)
  }

  // Check if any filters are active
  const hasActiveFilters = currentStatus !== "all" || currentPriority !== "all" || currentSearch !== ""
  
  return (
    <div className="bg-white p-4 rounded-md border shadow-sm mb-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        {/* Search */}
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <Input
            placeholder="Search leads..."
            value={currentSearch}
            onChange={(e) => updateFilters("search", e.target.value)}
            className="pl-10 max-w-sm border-gray-300 focus:border-[#4472C4] focus:ring-[#4472C4]"
          />
        </div>
        
        {/* Status Filter */}
        <Select
          value={currentStatus}
          onValueChange={(value) => updateFilters("status", value)}
        >
          <SelectTrigger className="w-[180px] border-gray-300 focus:ring-[#4472C4]">
            <div className="flex items-center">
              <Filter className="h-4 w-4 mr-2 text-gray-400" />
              <SelectValue placeholder="Filter by status" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {statusOptions.map((status) => {
              // Get appropriate color based on status
              let statusColor = "#4472C4" // Default blue
              if (status === "WON") statusColor = excelGreen
              if (status === "LOST") statusColor = excelRed
              if (status === "NEGOTIATION") statusColor = "#5B9BD5" // Light blue
              if (status === "CONTACTED") statusColor = excelOrange
              if (status === "PROPOSAL") statusColor = excelYellow
              
              return (
                <SelectItem key={status} value={status}>
                  <div className="flex items-center">
                    <div 
                      className="w-2 h-2 rounded-full mr-2" 
                      style={{ backgroundColor: statusColor }}
                    />
                    {status.charAt(0) + status.slice(1).toLowerCase().replace("_", " ")}
                  </div>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
        
        {/* Priority Filter */}
        <Select
          value={currentPriority}
          onValueChange={(value) => updateFilters("priority", value)}
        >
          <SelectTrigger className="w-[180px] border-gray-300 focus:ring-[#4472C4]">
            <div className="flex items-center">
              <Filter className="h-4 w-4 mr-2 text-gray-400" />
              <SelectValue placeholder="Filter by priority" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            {priorityOptions.map((priority) => {
              // Get appropriate color based on priority
              let priorityColor = excelGreen // Default green for LOW
              if (priority === "MEDIUM") priorityColor = excelYellow
              if (priority === "HIGH") priorityColor = excelRed
              
              return (
                <SelectItem key={priority} value={priority}>
                  <div className="flex items-center">
                    <div 
                      className="w-2 h-2 rounded-full mr-2" 
                      style={{ backgroundColor: priorityColor }}
                    />
                    {priority.charAt(0) + priority.slice(1).toLowerCase()}
                  </div>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
        
        {/* Clear Filters */}
        <Button
          variant={hasActiveFilters ? "default" : "outline"}
          onClick={() => {
            router.push("?page=1")
          }}
          className={hasActiveFilters ? "bg-[#4472C4] hover:bg-[#3a62ab]" : ""}
        >
          <X className="h-4 w-4 mr-2" />
          Clear Filters
        </Button>
      </div>
    </div>
  )
}
