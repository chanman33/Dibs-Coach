"use client"

import React, { useCallback, useEffect, useState } from 'react'
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
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { MenteeSessionDetailsModal } from '../_components/MenteeSessionDetailsModal'
import { TransformedSession } from '@/utils/types/session'

type TrainingDisplay = {
  id: string;
  module: string;
  date: string;
  duration: number;
  status: string;
  sessionData: TransformedSession;
}

interface TrainingHistoryClientProps {
  initialData?: TrainingHistoryResponse;
}

// Number of items to show per page
const ITEMS_PER_PAGE = 5;

export function TrainingHistoryClient({ initialData }: TrainingHistoryClientProps) {
  const [history, setHistory] = useState<TrainingDisplay[]>([])
  const [filteredHistory, setFilteredHistory] = useState<TrainingDisplay[]>([])
  const [loading, setLoading] = useState(!initialData)
  const [tab, setTab] = useState('all')
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState<'date' | 'module' | 'duration'>('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [selectedSession, setSelectedSession] = useState<TransformedSession | null>(null)
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false)

  // Transform sessions data to display format
  const transformSessionsToDisplay = useCallback((data: TrainingHistoryResponse) => {
    return data.sessions.map(session => ({
      id: session.ulid,
      module: session.coach.name, // Using coach name as module for now
      date: session.startTime,
      duration: session.duration,
      status: session.status,
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
        setFilteredHistory(displayData)
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
      setFilteredHistory(displayData);
      setLoading(false);
    } else {
      loadTrainingHistory()
    }
  }, [initialData, loadTrainingHistory, transformSessionsToDisplay])

  useEffect(() => {
    let filtered = [...history];
    
    // Apply tab filter
    if (tab !== 'all') {
      if (tab === 'upcoming') {
        // Filter for future dates (includes both scheduled and rescheduled)
        filtered = filtered.filter(item => new Date(item.date) > new Date());
      } else if (tab === 'completed') {
        // Filter for completed sessions in the past
        filtered = filtered.filter(item => 
          item.status === 'COMPLETED' && new Date(item.date) <= new Date()
        );
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
      } else {
        return sortDirection === 'asc'
          ? a.module.localeCompare(b.module)
          : b.module.localeCompare(a.module);
      }
    });
    
    setFilteredHistory(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [tab, history, searchQuery, sortBy, sortDirection])

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
      setSortDirection('asc');
    }
  }

  // Pagination
  const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedHistory = filteredHistory.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  }

  const getStatusBadgeVariant = (status: string): "default" | "destructive" | "outline" | "secondary" => {
    switch (status) {
      case 'COMPLETED':
        return 'secondary';
      case 'SCHEDULED':
        return 'default';
      case 'CANCELLED':
        return 'destructive';
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

  if (loading) {
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
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <Skeleton className="h-12 w-full" />
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
            disabled={refreshing}
          >
            {refreshing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Refreshing...
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
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
          
          <TabsContent value={tab} className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div>
                    <CardTitle>Coaching Sessions</CardTitle>
                    <CardDescription>
                      {tab === 'all' 
                        ? 'All your coaching sessions from the platform.'
                        : tab === 'upcoming'
                          ? 'Your upcoming coaching sessions.'
                          : 'Your completed coaching sessions.'}
                    </CardDescription>
                  </div>
                  
                  <div className="relative w-full md:w-auto">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by coach or date..."
                      value={searchQuery}
                      onChange={handleSearch}
                      className="pl-9 pr-9 w-full"
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
                {filteredHistory.length === 0 ? (
                  <div className="text-center py-12 border rounded-md bg-muted/20">
                    <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No Sessions Found</h3>
                    <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                      {searchQuery 
                        ? "No coaching sessions match your search criteria. Try a different search term." 
                        : tab === 'all' 
                          ? "You don't have any coaching sessions yet." 
                          : tab === 'upcoming'
                            ? "You don't have any upcoming coaching sessions."
                            : "You don't have any completed coaching sessions."}
                    </p>
                    {searchQuery && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-4"
                        onClick={clearSearch}
                      >
                        Clear Search
                      </Button>
                    )}
                  </div>
                ) : (
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
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedHistory.map((training, index) => {
                          const sessionDate = new Date(training.date);
                          const isUpcoming = sessionDate > new Date();
                          
                          // Map status for display - retain CANCELLED status for visualization but show in appropriate tabs
                          const displayStatus = 
                            training.status === 'CANCELLED' ? 'CANCELLED' :
                            training.status === 'COMPLETED' ? 'COMPLETED' :
                            isUpcoming ? 'SCHEDULED' : 'COMPLETED';
                          
                          return (
                            <TableRow 
                              key={training.id || index} 
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
                                        {displayStatus === 'COMPLETED' && (
                                          <CheckCircle className="h-3 w-3 mr-1" />
                                        )}
                                        {displayStatus === 'CANCELLED' && (
                                          <X className="h-3 w-3 mr-1" />
                                        )}
                                        {displayStatus}
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {displayStatus === 'COMPLETED' 
                                        ? 'This session has been completed'
                                        : displayStatus === 'SCHEDULED' 
                                          ? 'This session is scheduled for the future' 
                                          : 'This session was cancelled'}
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
              
              {filteredHistory.length > 0 && (
                <CardFooter className="flex justify-between items-center border-t pt-6">
                  <div className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, filteredHistory.length)} of {filteredHistory.length} sessions
                  </div>
                  
                  <div className="flex items-center gap-2">
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
                        page === 1 || 
                        page === totalPages || 
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      )
                      .map((page, idx, array) => (
                        <React.Fragment key={page}>
                          {idx > 0 && array[idx - 1] !== page - 1 && (
                            <span className="text-muted-foreground">...</span>
                          )}
                          <Button
                            variant={currentPage === page ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </Button>
                        </React.Fragment>
                      ))
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
