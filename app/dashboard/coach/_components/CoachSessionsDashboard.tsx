'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchCoachSessions } from '@/utils/actions/sessions'
import { TransformedSession, SessionStatus } from '@/utils/types/session'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Search, Filter, Users, CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import { format } from 'date-fns'
import { Skeleton } from "@/components/ui/skeleton"
import Link from 'next/link'

interface Analytics {
  total: number
  scheduled: number
  completed: number
  cancelled: number
  no_show: number
}

// Status badge colors
const getStatusColor = (status: string) => {
  // Normalize status to lowercase for comparison
  const lowerStatus = status.toLowerCase();
  switch (lowerStatus) {
    case SessionStatus.SCHEDULED.toLowerCase():
      return 'bg-blue-500'
    case SessionStatus.COMPLETED.toLowerCase():
      return 'bg-green-500'
    case SessionStatus.CANCELLED.toLowerCase():
      return 'bg-red-500'
    case SessionStatus.NO_SHOW.toLowerCase():
      return 'bg-yellow-500'
    default:
      return 'bg-gray-500'
  }
}

/**
 * Safely formats a date string without persisting a Date object in a closure
 */
function formatDate(dateString: string, formatString: string): string {
  try {
    // Use a local function variable so the Date object isn't captured in a closure
    const date = new Date(dateString);
    return format(date, formatString);
  } catch (e) {
    console.error('Date formatting error:', e);
    return dateString;
  }
}

/**
 * Dashboard component that shows coach sessions
 */
