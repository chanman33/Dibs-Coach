'use client'

import { useState, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchCoachSessions } from '@/utils/actions/sessions'
import { SESSION_STATUS, TransformedSession, SessionsAnalytics, defaultAnalytics } from '@/utils/types/session'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Search, Filter, Users, CheckCircle2, XCircle } from "lucide-react"
import { format } from 'date-fns'
import { Skeleton } from "@/components/ui/skeleton"
import Link from 'next/link'
import { SessionDetailsModal } from './CoachSessionDetailsModal'

// Status badge colors
const statusColorMap: Record<string, string> = {
  'SCHEDULED': 'bg-blue-500',
  'COMPLETED': 'bg-green-500',
  'CANCELLED': 'bg-red-500',
  'NO_SHOW': 'bg-yellow-500'
}

// Define possible session statuses for filtering and effective status calculation
const COACH_SESSION_STATUSES = ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] as const;
type CoachSessionStatusType = typeof COACH_SESSION_STATUSES[number];

// Helper function to determine the effective status of a coach's session
const getEffectiveCoachSessionStatus = (session: TransformedSession, nowString: string): CoachSessionStatusType => {
  if (!session || typeof session.status !== 'string' || typeof session.startTime !== 'string') {
    // Handle cases where session or its critical properties are undefined/malformed
    console.warn('[CoachDashboard] Invalid session object for effective status:', session);
    return 'SCHEDULED'; // Or some other default/error status
  }

  if (session.status === 'SCHEDULED') {
    const sessionStartTime = new Date(session.startTime);
    const now = new Date(nowString);
    return sessionStartTime <= now ? 'COMPLETED' : 'SCHEDULED';
  }

  // Ensure the raw status is a valid filterable status
  if (COACH_SESSION_STATUSES.includes(session.status as CoachSessionStatusType)) {
    return session.status as CoachSessionStatusType;
  }
  
  // Fallback for unexpected statuses
  console.warn(`[CoachDashboard] Unexpected session.status: ${session.status} for session id: ${session.ulid}`);
  return 'SCHEDULED'; // Default or choose a more appropriate fallback
};

/**
 * Format date safely without persisting Date objects in state/closures
 */
function formatDate(dateString: string, formatString: string): string {
  try {
    const date = new Date(dateString)
    return format(date, formatString)
  } catch (e) {
    console.error('Date formatting error:', e)
    return dateString
  }
}

/**
 * Coach Sessions Dashboard Component
 */
