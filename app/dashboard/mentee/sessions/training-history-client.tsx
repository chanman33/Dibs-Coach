"use client"

import React, { useCallback, useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { 
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Loader2,
  Search,
  X,
  BookOpen,
  Filter,
  ChevronDown
} from 'lucide-react'
import { fetchTrainingHistory, TrainingHistoryResponse, TrainingSession } from '@/utils/actions/training'
import { format } from 'date-fns'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { MenteeSessionDetailsModal } from '../_components/MenteeSessionDetailsModal'
import { TransformedSession } from '@/utils/types/session'
import Link from 'next/link'

type TrainingDisplay = {
  id: string;
  module: string;
  date: string;
  duration: number;
  status: string; // This is the raw status from the DB
  sessionData: TransformedSession;
}

interface TrainingHistoryClientProps {
  initialData?: TrainingHistoryResponse;
}

// Number of items to show per page
const ITEMS_PER_PAGE = 5;

// Define possible session statuses for filtering (mirroring SessionStatus enum from Prisma)
const ALL_SESSION_STATUSES = ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED', 'ABSENT'] as const;
type SessionStatusFilterType = typeof ALL_SESSION_STATUSES[number];

// Helper function to determine the effective status of a session for filtering and display
const getEffectiveStatus = (item: TrainingDisplay): SessionStatusFilterType => {
  const sessionDate = new Date(item.date);
  const isUpcoming = sessionDate > new Date();

  if (item.status === 'SCHEDULED') {
    return isUpcoming ? 'SCHEDULED' : 'COMPLETED';
  }
  // Ensure the raw status is a valid filterable status, otherwise default or handle as error
  if (ALL_SESSION_STATUSES.includes(item.status as SessionStatusFilterType)) {
    return item.status as SessionStatusFilterType;
  }
  // Fallback for unexpected statuses, though item.status should be constrained by TrainingSession type
  console.warn(`[TrainingHistoryClient] Unexpected item.status: ${item.status} for item id: ${item.id}`);
  return 'SCHEDULED'; // Default or choose a more appropriate fallback
};

export function TrainingHistoryClient({ initialData }: TrainingHistoryClientProps) {
  const [history, setHistory] = useState<TrainingDisplay[]>([])
  const [filteredHistory, setFilteredHistory] = useState<TrainingDisplay[]>([])
  const [loading, setLoading] = useState(!initialData)
  const [tab, setTab] = useState('upcoming')
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState<'date' | 'module' | 'duration'>('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [selectedSession, setSelectedSession] = useState<TransformedSession | null>(null)
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false)
  const [statusFilters, setStatusFilters] = useState<SessionStatusFilterType[]>([]);

  // Transform sessions data to display format
  const transformSessionsToDisplay = useCallback((data: TrainingHistoryResponse) => {
    return data.sessions.map(session => ({
      id: session.ulid,
      module: session.coach.name, // Using coach name as module for now
      date: session.startTime,
      duration: session.duration,
      status: session.status, // Raw status
      // Store the full session data for the modal
      sessionData: {
        ulid: session.ulid,
        durationMinutes: session.duration,
        status: session.status,
        startTime: session.startTime,
        endTime: new Date(new Date(session.startTime).getTime() + session.duration * 60000).toISOString(),
        createdAt: new Date().toISOString(), // Since we don't have this in TrainingSession
        userRole: 'mentee' as const,
        otherParty: {
          ulid: session.coach.ulid,
          firstName: session.coach.name.split(' ')[0] || null,
          lastName: session.coach.name.split(' ').slice(1).join(' ') || null,
          email: null,
          profileImageUrl: null
        },
        sessionType: null,
        zoomJoinUrl: null,
        paymentStatus: null,
        price: 0,
        calBookingUid: session.calBookingUlid || null
      }
    }));
  }, []);

  const loadTrainingHistory = useCallback(async () => {
    try {
      setLoading(true)
      
      const result = await fetchTrainingHistory({})
      if (result.error) {
        console.error('[TRAINING_HISTORY_ERROR]', result.error)
        return
      }
      
      if (result.data) {
        const displayData = transformSessionsToDisplay(result.data);
        setHistory(displayData)
        setFilteredHistory(displayData) // Initialize filteredHistory
      }
    } catch (error) {
      console.error('[TRAINING_HISTORY_ERROR]', error)
    } finally {
      setLoading(false)
    }
  }, [transformSessionsToDisplay])

  useEffect(() => {
    if (initialData) {
      const displayData = transformSessionsToDisplay(initialData);
      setHistory(displayData);
      setFilteredHistory(displayData); // Initialize filteredHistory
      setLoading(false);
    } else {
      loadTrainingHistory()
    }
  }, [initialData, loadTrainingHistory, transformSessionsToDisplay])

  // Effect to clear status filters when tab changes from 'all'
  useEffect(() => {
    if (tab !== 'all') {
      setStatusFilters([]);
    }
  }, [tab]);
  
  // Find the most recent coach for the follow-up CTA
  const mostRecentCoach = useMemo(() => {
    if (history.length === 0) return null;
    // Sort all sessions by date descending to find the most recent one
    const sortedHistory = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const lastSession = sortedHistory[0];
    // Assuming sessionData.otherParty contains coach details
    return lastSession?.sessionData?.otherParty || null;
  }, [history]);
  
  useEffect(() => {
    let filtered = [...history];
    
    // Apply tab filter OR status filter on 'all' tab
    if (tab !== 'all') {
      // Logic for 'upcoming' and 'completed' tabs remains the same
      if (tab === 'upcoming') {
        filtered = filtered.filter(item => new Date(item.date) > new Date() && item.status !== 'CANCELLED');
      } else if (tab === 'completed') {
        filtered = filtered.filter(item => {
          const sessionDate = new Date(item.date);
          const isPast = sessionDate <= new Date();
          return isPast && (item.status === 'COMPLETED' || item.status === 'SCHEDULED');
        });
      }
    } else {
      // Apply status filter on 'all' tab using effective status
      if (statusFilters.length > 0) {
        filtered = filtered.filter(item => {
          const effectiveStatus = getEffectiveStatus(item);
          return statusFilters.includes(effectiveStatus);
        });
      }
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.module.toLowerCase().includes(query) ||
        format(new Date(item.date), 'MMM d, yyyy').toLowerCase().includes(query)
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return sortDirection === 'asc' 
          ? new Date(a.date).getTime() - new Date(b.date).getTime()
          : new Date(b.date).getTime() - new Date(a.date).getTime();
      } else if (sortBy === 'duration') {
        return sortDirection === 'asc'
          ? a.duration - b.duration
          : b.duration - a.duration;
      } else { // module sort
        return sortDirection === 'asc'
          ? a.module.localeCompare(b.module)
          : b.module.localeCompare(a.module);
      }
    });
    
    setFilteredHistory(filtered);
    setCurrentPage(1); // Reset to first page when filtering or sorting
  }, [tab, history, searchQuery, sortBy, sortDirection, statusFilters])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadTrainingHistory()
    setRefreshing(false)
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }

  const clearSearch = () => {
    setSearchQuery('');
  }

  const handleSort = (column: 'date' | 'module' | 'duration') => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc'); // Default to ascending when changing column
    }
  }

  const handleStatusFilterChange = (status: SessionStatusFilterType) => {
    setStatusFilters(prevFilters => 
      prevFilters.includes(status) 
        ? prevFilters.filter(s => s !== status) 
        : [...prevFilters, status]
    );
  }

  const clearStatusFilters = () => {
    setStatusFilters([]);
  }

  // Pagination
  const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedHistory = filteredHistory.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  }

  const getStatusBadgeVariant = (status: string): "default" | "destructive" | "outline" | "secondary" => {
    // This function determines badge color based on possibly derived displayStatus
    switch (status) {
      case 'COMPLETED':
        return 'secondary'; // Greenish in shadcn/ui
      case 'SCHEDULED':
        return 'default'; // Blueish
      case 'CANCELLED':
        return 'destructive'; // Reddish
      case 'RESCHEDULED': // Added for completeness, if it appears
         return 'outline'; // Default outline
      case 'ABSENT': // Added for completeness
         return 'outline'; 
      default:
        return 'outline';
    }
  }

  const getSortIcon = (column: 'date' | 'module' | 'duration') => {
    if (sortBy !== column) return null;
    return sortDirection === 'asc' ? '↑' : '↓';
  }

  const handleSessionClick = (training: TrainingDisplay) => {
    setSelectedSession(training.sessionData)
    setIsSessionModalOpen(true)
  }

  if (loading && !initialData) { // Only show full page skeleton if no initial data
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Skeleton className="h-12 w-full" />
        <Card>
          <CardHeader className="pb-2">
            <Skeleton className="h-6 w-44 mb-2" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                <div key={i} className="flex justify-between items-center p-4 border-b last:border-b-0">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-6 w-24" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h2 className="text-2xl font-semibold">Session History</h2>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing || loading} // Disable refresh if also loading initial
          >
            {refreshing || loading ? ( // Show loader if refreshing or initial loading
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {loading ? 'Loading...' : 'Refreshing...'}
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-start">
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid grid-cols-3 w-full md:w-auto md:inline-grid">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
          
          <TabsContent value={tab} className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div>
                    <CardTitle>Coaching Sessions</CardTitle>
                    <CardDescription>
                      {tab === 'all' 
                        ? 'All your coaching sessions.'
                        : tab === 'upcoming'
                          ? 'Your upcoming coaching sessions.'
                          : 'Your completed coaching sessions.'}
                       {tab === 'all' && statusFilters.length > 0 && ` (Filtered by status)`}
                    </CardDescription>
                  </div>
                  
                  <div className="relative w-full md:w-auto">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by coach or date..."
                      value={searchQuery}
                      onChange={handleSearch}
                      className="pl-9 pr-9 w-full md:min-w-[300px]"
                    />
                    {searchQuery && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                        onClick={clearSearch}
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Clear</span>
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {loading && initialData && ( // Show skeleton rows if loading more after initial data
                   <div className="space-y-4">
                    {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                      <div key={i} className="flex justify-between items-center p-4 border-b last:border-b-0">
                        <div className="space-y-1"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-24" /></div>
                        <Skeleton className="h-4 w-20" /><Skeleton className="h-4 w-16" /><Skeleton className="h-6 w-24" />
                      </div>
                    ))}
                  </div>
                )}
                {!loading && filteredHistory.length === 0 ? (
                  <div className="text-center py-12 border rounded-md bg-muted/20">
                    <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No Sessions Found</h3>
                    <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                      {searchQuery 
                        ? "No coaching sessions match your search criteria. Try a different search term." 
                        : statusFilters.length > 0 && tab === 'all'
                          ? "No sessions match the selected status filters."
                          : tab === 'upcoming'
                            ? "You don\'t have any upcoming coaching sessions scheduled yet."
                            : tab === 'completed'
                              ? "You don\'t have any completed coaching sessions."
                              : "You don\'t have any coaching sessions yet." // Default for 'all' tab with no filters
                      }
                    </p>
                    {/* CTA for no upcoming sessions */}
                    {tab === 'upcoming' && !searchQuery && filteredHistory.length === 0 && (
                      <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
                        <Button asChild>
                          <Link href="/coaches">Browse Coaches</Link>
                        </Button>
                        <Button 
                          asChild 
                          variant="outline" 
                          disabled={!mostRecentCoach} // Disable if no recent coach found
                        >
                          {mostRecentCoach ? (
                            <Link href={`/coaches/${mostRecentCoach.ulid}/booking`}> {/* Updated path */} 
                              Book with {mostRecentCoach.firstName || 'Last Coach'}
                            </Link>
                          ) : (
                            // Fallback if Link cannot be rendered without href, though disabled should handle it
                            <span>Book Follow-up</span>
                          )}
                        </Button>
                      </div>
                    )}
                    {(searchQuery || (statusFilters.length > 0 && tab === 'all')) && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-4"
                        onClick={() => {
                          if (searchQuery) clearSearch();
                          if (statusFilters.length > 0) clearStatusFilters();
                        }}
                      >
                        Clear Filters
                      </Button>
                    )}
                  </div>
                ) : !loading && (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="cursor-pointer" onClick={() => handleSort('module')}>
                            <div className="flex items-center gap-1">
                              Coach {getSortIcon('module')}
                            </div>
                          </TableHead>
                          <TableHead className="cursor-pointer" onClick={() => handleSort('date')}>
                            <div className="flex items-center gap-1">
                              Date {getSortIcon('date')}
                            </div>
                          </TableHead>
                          <TableHead>
                            <div className="flex items-center gap-1">
                              Start Time
                            </div>
                          </TableHead>
                          <TableHead className="cursor-pointer" onClick={() => handleSort('duration')}>
                            <div className="flex items-center gap-1">
                              Duration {getSortIcon('duration')}
                            </div>
                          </TableHead>
                          <TableHead>
                            {tab === 'all' ? (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="p-0 h-auto hover:bg-transparent data-[state=open]:bg-accent">
                                    <div className="flex items-center gap-1">
                                      Status
                                      <Filter className={`h-3 w-3 ${statusFilters.length > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
                                    </div>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                  <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  {ALL_SESSION_STATUSES.map(statusValue => (
                                    <DropdownMenuCheckboxItem
                                      key={statusValue}
                                      checked={statusFilters.includes(statusValue)}
                                      onCheckedChange={() => handleStatusFilterChange(statusValue)}
                                      onSelect={(e) => e.preventDefault()} // Prevent closing on select
                                    >
                                      {statusValue.charAt(0) + statusValue.slice(1).toLowerCase().replace('_', ' ')}
                                    </DropdownMenuCheckboxItem>
                                  ))}
                                  {statusFilters.length > 0 && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={clearStatusFilters} className="text-destructive">
                                        Clear Status Filters
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            ) : (
                              "Status"
                            )}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedHistory.map((training) => {
                          const sessionDate = new Date(training.date);
                          // const isUpcoming = sessionDate > new Date(); // No longer needed here, handled by getEffectiveStatus
                          
                          // Determine displayStatus using the centralized getEffectiveStatus function
                          const displayStatus = getEffectiveStatus(training);
                          
                          return (
                            <TableRow 
                              key={training.id} 
                              className="hover:bg-muted/50 cursor-pointer"
                              onClick={() => handleSessionClick(training)}
                            >
                              <TableCell className="font-medium">{training.module}</TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                                  {format(sessionDate, 'MMM d, yyyy')}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                                  {format(sessionDate, 'p')}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  {training.duration} mins
                                </div>
                              </TableCell>
                              <TableCell>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge variant={getStatusBadgeVariant(displayStatus)}>
                                        {displayStatus === 'COMPLETED' && training.status !== 'SCHEDULED' && ( // Show check only if truly completed
                                          <CheckCircle className="h-3 w-3 mr-1" />
                                        )}
                                         {displayStatus === 'COMPLETED' && training.status === 'SCHEDULED' && ( // Or if scheduled and past
                                          <CheckCircle className="h-3 w-3 mr-1 text-orange-500" /> // Different color for inferred completed
                                        )}
                                        {displayStatus === 'SCHEDULED' && (
                                          <Clock className="h-3 w-3 mr-1" />
                                        )}
                                        {displayStatus === 'CANCELLED' && (
                                          <X className="h-3 w-3 mr-1" />
                                        )}
                                        {displayStatus === 'RESCHEDULED' && (
                                          <RefreshCw className="h-3 w-3 mr-1" />
                                        )}
                                        {displayStatus === 'ABSENT' && (
                                          <AlertCircle className="h-3 w-3 mr-1" />
                                        )}
                                        {displayStatus.charAt(0) + displayStatus.slice(1).toLowerCase().replace('_', ' ')}
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {/* Adjust tooltip content based on raw status and effective display for clarity */}
                                      {training.status === 'COMPLETED' 
                                        ? 'This session has been completed.'
                                        : (training.status === 'SCHEDULED' && displayStatus === 'COMPLETED')
                                          ? 'This session was scheduled and is now past.'
                                          : (training.status === 'SCHEDULED' && displayStatus === 'SCHEDULED')
                                            ? 'This session is scheduled for the future.'
                                            : training.status === 'CANCELLED' 
                                              ? 'This session was cancelled.'
                                              : training.status === 'RESCHEDULED'
                                                ? 'This session was rescheduled.'
                                                : training.status === 'ABSENT'
                                                  ? 'A participant was absent for this session.'
                                                  : `Status: ${training.status}` // Fallback for any other raw statuses
                                      }
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
              
              {!loading && filteredHistory.length > 0 && (
                <CardFooter className="flex flex-col sm:flex-row justify-between items-center border-t pt-6 gap-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {Math.min(startIndex + 1, filteredHistory.length)} to {Math.min(startIndex + ITEMS_PER_PAGE, filteredHistory.length)} of {filteredHistory.length} sessions
                  </div>
                  
                  {totalPages > 1 && (
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(page => 
                          totalPages <= 5 || // show all if 5 or less
                          page === 1 || 
                          page === totalPages || 
                          (page >= currentPage - 2 && page <= currentPage + 2) // show 2 around current
                        )
                        .map((page, idx, array) => {
                          const isEllipsis = idx > 0 && array[idx-1] !== page -1;
                          return (
                            <React.Fragment key={page}>
                              {isEllipsis && totalPages > 5 && (
                                <span className="text-muted-foreground h-9 px-3 flex items-center">...</span>
                              )}
                              <Button
                                variant={currentPage === page ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => handlePageChange(page)}
                                className="w-9 h-9 p-0"
                              >
                                {page}
                              </Button>
                            </React.Fragment>
                          )
                        })
                      }
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </CardFooter>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Session Details Modal */}
      <MenteeSessionDetailsModal
        session={selectedSession}
        isOpen={isSessionModalOpen}
        onClose={() => setIsSessionModalOpen(false)}
      />
    </div>
  )
}
