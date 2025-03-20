"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, FileText, Search, ChevronLeft, ChevronRight, FilterX } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CoachingSession } from "@/utils/actions/business-portal/coaching-sessions"

interface RecentSessionNotesProps {
  sessions: CoachingSession[]
  formatDate: (dateString: string) => string
}

export function RecentSessionNotes({ sessions, formatDate }: RecentSessionNotesProps) {
  // Filter only sessions with notes
  const sessionsWithNotes = sessions.filter(session => session.status === "COMPLETED" && session.notes)
  
  // State for search, filtering, and pagination
  const [searchQuery, setSearchQuery] = useState("")
  const [dateFilter, setDateFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedSession, setSelectedSession] = useState<CoachingSession | null>(null)
  
  const notesPerPage = 5
  
  // Date filter options (current month, last 3 months, all time)
  const dateFilterOptions = [
    { label: "All Time", value: "all" },
    { label: "This Month", value: "current-month" },
    { label: "Last 3 Months", value: "last-3-months" },
    { label: "Last 6 Months", value: "last-6-months" },
  ]
  
  // Apply filters to sessions
  const filteredSessions = useMemo(() => {
    return sessionsWithNotes.filter(session => {
      // Apply name search filter
      const nameMatch = session.memberName.toLowerCase().includes(searchQuery.toLowerCase())
      
      // Apply date filter
      let dateMatch = true
      const sessionDate = new Date(session.date)
      const currentDate = new Date()
      
      if (dateFilter === "current-month") {
        const currentMonth = currentDate.getMonth()
        const currentYear = currentDate.getFullYear()
        dateMatch = 
          sessionDate.getMonth() === currentMonth && 
          sessionDate.getFullYear() === currentYear
      } else if (dateFilter === "last-3-months") {
        const threeMonthsAgo = new Date()
        threeMonthsAgo.setMonth(currentDate.getMonth() - 3)
        dateMatch = sessionDate >= threeMonthsAgo
      } else if (dateFilter === "last-6-months") {
        const sixMonthsAgo = new Date()
        sixMonthsAgo.setMonth(currentDate.getMonth() - 6)
        dateMatch = sessionDate >= sixMonthsAgo
      }
      
      return nameMatch && dateMatch
    })
  }, [sessionsWithNotes, searchQuery, dateFilter])
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredSessions.length / notesPerPage)
  const startIndex = (currentPage - 1) * notesPerPage
  const paginatedSessions = filteredSessions.slice(startIndex, startIndex + notesPerPage)
  
  // Modal functionality
  const openNoteModal = (session: CoachingSession) => {
    setSelectedSession(session)
    setIsModalOpen(true)
  }
  
  const resetFilters = () => {
    setSearchQuery("")
    setDateFilter("all")
    setCurrentPage(1)
  }
  
  // Handle pagination
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }
  
  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle>Recent Session Notes</CardTitle>
            <CardDescription>
              Notes from your team's coaching sessions
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {(searchQuery || dateFilter !== "all") && (
              <Button variant="outline" size="sm" onClick={resetFilters}>
                <FilterX className="h-4 w-4 mr-1" />
                Clear Filters
              </Button>
            )}
          </div>
        </div>
        
        {/* Filters row */}
        <div className="flex flex-wrap gap-3 mt-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by team member name..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1) // Reset to first page when searching
              }}
            />
          </div>
          <Select
            value={dateFilter}
            onValueChange={(value) => {
              setDateFilter(value)
              setCurrentPage(1) // Reset to first page when changing filter
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filter by date" />
            </SelectTrigger>
            <SelectContent>
              {dateFilterOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        {filteredSessions.length > 0 ? (
          <>
            <div className="space-y-4 pb-2">
              {paginatedSessions.map((session) => (
                <div 
                  key={session.id} 
                  className="border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors" 
                  onClick={() => openNoteModal(session)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={session.memberAvatar} alt={session.memberName} />
                        <AvatarFallback>{session.memberName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium">{session.memberName}</h4>
                        <p className="text-xs text-muted-foreground">{session.topic}</p>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(session.date)}
                    </div>
                  </div>
                  <p className="text-sm border-t pt-2 mt-2 line-clamp-2">
                    {session.notes}
                  </p>
                </div>
              ))}
            </div>
            
            {/* Pagination controls */}
            <div className="flex items-center justify-between pt-4 border-t mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {Math.min(startIndex + 1, filteredSessions.length)}-
                {Math.min(startIndex + notesPerPage, filteredSessions.length)} of {filteredSessions.length} notes
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPrevPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={currentPage >= totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p>No session notes match your filters</p>
            {(searchQuery || dateFilter !== "all") && (
              <Button variant="outline" size="sm" className="mt-4" onClick={resetFilters}>
                <FilterX className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
            )}
          </div>
        )}
      </CardContent>
      
      {/* Session Note Modal */}
      {selectedSession && (
        <Dialog open={isModalOpen} onOpenChange={(open) => !open && setIsModalOpen(false)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Session Notes</DialogTitle>
              <DialogDescription>
                {selectedSession.topic} with {selectedSession.memberName} on {formatDate(selectedSession.date)}
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex items-start gap-4 mb-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedSession.memberAvatar} alt={selectedSession.memberName} />
                <AvatarFallback>{selectedSession.memberName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-medium">{selectedSession.memberName}</h4>
                <div className="flex items-center text-sm text-muted-foreground gap-2">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{formatDate(selectedSession.date)}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-muted/40 p-4 rounded-md whitespace-pre-wrap text-sm">
              {selectedSession.notes || "No notes were taken for this session."}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  )
} 