export function CoachSessionsDashboard() {
  // State hooks
  const [filter, setFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTab, setSelectedTab] = useState('upcoming')

  // Get the current ISO string without creating a Date object in state
  const nowString = useMemo(() => new Date().toISOString(), []);

  // Fetch sessions data
  const { data: response, isLoading } = useQuery({
    queryKey: ['coach-sessions'],
    queryFn: fetchCoachSessions,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000 // 5 minutes
  })

  // Get sessions data
  const sessions = useMemo(() => {
    // Make sure we're working with a fresh array
    return Array.isArray(response?.data) ? [...response.data] : [];
  }, [response?.data]);

  // Check if the coach has any sessions
  const hasNoSessions = useMemo(() => sessions.length === 0, [sessions]);

  // Filter and sort sessions
  const filteredSessions = useMemo(() => {
    // If there are no sessions, return an empty array
    if (hasNoSessions) return [];
    
    return [...sessions]
      .filter((session: TransformedSession) => {
        // Filter by search query
        const matchesSearch = searchQuery === '' || 
          (session.otherParty.firstName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
          (session.otherParty.lastName?.toLowerCase() || '').includes(searchQuery.toLowerCase());
        
        // Filter by status - normalize to same case for comparison
        const matchesFilter = filter === 'all' || session.status === filter;
        
        // Filter by tab - compare string timestamps
        const isUpcoming = session.startTime > nowString;
        const matchesTab = selectedTab === 'upcoming' ? isUpcoming : !isUpcoming;

        return matchesSearch && matchesFilter && matchesTab;
      })
      .sort((a: TransformedSession, b: TransformedSession) => {
        // Sort by start time
        if (selectedTab === 'upcoming') {
          return a.startTime > b.startTime ? 1 : -1;
        } else {
          return a.startTime < b.startTime ? 1 : -1;
        }
      });
  }, [sessions, searchQuery, filter, selectedTab, nowString, hasNoSessions]);

  // Calculate analytics
  const analytics = useMemo(() => {
    // Create a fresh object with default values
    const result = {
      total: 0,
      scheduled: 0,
      completed: 0,
      cancelled: 0,
      no_show: 0
    };
    
    // If there are no sessions, return the default values
    if (hasNoSessions) return result;
    
    // Count sessions by status
    sessions.forEach((session: TransformedSession) => {
      result.total++;
      
      // Convert status to lowercase for comparison
      const status = session.status.toLowerCase();
      if (status === SessionStatus.SCHEDULED.toLowerCase()) result.scheduled++;
      else if (status === SessionStatus.COMPLETED.toLowerCase()) result.completed++;
      else if (status === SessionStatus.CANCELLED.toLowerCase()) result.cancelled++;
      else if (status === SessionStatus.NO_SHOW.toLowerCase()) result.no_show++;
    });
    
    return result;
  }, [sessions, hasNoSessions]);

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48 mt-2" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
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
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
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
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.total}</div>
            <p className="text-xs text-muted-foreground mt-1">All time sessions</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold">{analytics.completed}</div>
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                {((analytics.completed) / (analytics.total || 1) * 100).toFixed(0)}%
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Successfully completed</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold">{analytics.scheduled}</div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">Active</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Scheduled sessions</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelled/No-Show</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold">{analytics.cancelled + analytics.no_show}</div>
              <Badge variant="secondary" className="bg-red-100 text-red-700">
                {((analytics.cancelled + analytics.no_show) / (analytics.total || 1) * 100).toFixed(0)}%
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Missed sessions</p>
          </CardContent>
        </Card>
      </div>

      {/* Session List or Welcome Message */}
      {hasNoSessions ? (
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Welcome to Your Coaching Dashboard</CardTitle>
            <CardDescription>You don't have any coaching sessions yet</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center p-8">
              <Calendar className="h-16 w-16 text-blue-500 mb-4" />
              <h2 className="text-2xl font-semibold mb-2">No Sessions Found</h2>
              <p className="text-muted-foreground max-w-md mb-6">
                When you book sessions with mentees, they will appear here. You'll be able to track
                upcoming sessions, review past sessions, and manage your coaching schedule.
              </p>
              <Link href="/dashboard/coach/availability">
                <Button className="mt-2">
                  Set Your Availability
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle>Sessions</CardTitle>
                <CardDescription>View and manage your coaching sessions</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search mentee..."
                    className="pl-8 w-[200px] focus:w-[300px] transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-[140px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value={SessionStatus.SCHEDULED}>Scheduled</SelectItem>
                    <SelectItem value={SessionStatus.COMPLETED}>Completed</SelectItem>
                    <SelectItem value={SessionStatus.CANCELLED}>Cancelled</SelectItem>
                    <SelectItem value={SessionStatus.NO_SHOW}>No Show</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
              <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 mb-4">
                <TabsTrigger 
                  value="upcoming" 
                  className="data-[state=active]:border-primary data-[state=active]:bg-transparent border-b-2 border-transparent rounded-none"
                >
                  Upcoming
                </TabsTrigger>
                <TabsTrigger 
                  value="past" 
                  className="data-[state=active]:border-primary data-[state=active]:bg-transparent border-b-2 border-transparent rounded-none"
                >
                  Past Sessions
                </TabsTrigger>
              </TabsList>
              <TabsContent value="upcoming" className="space-y-4">
                {filteredSessions.map((session: TransformedSession) => (
                  <div 
                    key={session.ulid}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-all hover:shadow-sm group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="space-y-1">
                        <p className="font-medium group-hover:text-primary transition-colors">
                          {session.otherParty.firstName || ''} {session.otherParty.lastName || ''}
                        </p>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="mr-2 h-4 w-4" />
                          {formatDate(session.startTime, 'PPP')}
                          <Clock className="ml-4 mr-2 h-4 w-4" />
                          {formatDate(session.startTime, 'p')} - {formatDate(session.endTime, 'p')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        className={`${getStatusColor(session.status)} px-2 py-0.5 text-white`}
                      >
                        {session.status}
                      </Badge>
                      {session.status === SessionStatus.SCHEDULED && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="hover:bg-primary hover:text-white transition-colors"
                        >
                          Join Call
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {filteredSessions.length === 0 && (
                  <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-medium">No sessions found</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {searchQuery ? 'Try adjusting your search or filters' : 'No upcoming sessions scheduled'}
                    </p>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="past" className="space-y-4">
                {filteredSessions.map((session: TransformedSession) => (
                  <div 
                    key={session.ulid}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-all hover:shadow-sm group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="space-y-1">
                        <p className="font-medium group-hover:text-primary transition-colors">
                          {session.otherParty.firstName || ''} {session.otherParty.lastName || ''}
                        </p>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="mr-2 h-4 w-4" />
                          {formatDate(session.startTime, 'PPP')}
                          <Clock className="ml-4 mr-2 h-4 w-4" />
                          {formatDate(session.startTime, 'p')} - {formatDate(session.endTime, 'p')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        className={`${getStatusColor(session.status)} px-2 py-0.5 text-white`}
                      >
                        {session.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                {filteredSessions.length === 0 && (
                  <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-medium">No sessions found</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {searchQuery ? 'Try adjusting your search or filters' : 'No past sessions available'}
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 