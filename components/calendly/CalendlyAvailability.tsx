'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, ExternalLink, Calendar as CalendarIcon, Filter, LayoutGrid, List, ChevronLeft, ChevronRight, RefreshCw, Plus } from 'lucide-react'
import { useCalendly } from '@/utils/hooks/useCalendly'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { 
  format, 
  parseISO, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addDays,
  isSameDay,
  addWeeks,
  subWeeks,
  isWithinInterval,
  addMonths,
  subMonths,
} from 'date-fns'
import { CalendlyAvailabilitySchedule, CalendlyBusyTime, BusyTimeFilters, CalendlyBusyTimeType } from '@/utils/types/calendly'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Calendar } from '@/components/ui/calendar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/utils/cn'
import { UserRole } from '@prisma/client'
import { AvailabilityScheduleView } from './AvailabilityScheduleView'
import { CoachingAvailabilityEditor } from './CoachingAvailabilityEditor'
import { toast } from 'react-hot-toast'

interface AvailabilityData {
  schedules: CalendlyAvailabilitySchedule[]
  busyTimes: CalendlyBusyTime[]
  filters: BusyTimeFilters
}

type ViewType = 'week' | 'list'

interface ScheduleRule {
  type: 'wday' | 'date';
  intervals: Array<{ from: string; to: string }>;
  wday?: number;  // 0-6, where 0 is Sunday
  date?: string;
}

const CACHE_DURATION = 30 * 60 * 1000 // 30 minutes
const FETCH_RANGE_MONTHS = 3