export function CoachSessionsDashboard() {
  // Local state for filtering and tabs
  const [filter, setFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTab, setSelectedTab] = useState('upcoming')
  const [selectedSession, setSelectedSession] = useState<TransformedSession | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Get current timestamp once for all comparisons
  const nowString = useMemo(() => new Date().toISOString(), [])

  // Fetch sessions data
  const { data: response, isLoading, error } = useQuery({
    queryKey: ['coach-sessions'],
    queryFn: async () => {
      console.log('[DEBUG_CLIENT] Calling fetchCoachSessions')
      try {
        // @ts-ignore - Temporarily ignore type error while type definitions are aligned
        const result = await fetchCoachSessions({})
        console.log('[DEBUG_CLIENT] fetchCoachSessions returned:', { 
          hasData: !!result?.data,
          dataLength: result?.data?.length || 0,
          hasError: !!result?.error,
          isResultSerializable: canSerialize(result || {})
        })
        return result
      } catch (error) {
        console.error('[DEBUG_CLIENT] Error calling fetchCoachSessions:', error)
        throw error
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    // Add parsing and serialization safety
    select: (data) => {
      console.log('[DEBUG_CLIENT] Processing response in select')
      // Force JSON serialization to ensure plain objects
      try {
        const serialized = JSON.parse(JSON.stringify(data))
        console.log('[DEBUG_CLIENT] Successfully serialized response')
        return serialized
      } catch (e) {
        console.error('[DEBUG_CLIENT] Failed to parse sessions data:', e)
        return { data: [], error: null }
      }
    }
  })

  // Helper function to check serializability
  function canSerialize(obj: any): boolean {
    if (obj === undefined) return false
    try {
      JSON.stringify(obj)
      return true
    } catch (e) {
      return false
    }
  }
  
  // Log errors
  useEffect(() => {
    if (error) {
      console.error('[DEBUG_CLIENT] Query error:', error)
    }
  }, [error])

  // Sessions data access with safe fallback
  const sessions = useMemo(() => {
    const result = response?.data || []
    console.log('[DEBUG_CLIENT] Sessions extracted from response:', { 
      count: result.length,
      isSerializable: canSerialize(result)
    })
    return result
  }, [response?.data])
  
  // Filter and sort sessions
  const filteredSessions = useMemo(() => {
    if (!sessions.length) return []
    
    let processedSessions = [...sessions]
      .filter((session: TransformedSession) => { 
        // Filter by search query (case insensitive) first
        return searchQuery === '' || 
          (session.otherParty.firstName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
          (session.otherParty.lastName?.toLowerCase() || '').includes(searchQuery.toLowerCase())
      })
      .map(session => ({
        ...session,
        effectiveStatus: getEffectiveCoachSessionStatus(session, nowString)
      }));

    // Then filter by tab
    if (selectedTab === 'upcoming') {
      processedSessions = processedSessions.filter(session => session.effectiveStatus === 'SCHEDULED');
    } else if (selectedTab === 'past') {
      processedSessions = processedSessions.filter(session => 
        ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(session.effectiveStatus)
      );
    } else { // 'all' tab
      // Apply status dropdown filter only on 'all' tab
      if (filter !== 'all') {
        processedSessions = processedSessions.filter(session => session.effectiveStatus === filter);
      }
    }
        
    // Finally, sort sessions
    return processedSessions.sort((a, b) => {
        // Sort by start time
        // For upcoming, ascending (sooner first). For past/all, descending (most recent first).
        const timeA = new Date(a.startTime).getTime();
        const timeB = new Date(b.startTime).getTime();
        return selectedTab === 'upcoming' ? timeA - timeB : timeB - timeA;
      })
  }, [sessions, searchQuery, filter, selectedTab, nowString])

  // Calculate analytics once
  const analytics: SessionsAnalytics = useMemo(() => {
    if (!sessions.length) return defaultAnalytics
    
    return sessions.reduce((acc: SessionsAnalytics, session: TransformedSession) => {
      // Use effective status for analytics
      const effectiveStatus = getEffectiveCoachSessionStatus(session, nowString);
      
      acc.total++ // Total always increments based on actual sessions processed
      
      // Increment the appropriate counter based on effective status
      switch (effectiveStatus) {
        case 'SCHEDULED': // This will now only count truly upcoming scheduled sessions
          acc.scheduled++
          break
        case 'COMPLETED': // This will count explicitly completed and past scheduled sessions
          acc.completed++
          break
        case 'CANCELLED':
          acc.cancelled++
          break
        case 'NO_SHOW':
          acc.no_show++
          break
      }
      
      return acc
    }, { ...defaultAnalytics }) // Start with a fresh copy of defaultAnalytics
  }, [sessions])

  // Handle view details
  const handleViewDetails = (session: TransformedSession) => {
    setSelectedSession(session)
    setIsModalOpen(true)
  }
  
  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  if (isLoading) {
    return <SessionsLoadingSkeleton />
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Coaching Sessions</h1>
          <p className="text-muted-foreground mt-1">Manage and track your coaching sessions</p>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <AnalyticsCard 
          title="Total Sessions" 
          value={analytics.total} 
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          description="All time sessions" 
        />
        <AnalyticsCard 
          title="Completed" 
          value={analytics.completed} 
          icon={<CheckCircle2 className="h-4 w-4 text-green-500" />}
          percentage={(analytics.completed / (analytics.total || 1) * 100).toFixed(0)}
          badgeColor="bg-green-100 text-green-700"
          description="Successfully completed" 
        />
        <AnalyticsCard 
          title="Upcoming" 
          value={analytics.scheduled} 
          icon={<Calendar className="h-4 w-4 text-blue-500" />}
          badgeText="Active"
          badgeColor="bg-blue-100 text-blue-700"
          description="Scheduled sessions" 
        />
        <AnalyticsCard 
          title="Cancelled/No-Show" 
          value={analytics.cancelled + analytics.no_show} 
          icon={<XCircle className="h-4 w-4 text-red-500" />}
          percentage={((analytics.cancelled + analytics.no_show) / (analytics.total || 1) * 100).toFixed(0)}
          badgeColor="bg-red-100 text-red-700"
          description="Missed sessions" 
        />
      </div>

      {/* Sessions List */}
      <Card>
        <CardHeader className="space-y-0">
          <div className="flex items-center justify-between pb-4">
            <CardTitle>Sessions</CardTitle>
            <Tabs defaultValue={selectedTab} onValueChange={setSelectedTab} className="w-auto">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="past">Past</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by mentee name..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {/* Conditionally render Status filter for Past and All tabs */}
            {(selectedTab === 'past' || selectedTab === 'all') && (
              <div className="w-full sm:w-auto"> {/* Container for Select, without flex-1 */} 
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter by Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {/* Options for Past tab */} 
                    {selectedTab === 'past' && (
                      <>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        <SelectItem value="NO_SHOW">No Show</SelectItem>
                      </>
                    )}
                    {/* Options for All tab (includes Scheduled) */} 
                    {selectedTab === 'all' && (
                      <>
                        <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        <SelectItem value="NO_SHOW">No Show</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {filteredSessions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>
                  {searchQuery ? 'No sessions match your search.'
                    : selectedTab === 'upcoming' ? 'You have no upcoming sessions scheduled.'
                    : selectedTab === 'past' ? 'You have no past sessions.'
                    : filter !== 'all' ? `No sessions match the status filter: ${filter}.`
                    : 'No sessions found.'}
                </p>
                {selectedTab === 'upcoming' && !searchQuery && sessions.filter((s: TransformedSession) => getEffectiveCoachSessionStatus(s, nowString) === 'SCHEDULED').length === 0 && (
                  <div className="mt-4">
                    <Button asChild>
                      <Link href="/dashboard/coach/share-profile">
                        Share Coaching Opportunity
                      </Link>
                    </Button>
                  </div>
                )}
                {(searchQuery || (filter !== 'all' && selectedTab === 'all')) && (
                  <Button variant="link" onClick={() => {
                    setFilter('all')
                    setSearchQuery('')
                  }}>
                    Clear filters
                  </Button>
                )}
              </div>
            ) : (
              filteredSessions.map((session) => (
                <SessionCard 
                  key={session.ulid} 
                  session={session} 
                  onViewDetails={handleViewDetails}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Session Details Modal */}
      <SessionDetailsModal 
        session={selectedSession} 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
      />
    </div>
  )
}

/**
 * Analytics Card Component
 */
interface AnalyticsCardProps {
  title: string
  value: number
  icon: React.ReactNode
  percentage?: string
  badgeText?: string
  badgeColor?: string
  description: string
}

function AnalyticsCard({ title, value, icon, percentage, badgeText, badgeColor, description }: AnalyticsCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold">{value}</div>
          {(percentage || badgeText) && (
            <Badge variant="secondary" className={badgeColor}>
              {percentage ? `${percentage}%` : badgeText}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  )
}

/**
 * Session Card Component
 */
interface SessionCardProps {
  session: TransformedSession
  onViewDetails: (session: TransformedSession) => void
}

function SessionCard({ session, onViewDetails }: SessionCardProps) {
  const mentee = session.otherParty
  const menteeName = [mentee.firstName, mentee.lastName].filter(Boolean).join(' ') || 'Unknown Mentee'
  
  // Determine effective status for display using the current time.
  // Note: nowString from the parent might be slightly stale if not passed down.
  // For card display, re-evaluating with new Date() might be more accurate if staleness is a concern,
  // but for consistency with filtering/analytics, we should ideally use the same `nowString`.
  // Assuming `nowString` is implicitly available or passed if needed, otherwise, define it locally for the card.
  // For this change, we'll assume `nowString` from parent is what we need or that this calculation happens in parent.
  // Let's refine this: The `SessionCard` is a pure display component. It should receive the effective status
  // or calculate it based on a `nowString` prop if dynamic updates within the card itself are needed.
  // Given the current structure, it's better to calculate effective status in the parent and pass it.
  // However, to minimize prop drilling for now and align with the direct `session.status` usage,
  // we'll call getEffectiveCoachSessionStatus here. A more robust solution might involve passing `nowString`.
  const nowStringForCard = useMemo(() => new Date().toISOString(), []); // Card specific 'now'
  const effectiveDisplayStatus = getEffectiveCoachSessionStatus(session, nowStringForCard);

  const statusColor = statusColorMap[effectiveDisplayStatus] || 'bg-gray-500'
  const formattedDate = formatDate(session.startTime, 'MMM d, yyyy')
  const formattedTime = formatDate(session.startTime, 'h:mm a')

  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer" 
      onClick={() => onViewDetails(session)}
    >
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div className="space-y-1 mb-4 md:mb-0">
            <div className="flex items-center gap-2">
              <h4 className="text-lg font-semibold">{menteeName}</h4>
              <Badge className={statusColor}>{effectiveDisplayStatus.charAt(0) + effectiveDisplayStatus.slice(1).toLowerCase().replace('_', ' ')}</Badge>
            </div>
            <div className="flex items-center text-muted-foreground gap-4">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" /> {formattedDate}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" /> {formattedTime}
              </span>
              <span>{session.durationMinutes} min</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {session.status === 'SCHEDULED' && (
              <>
                {session.zoomJoinUrl && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={session.zoomJoinUrl} target="_blank" rel="noopener noreferrer">
                      Join Zoom
                    </a>
                  </Button>
                )}
                <Button size="sm" onClick={() => onViewDetails(session)}>
                  View Details
                </Button>
              </>
            )}
            {session.status !== 'SCHEDULED' && (
              <Button size="sm" variant="outline" onClick={() => onViewDetails(session)}>
                View Details
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Loading Skeleton Component
 */
function SessionsLoadingSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48 mt-2" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array(4).fill(0).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array(3).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
