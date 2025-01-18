'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchCoachSessions } from '@/utils/actions/sessions'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Search, Filter, Users, CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import { format } from 'date-fns'
import { Skeleton } from "@/components/ui/skeleton"

interface User {
  id: number
  firstName: string | null
  lastName: string | null
  email: string | null
}

interface Session {
  id: number
  durationMinutes: number
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
  calendlyEventId: string
  startTime: string
  endTime: string
  createdAt: string
  userRole: 'coach' | 'mentee'
  otherParty: User
}

interface Analytics {
  total: number
  scheduled: number
  completed: number
  cancelled: number
  no_show: number
}

// Status badge colors
const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'scheduled':
      return 'bg-blue-500'
    case 'completed':
      return 'bg-green-500'
    case 'cancelled':
      return 'bg-red-500'
    case 'no_show':
      return 'bg-yellow-500'
    default:
      return 'bg-gray-500'
  }
}

export function CoachSessionsDashboard() {
  const [filter, setFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTab, setSelectedTab] = useState('upcoming')

  // Fetch sessions data
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['coach-sessions'],
    queryFn: async () => {
      const data = await fetchCoachSessions() as Session[]
      return data || []
    },
  })

  // Filter and sort sessions
  const filteredSessions = sessions.filter((session: Session) => {
    const matchesSearch = searchQuery === '' || 
      (session.otherParty.firstName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (session.otherParty.lastName?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    
    const matchesFilter = filter === 'all' || session.status.toLowerCase() === filter.toLowerCase()
    
    const isUpcoming = new Date(session.startTime) > new Date()
    const matchesTab = selectedTab === 'upcoming' ? isUpcoming : !isUpcoming

    return matchesSearch && matchesFilter && matchesTab
  }).sort((a: Session, b: Session) => {
    return selectedTab === 'upcoming' 
      ? new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      : new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  })

  // Calculate analytics
  const analytics: Analytics = sessions.reduce((acc: Analytics, session: Session) => {
    acc.total++
    acc[session.status.toLowerCase() as keyof Analytics]++
    return acc
  }, {
    total: 0,
    scheduled: 0,
    completed: 0,
    cancelled: 0,
    no_show: 0
  })

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

      {/* Session List */}
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
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="no_show">No Show</SelectItem>
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
              {filteredSessions.map((session: Session) => (
                <div 
                  key={session.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-all hover:shadow-sm group"
                >
                  <div className="flex items-center space-x-4">
                    <div className="space-y-1">
                      <p className="font-medium group-hover:text-primary transition-colors">
                        {session.otherParty.firstName || ''} {session.otherParty.lastName || ''}
                      </p>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="mr-2 h-4 w-4" />
                        {format(new Date(session.startTime), 'PPP')}
                        <Clock className="ml-4 mr-2 h-4 w-4" />
                        {format(new Date(session.startTime), 'p')} - {format(new Date(session.endTime), 'p')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      className={`${getStatusColor(session.status)} px-2 py-0.5 text-white`}
                    >
                      {session.status}
                    </Badge>
                    {session.status === 'scheduled' && (
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
              {filteredSessions.map((session: Session) => (
                <div 
                  key={session.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-all hover:shadow-sm group"
                >
                  <div className="flex items-center space-x-4">
                    <div className="space-y-1">
                      <p className="font-medium group-hover:text-primary transition-colors">
                        {session.otherParty.firstName || ''} {session.otherParty.lastName || ''}
                      </p>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="mr-2 h-4 w-4" />
                        {format(new Date(session.startTime), 'PPP')}
                        <Clock className="ml-4 mr-2 h-4 w-4" />
                        {format(new Date(session.startTime), 'p')} - {format(new Date(session.endTime), 'p')}
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
    </div>
  )
} 