export function CalendlyAvailability() {
  const { status, isLoading } = useCalendly()
  const [data, setData] = useState<AvailabilityData>({ 
    schedules: [], 
    busyTimes: [],
    filters: {
      startDate: startOfWeek(new Date()),
      endDate: endOfWeek(new Date()),
    }
  })
  const [cachedData, setCachedData] = useState<Record<string, CalendlyBusyTime[]>>({})
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [error, setError] = useState<string>()
  const [view, setView] = useState<ViewType>('week')
  const [selectedType, setSelectedType] = useState<CalendlyBusyTimeType | 'all'>('all')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [authError, setAuthError] = useState(false)
  const [lastFetchTime, setLastFetchTime] = useState<number>(0)
  const [activeTab, setActiveTab] = useState<string>('schedules')
  const [showCoachingEditor, setShowCoachingEditor] = useState(false)
  const [coachingSchedules, setCoachingSchedules] = useState<any[]>([])
  const [isLoadingCoachingSchedules, setIsLoadingCoachingSchedules] = useState(false)

  const getCacheKey = (startDate: Date, endDate: Date) => {
    return `${format(startDate, 'yyyy-MM-dd')}_${format(endDate, 'yyyy-MM-dd')}`
  }

  const isDateRangeCached = (startDate: Date, endDate: Date) => {
    const cacheKey = getCacheKey(startDate, endDate)
    const cachedEntry = cachedData[cacheKey]
    if (!cachedEntry) return false
    
    const now = Date.now()
    return now - lastFetchTime < CACHE_DURATION
  }

  useEffect(() => {
    if (!status?.connected || isLoadingData) return

    const now = Date.now()
    if (now - lastFetchTime < 30000) return

    // Check if we already have this date range cached
    const cacheKey = getCacheKey(data.filters.startDate, data.filters.endDate)
    if (cachedData[cacheKey]) {
      setData(prev => ({
        ...prev,
        busyTimes: cachedData[cacheKey]
      }))
      return
    }

    fetchAvailabilityData()
  }, [status?.connected, data.filters, lastFetchTime, selectedType])

  // Update the prefetch logic to handle monthly ranges
  useEffect(() => {
    if (!status?.connected || isLoadingData) return

    const prefetchAdjacentMonths = async () => {
      const currentMonth = startOfMonth(selectedDate)
      
      for (let i = 1; i <= FETCH_RANGE_MONTHS; i++) {
        const monthStart = addMonths(currentMonth, i)
        const monthEnd = endOfMonth(monthStart)

        if (!isDateRangeCached(monthStart, monthEnd)) {
          await fetchAvailabilityData(monthStart, monthEnd, true)
        }
      }
    }

    prefetchAdjacentMonths()
  }, [selectedDate, status?.connected])

  useEffect(() => {
    if (!status?.connected) return
    fetchCoachingSchedules()
  }, [status?.connected])

  const fetchAvailabilityData = async (
    startDate: Date = data.filters.startDate,
    endDate: Date = data.filters.endDate,
    isPrefetch: boolean = false
  ) => {
    try {
      if (!isPrefetch) {
        setIsLoadingData(true)
      }
      setError(undefined)
      setAuthError(false)
      setLastFetchTime(Date.now())
      
      if (!status?.schedulingUrl) {
        throw new Error('Calendly scheduling URL not found')
      }
      
      const queryParams = new URLSearchParams()
      if (selectedType !== 'all') {
        queryParams.set('type', selectedType)
      }
      queryParams.set('startDate', startDate.toISOString())
      queryParams.set('endDate', endDate.toISOString())
      
      const response = await fetch(`/api/calendly/availability/schedules?${queryParams}`)
      if (!response.ok) {
        const errorText = await response.text()
        if (response.status === 401) {
          setAuthError(true)
          throw new Error('Calendly authentication expired')
        }
        if (response.status === 429) {
          throw new Error('Too many requests. Please wait a moment and try again.')
        }
        throw new Error(errorText || 'Failed to fetch availability data')
      }
      
      const responseData = await response.json()
      
      // Parse dates in the response data
      const parsedData = {
        ...responseData.data,
        filters: {
          ...responseData.data.filters,
          startDate: parseISO(responseData.data.filters.startDate),
          endDate: parseISO(responseData.data.filters.endDate)
        }
      }

      // Cache the fetched data
      const cacheKey = getCacheKey(startDate, endDate)
      setCachedData(prev => ({
        ...prev,
        [cacheKey]: parsedData.busyTimes
      }))
      
      if (!isPrefetch) {
        setData(parsedData)
      }
    } catch (err) {
      if (!isPrefetch) {
        setError(err instanceof Error ? err.message : 'Failed to load availability data')
      }
    } finally {
      if (!isPrefetch) {
        setIsLoadingData(false)
      }
    }
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return
    setSelectedDate(date)
    
    const newFilters = {
      ...data.filters,
      startDate: startOfWeek(date),
      endDate: endOfWeek(date)
    }
    
    // Check if we have this date range cached before updating filters
    const cacheKey = getCacheKey(newFilters.startDate, newFilters.endDate)
    if (cachedData[cacheKey]) {
      setData(prev => ({
        ...prev,
        filters: newFilters,
        busyTimes: cachedData[cacheKey]
      }))
    } else {
      setData(prev => ({
        ...prev,
        filters: newFilters
      }))
    }
  }

  const handleViewChange = (newView: ViewType) => {
    if (isLoadingData) return // Prevent changing view while loading
    
    setView(newView)
    const newFilters = {
      ...data.filters,
      startDate: startOfWeek(selectedDate),
      endDate: endOfWeek(selectedDate)
    }

    // Check if we have this date range cached before updating filters
    const cacheKey = getCacheKey(newFilters.startDate, newFilters.endDate)
    if (cachedData[cacheKey]) {
      setData(prev => ({
        ...prev,
        filters: newFilters,
        busyTimes: cachedData[cacheKey]
      }))
    } else {
      setData(prev => ({
        ...prev,
        filters: newFilters
      }))
    }
  }

  const handleWeekChange = (direction: 'prev' | 'next') => {
    if (isLoadingData) return // Prevent changing week while loading
    
    const newDate = direction === 'next' 
      ? addWeeks(selectedDate, 1)
      : subWeeks(selectedDate, 1)
    setSelectedDate(newDate)
    
    const newFilters = {
      ...data.filters,
      startDate: startOfWeek(newDate),
      endDate: endOfWeek(newDate)
    }

    // Check if we have this date range cached before updating filters
    const cacheKey = getCacheKey(newFilters.startDate, newFilters.endDate)
    if (cachedData[cacheKey]) {
      setData(prev => ({
        ...prev,
        filters: newFilters,
        busyTimes: cachedData[cacheKey]
      }))
    } else {
      setData(prev => ({
        ...prev,
        filters: newFilters
      }))
    }
  }

  const getBusyTimesForDate = (date: Date) => {
    return data.busyTimes.filter(busyTime => {
      try {
        const busyDate = parseISO(busyTime.start_time)
        return isSameDay(busyDate, date)
      } catch (err) {
        console.error('Error parsing busy time date:', err)
        return false
      }
    })
  }

  const WeekView = () => {
    const weekDays = eachDayOfInterval({
      start: data.filters.startDate,
      end: data.filters.endDate
    })

    const hours = Array.from({ length: 24 }, (_, i) => i)

    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="outline"
            onClick={() => handleWeekChange('prev')}
          >
            Previous Week
          </Button>
          <div className="text-lg font-semibold">
            {format(data.filters.startDate, 'MMM d')} - {format(data.filters.endDate, 'MMM d, yyyy')}
          </div>
          <Button
            variant="outline"
            onClick={() => handleWeekChange('next')}
          >
            Next Week
          </Button>
        </div>
        <div className="border rounded-lg overflow-hidden bg-card">
          <div className="grid grid-cols-8 border-b sticky top-0 bg-card z-10">
            <div className="p-2 border-r bg-muted/50" />
            {weekDays.map((day) => (
              <div
                key={day.toISOString()}
                className={cn(
                  "p-3 text-center border-r last:border-r-0",
                  isSameDay(day, new Date()) && "bg-primary/5 font-medium"
                )}
              >
                <div className="font-medium text-sm">{format(day, 'EEE')}</div>
                <div className={cn(
                  "text-base mt-1",
                  isSameDay(day, new Date()) && "text-primary font-semibold"
                )}>{format(day, 'd')}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-8 relative">
            <div className="border-r bg-muted/50">
              {hours.map((hour) => {
                const hourDate = new Date()
                hourDate.setHours(hour, 0, 0, 0)
                
                return (
                  <div
                    key={`time-${hour}`}
                    className="h-14 border-b last:border-b-0 p-2 text-xs text-muted-foreground sticky left-0"
                  >
                    {format(hourDate, 'h a')}
                  </div>
                )
              })}
            </div>
            {weekDays.map((day) => (
              <div key={day.toISOString()} className="border-r last:border-r-0 relative">
                {hours.map((hour) => {
                  const busyTimes = getBusyTimesForDate(day)
                  const eventsAtHour = busyTimes.filter(busyTime => {
                    try {
                      const start = parseISO(busyTime.start_time)
                      const end = parseISO(busyTime.end_time)
                      const hourDate = new Date(day)
                      hourDate.setHours(hour, 0, 0, 0)
                      return isWithinInterval(hourDate, { start, end })
                    } catch (err) {
                      console.error('Error checking busy time interval:', err)
                      return false
                    }
                  })

                  return (
                    <div
                      key={`${day.toISOString()}-${hour}`}
                      className={cn(
                        "h-14 border-b last:border-b-0 relative group transition-colors",
                        eventsAtHour.length > 0 && "bg-primary/10 hover:bg-primary/15"
                      )}
                    >
                      {eventsAtHour.length > 0 && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-primary/5">
                          <div className="px-2 py-1 rounded-md bg-popover text-xs font-medium shadow-sm">
                            {eventsAtHour.length} {eventsAtHour.length === 1 ? 'event' : 'events'}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4 mt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Events for {format(selectedDate, 'MMMM d, yyyy')}</h3>
            <Badge variant="outline" className="text-xs">
              {getBusyTimesForDate(selectedDate).length} events
            </Badge>
          </div>
          <div className="space-y-3">
            {getBusyTimesForDate(selectedDate).map((busyTime) => (
              <div
                key={busyTime.uri}
                className="flex items-center justify-between p-3 rounded-lg border bg-card/50 hover:bg-card/80 transition-colors"
              >
                <div className="space-y-1">
                  <p className="font-medium">
                    {busyTime.event_name || 'Busy'}
                  </p>
                  <div className="flex items-center text-sm text-muted-foreground space-x-2">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    <span>{format(parseISO(busyTime.start_time), 'h:mm a')} - {format(parseISO(busyTime.end_time), 'h:mm a')}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="capitalize">
                    {busyTime.type.replace(/_/g, ' ')}
                  </Badge>
                  {busyTime.event_url && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => window.open(busyTime.event_url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {getBusyTimesForDate(selectedDate).length === 0 && (
              <div className="text-center py-8 text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
                No events scheduled for this day
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const handleReconnect = () => {
    // Redirect to Calendly OAuth flow
    window.location.href = `/api/calendly/oauth?redirect=${encodeURIComponent(window.location.href)}`
  }

  // Helper function to convert weekday number to date
  const getWeekdayDate = (weekday: number) => {
    if (weekday < 0 || weekday > 6) return null
    
    const date = new Date(2024, 0, 7) // Jan 7, 2024 is a Sunday
    date.setDate(date.getDate() + weekday)
    return date
  }

  const handleRefresh = async () => {
    // Clear the cache
    setCachedData({})
    // Force a new fetch by resetting the last fetch time
    setLastFetchTime(0)
    // Fetch new data
    await fetchAvailabilityData()
  }

  const fetchCoachingSchedules = async () => {
    try {
      setIsLoadingCoachingSchedules(true)
      const response = await fetch('/api/coaching/availability')
      if (!response.ok) {
        throw new Error('Failed to fetch coaching schedules')
      }
      const { data } = await response.json()
      setCoachingSchedules(data)
    } catch (error) {
      console.error('[COACHING_SCHEDULES_ERROR]', error)
    } finally {
      setIsLoadingCoachingSchedules(false)
    }
  }

  if (isLoading || isLoadingData) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!status?.connected || authError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Calendly Integration</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Please connect your Calendly account to view your availability.
            </AlertDescription>
          </Alert>
          <Button onClick={handleReconnect} className="mt-4">
            Connect Calendly
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    if (error.includes('Access denied')) {
      return (
        <Alert variant="destructive">
          <AlertDescription>
            You do not have permission to access this feature. This feature is only available for coaches.
          </AlertDescription>
        </Alert>
      )
    }
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="mb-4">
        <TabsTrigger value="schedules" className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4" />
          Availability Schedules
        </TabsTrigger>
        <TabsTrigger value="coaching" className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4" />
          Coaching Availability
        </TabsTrigger>
        <TabsTrigger value="busy-times" className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4" />
          Busy Times
        </TabsTrigger>
      </TabsList>

      <TabsContent value="schedules">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Availability Schedules</span>
              <Button
                variant="outline"
                onClick={() => window.open(`${status.schedulingUrl}/availability`, '_blank')}
                className="flex items-center gap-2"
              >
                <span>Manage in Calendly</span>
                <ExternalLink className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.schedules.length > 0 ? (
              <div className="space-y-8">
                {data.schedules.map((schedule) => (
                  <AvailabilityScheduleView 
                    key={schedule.uri} 
                    schedule={schedule} 
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No availability schedules found
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="coaching">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Coaching Availability</span>
              <Button
                onClick={() => setShowCoachingEditor(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Schedule
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingCoachingSchedules ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : showCoachingEditor ? (
              <CoachingAvailabilityEditor
                onSave={() => {
                  setShowCoachingEditor(false)
                  fetchCoachingSchedules()
                }}
                onCancel={() => setShowCoachingEditor(false)}
              />
            ) : coachingSchedules.length > 0 ? (
              <div className="space-y-8">
                {coachingSchedules.map((schedule) => (
                  <AvailabilityScheduleView 
                    key={schedule.id} 
                    schedule={schedule}
                    onDelete={async () => {
                      try {
                        const response = await fetch(`/api/coaching/availability?id=${schedule.id}`, {
                          method: 'DELETE'
                        })
                        if (!response.ok) {
                          throw new Error('Failed to delete schedule')
                        }
                        toast.success('Schedule deleted successfully')
                        fetchCoachingSchedules()
                      } catch (error) {
                        console.error('[COACHING_SCHEDULE_DELETE_ERROR]', error)
                        toast.error('Failed to delete schedule')
                      }
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No coaching availability schedules found
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="busy-times">
        <Card className="border-none shadow-none">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="flex items-center justify-between">
              <span>Upcoming Busy Times</span>
              <div className="flex items-center space-x-4">
                <Select
                  value={selectedType}
                  onValueChange={(value) => setSelectedType(value as CalendlyBusyTimeType | 'all')}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    <SelectItem value="busy_time">Busy Time</SelectItem>
                    <SelectItem value="calendly_event">Calendly Event</SelectItem>
                    <SelectItem value="external_event">External Event</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center rounded-md border bg-muted p-1">
                  <Button
                    variant={view === 'week' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => handleViewChange('week')}
                    className="h-8"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={view === 'list' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => handleViewChange('list')}
                    className="h-8"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            {view === 'week' ? (
              <WeekView />
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between mb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleWeekChange('prev')}
                    className="h-8"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous Week
                  </Button>
                  <div className="text-lg font-semibold">
                    {format(data.filters.startDate, 'MMM d')} - {format(data.filters.endDate, 'MMM d, yyyy')}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleWeekChange('next')}
                    className="h-8"
                  >
                    Next Week
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[150px]">Date</TableHead>
                        <TableHead className="w-[120px]">Start Time</TableHead>
                        <TableHead className="w-[120px]">End Time</TableHead>
                        <TableHead>Event</TableHead>
                        <TableHead className="w-[120px]">Type</TableHead>
                        <TableHead>Calendar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.busyTimes.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-32 text-center">
                            No events scheduled for this week
                          </TableCell>
                        </TableRow>
                      ) : (
                        data.busyTimes.map((busyTime) => {
                          const uniqueKey = `${busyTime.uri}_${busyTime.start_time}`
                          return (
                            <TableRow key={uniqueKey} className="group">
                              <TableCell className="font-medium">
                                {format(parseISO(busyTime.start_time), 'MMM d, yyyy')}
                              </TableCell>
                              <TableCell>
                                {format(parseISO(busyTime.start_time), 'h:mm a')}
                              </TableCell>
                              <TableCell>
                                {format(parseISO(busyTime.end_time), 'h:mm a')}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <span>{busyTime.event_name || 'Busy'}</span>
                                  {busyTime.event_url && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={() => window.open(busyTime.event_url, '_blank')}
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="capitalize">
                                  {busyTime.type.replace(/_/g, ' ')}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {busyTime.calendar_name || busyTime.calendar_type}
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
            <div className="mt-6 flex justify-end">
              <Button 
                onClick={handleRefresh}
                disabled={isLoadingData}
                variant="outline"
                size="sm"
                className="h-9"
              >
                {isLoadingData ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Refresh Schedule
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
} 