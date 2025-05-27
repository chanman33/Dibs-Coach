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
import { fetchUserSessions } from '@/utils/actions/sessions'
import { format } from 'date-fns'
import { 
  DropdownMenu,
  DropdownMenuContent,
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
import { TransformedSession, SessionStatus, SESSION_STATUS } from '@/utils/types/session'
import Link from 'next/link'

interface TrainingHistoryClientProps {
  initialSessions?: TransformedSession[];
}

// Number of items to show per page
const ITEMS_PER_PAGE = 5;

// Define ALL_SESSION_STATUSES explicitly from the SESSION_STATUS object keys
const ALL_SESSION_STATUSES: SessionStatus[] = [
  SESSION_STATUS.SCHEDULED,
  SESSION_STATUS.COMPLETED,
  SESSION_STATUS.CANCELLED,
  SESSION_STATUS.NO_SHOW
  // Add other statuses here if they become part of the SESSION_STATUS object
];
type SessionStatusFilterType = SessionStatus;

// Helper function to determine the effective status of a session
const getEffectiveStatus = (session: TransformedSession): SessionStatusFilterType => {
  const sessionDate = new Date(session.startTime);
  const isUpcoming = sessionDate > new Date();

  if (session.status === SESSION_STATUS.SCHEDULED) {
    return isUpcoming ? SESSION_STATUS.SCHEDULED : SESSION_STATUS.COMPLETED;
  }
  return session.status as SessionStatus;
};

export function TrainingHistoryClient({ initialSessions }: TrainingHistoryClientProps) {
  const [allUserSessions, setAllUserSessions] = useState<TransformedSession[]>([])
  const [menteeHistory, setMenteeHistory] = useState<TransformedSession[]>([])
  const [filteredHistory, setFilteredHistory] = useState<TransformedSession[]>([])
  const [loading, setLoading] = useState(!initialSessions)
  const [tab, setTab] = useState('upcoming')
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState<'date' | 'coach' | 'duration'>('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [selectedSession, setSelectedSession] = useState<TransformedSession | null>(null)
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false)
  const [statusFilters, setStatusFilters] = useState<SessionStatusFilterType[]>([]);

  const processSessions = useCallback((sessions: TransformedSession[]): TransformedSession[] => {
    return sessions.filter(session => session.userRole === 'mentee');
  }, []);

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true)
      const result = await fetchUserSessions({})
      if (result.error) {
        console.error('[TRAINING_HISTORY_CLIENT_ERROR] Fetching sessions:', result.error)
        setAllUserSessions([])
        setMenteeHistory([])
        return
      }
      
      if (result.data) {
        setAllUserSessions(result.data);
        const menteeSessions = processSessions(result.data);
        setMenteeHistory(menteeSessions);
      } else {
        setAllUserSessions([]);
        setMenteeHistory([]);
      }
    } catch (error) {
      console.error('[TRAINING_HISTORY_CLIENT_ERROR] Loading sessions:', error)
      setAllUserSessions([])
      setMenteeHistory([])
    } finally {
      setLoading(false)
    }
  }, [processSessions])

  useEffect(() => {
    if (initialSessions) {
      console.log('[TRAINING_CLIENT] Received initial sessions:', {
        sessionCount: initialSessions.length,
        firstSession: initialSessions[0],
      });
      setAllUserSessions(initialSessions);
      const menteeSessions = processSessions(initialSessions);
      setMenteeHistory(menteeSessions);
      setLoading(false);
    } else {
      loadSessions()
    }
  }, [initialSessions, loadSessions, processSessions])
  
  useEffect(() => {
    if (tab !== 'all') {
      setStatusFilters([]);
    }
  }, [tab]);
  
  const mostRecentCoach = useMemo(() => {
    if (menteeHistory.length === 0) return null;
    const sortedHistory = [...menteeHistory].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    return sortedHistory[0]?.otherParty || null;
  }, [menteeHistory]);
  
  useEffect(() => {
    let filtered = [...menteeHistory];
    
    if (tab !== 'all') {
      if (tab === 'upcoming') {
        filtered = filtered.filter(item => new Date(item.startTime) > new Date() && item.status !== SESSION_STATUS.CANCELLED);
      } else if (tab === 'completed') {
        filtered = filtered.filter(item => {
          const sessionDate = new Date(item.startTime);
          const isPast = sessionDate <= new Date();
          return (isPast && item.status === SESSION_STATUS.SCHEDULED) || item.status === SESSION_STATUS.COMPLETED;
        });
      }
    } else {
      if (statusFilters.length > 0) {
        filtered = filtered.filter(item => {
          const effectiveStatus = getEffectiveStatus(item);
          return statusFilters.includes(effectiveStatus);
        });
      }
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => {
        const coachName = `${item.otherParty.firstName || ''} ${item.otherParty.lastName || ''}`.toLowerCase();
        return coachName.includes(query) ||
               format(new Date(item.startTime), 'MMM d, yyyy').toLowerCase().includes(query)
      });
    }
    
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return sortDirection === 'asc' 
          ? new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
          : new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
      } else if (sortBy === 'duration') {
        return sortDirection === 'asc'
          ? a.durationMinutes - b.durationMinutes
          : b.durationMinutes - a.durationMinutes;
      } else { 
        const nameA = `${a.otherParty.firstName || ''} ${a.otherParty.lastName || ''}`;
        const nameB = `${b.otherParty.firstName || ''} ${b.otherParty.lastName || ''}`;
        return sortDirection === 'asc'
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      }
    });
    
    setFilteredHistory(filtered);
    setCurrentPage(1); 
  }, [tab, menteeHistory, searchQuery, sortBy, sortDirection, statusFilters])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadSessions()
    setRefreshing(false)
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }

  const clearSearch = () => {
    setSearchQuery('');
  }

  const handleSort = (column: 'date' | 'coach' | 'duration') => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
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

  const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedHistory = filteredHistory.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  }

  const getStatusBadgeVariant = (status: SessionStatus): "default" | "destructive" | "outline" | "secondary" => {
    switch (status) {
      case SESSION_STATUS.COMPLETED: return 'secondary';
      case SESSION_STATUS.SCHEDULED: return 'default';
      case SESSION_STATUS.CANCELLED: return 'destructive';
      case SESSION_STATUS.NO_SHOW: return 'outline';
      default: return 'outline';
    }
  }

  const getSortIcon = (column: 'date' | 'coach' | 'duration') => {
    if (sortBy !== column) return null;
    return sortDirection === 'asc' ? '↑' : '↓';
  }

  const handleSessionClick = (session: TransformedSession) => {
    setSelectedSession(session)
    setIsSessionModalOpen(true)
  }

  if (loading && !initialSessions) {
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
        <h2 className="text-2xl font-semibold">Sessions</h2>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 mb-4">
          <TabsList className="grid grid-cols-3 w-full sm:w-auto sm:inline-grid">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center shrink-0">
            <Button 
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing || loading}
            >
              {refreshing || loading ? (
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

        <TabsContent value={tab} className="mt-0">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                  <CardTitle>Coaching Sessions</CardTitle>
                  <CardDescription>
                    {tab === 'all' 
                      ? 'All your coaching sessions as a mentee.'
                      : tab === 'upcoming'
                        ? 'Your upcoming coaching sessions as a mentee.'
                        : 'Your completed coaching sessions as a mentee.'}
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
              {loading && initialSessions && (
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
                          ? "You don't have any upcoming coaching sessions scheduled yet."
                          : tab === 'completed'
                            ? "You don't have any completed coaching sessions."
                            : "You don't have any coaching sessions as a mentee yet."
                    }
                  </p>
                  {tab === 'upcoming' && !searchQuery && filteredHistory.length === 0 && (
                    <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
                      <Button asChild>
                        <Link href="/coaches">Browse Coaches</Link>
                      </Button>
                      <Button 
                        asChild 
                        variant="outline" 
                        disabled={!mostRecentCoach}
                      >
                        {mostRecentCoach ? (
                          <Link href={`/profile/${mostRecentCoach.ulid}`}> 
                            Book with {mostRecentCoach.firstName || 'Last Coach'}
                          </Link>
                        ) : (
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
                        <TableHead className="cursor-pointer" onClick={() => handleSort('coach')}>
                          <div className="flex items-center gap-1">
                            Coach {getSortIcon('coach')}
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
                                    onSelect={(e) => e.preventDefault()}
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
                      {paginatedHistory.map((session) => {
                        const sessionDate = new Date(session.startTime);
                        const displayStatus = getEffectiveStatus(session);
                        const coachName = `${session.otherParty.firstName || ''} ${session.otherParty.lastName || ''}`.trim() || 'Unknown Coach';
                        
                        return (
                          <TableRow 
                            key={session.ulid} 
                            className="hover:bg-muted/50 cursor-pointer"
                            onClick={() => handleSessionClick(session)}
                          >
                            <TableCell className="font-medium">{coachName}</TableCell>
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
                                {session.durationMinutes} mins
                              </div>
                            </TableCell>
                            <TableCell>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge variant={getStatusBadgeVariant(displayStatus)}>
                                      {displayStatus === SESSION_STATUS.COMPLETED && (
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                      )}
                                      {displayStatus === SESSION_STATUS.SCHEDULED && (
                                        <Clock className="h-3 w-3 mr-1" />
                                      )}
                                      {displayStatus === SESSION_STATUS.CANCELLED && (
                                        <X className="h-3 w-3 mr-1" />
                                      )}
                                      {displayStatus === SESSION_STATUS.NO_SHOW && (
                                        <AlertCircle className="h-3 w-3 mr-1" />
                                      )}
                                      {displayStatus.charAt(0) + displayStatus.slice(1).toLowerCase().replace('_', ' ')}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    { session.status === SESSION_STATUS.COMPLETED 
                                      ? 'This session has been completed.'
                                      : (session.status === SESSION_STATUS.SCHEDULED && displayStatus === SESSION_STATUS.COMPLETED)
                                        ? 'This session was scheduled and is now past.'
                                        : (session.status === SESSION_STATUS.SCHEDULED && displayStatus === SESSION_STATUS.SCHEDULED)
                                          ? 'This session is scheduled for the future.'
                                          : session.status === SESSION_STATUS.CANCELLED 
                                            ? 'This session was cancelled.'
                                            : session.status === SESSION_STATUS.NO_SHOW
                                              ? 'A participant was marked as a no-show for this session.'
                                              : `Status: ${session.status}`
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
                        totalPages <= 5 || 
                        page === 1 || 
                        page === totalPages || 
                        (page >= currentPage - 2 && page <= currentPage + 2)
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

      <MenteeSessionDetailsModal
        session={selectedSession}
        isOpen={isSessionModalOpen}
        onClose={() => setIsSessionModalOpen(false)}
      />
    </div>
  )
}
