'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, ExternalLink, Calendar as CalendarIcon, Filter, LayoutGrid, List } from 'lucide-react'
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
  isWithinInterval
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

interface AvailabilityData {
  schedules: CalendlyAvailabilitySchedule[]
  busyTimes: CalendlyBusyTime[]
  filters: BusyTimeFilters
}

type ViewType = 'month' | 'week' | 'list'

interface ScheduleRule {
  type: 'wday' | 'date';
  intervals: Array<{ from: string; to: string }>;
  wday?: number;  // 0-6, where 0 is Sunday
  date?: string;
}

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
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [error, setError] = useState<string>()
  const [view, setView] = useState<ViewType>('week')
  const [selectedType, setSelectedType] = useState<CalendlyBusyTimeType | 'all'>('all')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [authError, setAuthError] = useState(false)
  const [lastFetchTime, setLastFetchTime] = useState<number>(0)

  useEffect(() => {
    if (!status?.connected || isLoadingData) return

    // Prevent fetching more often than every 30 seconds
    const now = Date.now()
    if (now - lastFetchTime < 30000) return

    fetchAvailabilityData()
  }, [status?.connected, data.filters, lastFetchTime])

  const fetchAvailabilityData = async () => {
    try {
      setIsLoadingData(true)
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
      queryParams.set('startDate', data.filters.startDate.toISOString())
      queryParams.set('endDate', data.filters.endDate.toISOString())
      
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
      
      setData(parsedData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load availability data')
    } finally {
      setIsLoadingData(false)
    }
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return
    setSelectedDate(date)
    
    const newFilters = {
      ...data.filters,
      startDate: view === 'month' ? startOfMonth(date) : startOfWeek(date),
      endDate: view === 'month' ? endOfMonth(date) : endOfWeek(date)
    }
    
    setData(prev => ({
      ...prev,
      filters: newFilters
    }))
  }

  const handleViewChange = (newView: ViewType) => {
    if (isLoadingData) return // Prevent changing view while loading
    
    setView(newView)
    const newFilters = {
      ...data.filters,
      startDate: newView === 'month' ? startOfMonth(selectedDate) : startOfWeek(selectedDate),
      endDate: newView === 'month' ? endOfMonth(selectedDate) : endOfWeek(selectedDate)
    }
    setData(prev => ({
      ...prev,
      filters: newFilters
    }))
  }

  const handleWeekChange = (direction: 'prev' | 'next') => {
    if (isLoadingData) return // Prevent changing week while loading
    
    const newDate = direction === 'next' 
      ? addWeeks(selectedDate, 1)
      : subWeeks(selectedDate, 1)
    setSelectedDate(newDate)
    handleDateSelect(newDate)
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
        <div className="border rounded-lg">
          <div className="grid grid-cols-8 border-b">
            <div className="p-2 border-r" />
            {weekDays.map((day) => (
              <div
                key={day.toISOString()}
                className={cn(
                  "p-2 text-center border-r last:border-r-0",
                  isSameDay(day, new Date()) && "bg-muted"
                )}
              >
                <div className="font-medium">{format(day, 'EEE')}</div>
                <div className="text-sm text-muted-foreground">{format(day, 'd')}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-8">
            <div className="border-r">
              {hours.map((hour) => {
                // Create a proper date object for the hour
                const hourDate = new Date()
                hourDate.setHours(hour, 0, 0, 0)
                
                return (
                  <div
                    key={hour}
                    className="h-12 border-b last:border-b-0 p-1 text-xs text-muted-foreground"
                  >
                    {format(hourDate, 'h a')}
                  </div>
                )
              })}
            </div>
            {weekDays.map((day) => (
              <div key={day.toISOString()} className="border-r last:border-r-0">
                {hours.map((hour) => {
                  const busyTimes = getBusyTimesForDate(day)
                  const hasEventAtHour = busyTimes.some(busyTime => {
                    try {
                      const start = parseISO(busyTime.start_time)
                      const end = parseISO(busyTime.end_time)
                      // Create a proper date object for comparison
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
                      key={hour}
                      className={cn(
                        "h-12 border-b last:border-b-0",
                        hasEventAtHour && "bg-primary/10"
                      )}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4 mt-4">
          <h3 className="font-medium">Events for {format(selectedDate, 'MMMM d, yyyy')}</h3>
          <div className="space-y-2">
            {getBusyTimesForDate(selectedDate).map((busyTime) => (
              <div
                key={busyTime.uri}
                className="flex items-center justify-between p-2 rounded-md border"
              >
                <div>
                  <p className="font-medium">
                    {busyTime.event_name || 'Busy'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(parseISO(busyTime.start_time), 'h:mm a')} - {format(parseISO(busyTime.end_time), 'h:mm a')}
                  </p>
                </div>
                <Badge>{busyTime.type}</Badge>
              </div>
            ))}
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

  if (isLoading || isLoadingData) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (!status?.connected || authError) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">
              {authError ? 'Reconnect Your Calendly Account' : 'Connect Your Calendly Account'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {authError 
                ? 'Your Calendly connection has expired. Please reconnect to continue managing your availability.'
                : 'You need to connect your Calendly account to manage your availability.'
              }
            </p>
            <Button onClick={handleReconnect}>
              {authError ? 'Reconnect Calendly' : 'Connect Calendly'}
            </Button>
          </div>
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
    <Tabs defaultValue="schedules">
      <TabsList className="mb-4">
        <TabsTrigger value="schedules" className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4" />
          Availability Schedules
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Schedule Name</TableHead>
                    <TableHead>Default</TableHead>
                    <TableHead>Timezone</TableHead>
                    <TableHead>Weekly Hours</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.schedules.map((schedule) => (
                    <TableRow key={schedule.uri}>
                      <TableCell className="font-medium">{schedule.name}</TableCell>
                      <TableCell>
                        {schedule.default && (
                          <Badge variant="secondary">Default</Badge>
                        )}
                      </TableCell>
                      <TableCell>{schedule.timezone}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {(schedule.rules as ScheduleRule[]).map((rule, index) => {
                            if (rule.type === 'wday' && typeof rule.wday === 'number') {
                              const weekdayDate = getWeekdayDate(rule.wday)
                              if (!weekdayDate) return null
                              
                              return (
                                <div key={index} className="text-sm">
                                  <span>
                                    {format(weekdayDate, 'EEEE')}: {' '}
                                    {rule.intervals.map(interval => (
                                      `${interval.from}-${interval.to}`
                                    )).join(', ')}
                                  </span>
                                </div>
                              )
                            }
                            if (rule.type === 'date' && rule.date) {
                              return (
                                <div key={index} className="text-sm">
                                  <span>
                                    {format(parseISO(rule.date), 'MMM d, yyyy')}: {' '}
                                    {rule.intervals.map(interval => (
                                      `${interval.from}-${interval.to}`
                                    )).join(', ')}
                                  </span>
                                </div>
                              )
                            }
                            return null
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={schedule.active ? 'default' : 'secondary'}
                        >
                          {schedule.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No availability schedules found
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="busy-times">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Upcoming Busy Times</span>
              <div className="flex items-center gap-4">
                <Select
                  value={selectedType}
                  onValueChange={(value) => setSelectedType(value as any)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="event">Events</SelectItem>
                    <SelectItem value="busy_period">Busy Periods</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <Button
                    variant={view === 'month' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => handleViewChange('month')}
                  >
                    <CalendarIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={view === 'week' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => handleViewChange('week')}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={view === 'list' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => handleViewChange('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {view === 'month' ? (
              <div className="flex flex-col gap-4">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  modifiers={{
                    busy: (date) => getBusyTimesForDate(date).length > 0
                  }}
                  modifiersStyles={{
                    busy: { backgroundColor: 'var(--warning)' }
                  }}
                />
                <div className="space-y-2">
                  {getBusyTimesForDate(selectedDate).map((busyTime) => (
                    <div
                      key={busyTime.uri}
                      className="flex items-center justify-between p-2 rounded-md border"
                    >
                      <div>
                        <p className="font-medium">
                          {busyTime.event_name || 'Busy'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(parseISO(busyTime.start_time), 'h:mm a')} - {format(parseISO(busyTime.end_time), 'h:mm a')}
                        </p>
                      </div>
                      <Badge>{busyTime.type}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            ) : view === 'week' ? (
              <WeekView />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Start Time</TableHead>
                    <TableHead>End Time</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Calendar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.busyTimes.map((busyTime) => {
                    // Create a unique key using start_time and uri
                    const uniqueKey = `${busyTime.uri}_${busyTime.start_time}`
                    
                    return (
                      <TableRow key={uniqueKey}>
                        <TableCell>
                          {format(parseISO(busyTime.start_time), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          {format(parseISO(busyTime.start_time), 'h:mm a')}
                        </TableCell>
                        <TableCell>
                          {format(parseISO(busyTime.end_time), 'h:mm a')}
                        </TableCell>
                        <TableCell>
                          {busyTime.event_name || 'Busy'}
                          {busyTime.event_url && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="ml-2"
                              onClick={() => window.open(busyTime.event_url, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge>
                            {busyTime.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {busyTime.calendar_name || busyTime.calendar_type}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
} 