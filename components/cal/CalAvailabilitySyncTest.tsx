'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, XCircle, CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { format, addMonths, subMonths, isSameDay, isToday, startOfMonth } from 'date-fns'
import { toast } from 'sonner'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue
} from '@/components/ui/select'
import { calApiClient, CalEventType, CalTimeSlot } from '@/lib/cal/cal-api'

interface TestResult {
  success: boolean
  message: string
  data?: any
  error?: any
}

interface TimeSlot {
  start: string
  end: string
  available: boolean
}

export default function CalAvailabilitySyncTest() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date())
  const [eventTypes, setEventTypes] = useState<CalEventType[]>([])
  const [selectedEventType, setSelectedEventType] = useState<number | null>(null)
  
  // Fetch event types on component mount
  useEffect(() => {
    fetchEventTypes()
  }, [])
  
  // Clear slots when date or event type changes
  useEffect(() => {
    setSlots([])
  }, [date, selectedEventType])
  
  // Fetch event types from Cal.com
  const fetchEventTypes = async () => {
    try {
      setLoading(true)
      const types = await calApiClient.getEventTypes()
      setEventTypes(types)
      if (types.length > 0) {
        setSelectedEventType(types[0].id)
      }
      toast.success('Event types fetched successfully')
    } catch (error) {
      console.error('Failed to fetch event types:', error)
      toast.error('Failed to fetch event types')
    } finally {
      setLoading(false)
    }
  }
  
  // Fetch availability from Cal.com
  const fetchAvailability = async () => {
    if (!date || !selectedEventType) return
    
    try {
      setLoading(true)
      const startDate = new Date(date)
      startDate.setHours(0, 0, 0, 0)
      
      const endDate = new Date(date)
      endDate.setHours(23, 59, 59, 999)
      
      const calSlots = await calApiClient.getAvailability(
        selectedEventType,
        startDate.toISOString(),
        endDate.toISOString()
      )
      
      // Convert Cal.com slots to our format
      const formattedSlots: TimeSlot[] = calSlots.map(slot => ({
        start: slot.time,
        end: new Date(new Date(slot.time).getTime() + 60 * 60 * 1000).toISOString(), // Assuming 1-hour slots
        available: !slot.bookingId
      }))
      
      setSlots(formattedSlots)
      setResult({
        success: true,
        message: `Successfully fetched availability for ${format(date, 'yyyy-MM-dd')}`,
        data: {
          eventTypeId: selectedEventType,
          slotCount: formattedSlots.length,
          availableSlots: formattedSlots.filter(slot => slot.available).length
        }
      })
      toast.success('Availability fetched successfully')
    } catch (error) {
      console.error('Failed to fetch availability:', error)
      setResult({
        success: false,
        message: 'Failed to fetch availability',
        error: error instanceof Error ? error.message : String(error)
      })
      toast.error('Failed to fetch availability')
    } finally {
      setLoading(false)
    }
  }
  
  // Create a test booking
  const createTestBooking = async (slot: TimeSlot) => {
    if (!selectedEventType) return
    
    try {
      setLoading(true)
      await calApiClient.createBooking({
        eventTypeId: selectedEventType,
        start: slot.start,
        end: slot.end,
        name: 'Test User',
        email: 'test@example.com',
        notes: 'Test booking from availability sync test'
      })
      
      toast.success('Test booking created successfully')
      // Refresh availability after booking
      await fetchAvailability()
    } catch (error) {
      console.error('Failed to create test booking:', error)
      toast.error('Failed to create test booking')
    } finally {
      setLoading(false)
    }
  }
  
  // Format time for display
  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Change to today's date
  const goToToday = () => {
    const today = new Date()
    setCalendarMonth(today)
    setDate(today)
  }
  
  // Add navigation handlers
  const previousMonth = () => {
    setCalendarMonth(prev => subMonths(prev, 1))
  }

  const nextMonth = () => {
    setCalendarMonth(prev => addMonths(prev, 1))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        <Card className="flex-1">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-lg font-semibold">Select Event Type</Label>
                <Select
                  value={selectedEventType?.toString()}
                  onValueChange={(value) => setSelectedEventType(Number(value))}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        {type.title} ({type.length}min)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between mb-4">
                <Label className="text-lg font-semibold">Select Date</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={previousMonth}
                    className="h-7 w-7"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium min-w-[120px] text-center">
                    {format(calendarMonth, 'MMMM yyyy')}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={nextMonth}
                    className="h-7 w-7"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToToday}
                    className="h-8 text-xs ml-2"
                  >
                    Today
                  </Button>
                </div>
              </div>
              
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  month={calendarMonth}
                  onMonthChange={setCalendarMonth}
                  className="rounded-md border shadow-sm"
                  classNames={{
                    months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                    month: "space-y-4",
                    caption: "hidden",
                    caption_label: "hidden",
                    nav: "hidden",
                    nav_button: "hidden",
                    nav_button_previous: "hidden",
                    nav_button_next: "hidden",
                    table: "w-full border-collapse space-y-1",
                    head_row: "flex justify-around",
                    head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] text-center",
                    row: "flex w-full justify-around mt-2",
                    cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                    day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md",
                    day_range_end: "day-range-end",
                    day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                    day_today: "bg-accent text-accent-foreground",
                    day_outside: "day-outside text-muted-foreground opacity-50",
                    day_disabled: "text-muted-foreground opacity-50",
                    day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                    day_hidden: "invisible",
                  }}
                  showOutsideDays={false}
                />
              </div>

              <div className="flex items-center justify-center gap-4 pt-2">
                <span className="inline-flex items-center">
                  <div className="h-3 w-3 rounded-full bg-primary mr-1"></div>
                  <span className="text-xs">Selected</span>
                </span>
                <span className="inline-flex items-center">
                  <div className="h-3 w-3 rounded-full bg-accent mr-1"></div>
                  <span className="text-xs">Today</span>
                </span>
              </div>
              
              <Button
                onClick={fetchAvailability}
                disabled={loading || !date || !selectedEventType}
                className="w-full mt-4"
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarIcon className="mr-2 h-4 w-4" />}
                Fetch Cal.com Availability for {date ? format(date, 'MMM d, yyyy') : 'selected date'}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="flex-1">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-lg font-semibold">Available Time Slots</Label>
                <div className="flex items-center gap-2">
                  {slots.length > 0 && (
                    <span className="text-sm text-muted-foreground">
                      {slots.filter(slot => slot.available).length} of {slots.length} slots available
                    </span>
                  )}
                </div>
              </div>
              
              {!date ? (
                <div className="py-8 text-center text-muted-foreground">
                  Please select a date from the calendar.
                </div>
              ) : !selectedEventType ? (
                <div className="py-8 text-center text-muted-foreground">
                  Please select an event type.
                </div>
              ) : slots.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No availability data. Click "Fetch Cal.com Availability" to check time slots.
                </div>
              ) : (
                <ScrollArea className="h-[400px] pr-2">
                  <div className="space-y-2">
                    {slots.map((slot, index) => (
                      <div 
                        key={index}
                        className={`p-3 rounded-md border flex justify-between items-center transition-colors ${
                          slot.available ? 'bg-green-50 hover:bg-green-100 border-green-200' : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                        }`}
                      >
                        <span className="font-medium">{formatTime(slot.start)} - {formatTime(slot.end)}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant={slot.available ? "default" : "secondary"}>
                            {slot.available ? 'Available' : 'Unavailable'}
                          </Badge>
                          {slot.available && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => createTestBooking(slot)}
                              disabled={loading}
                            >
                              Test Book
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {result && (
        <Alert className={`mb-4 ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="flex items-center gap-2">
            {result.success ? 
              <CheckCircle className="h-4 w-4 text-green-600" /> : 
              <XCircle className="h-4 w-4 text-red-600" />
            }
            <AlertTitle>{result.message}</AlertTitle>
          </div>
          {result.error && (
            <AlertDescription className="mt-2">
              <div className="text-red-600 text-sm">
                <pre className="overflow-auto p-2 bg-red-100 rounded">
                  {typeof result.error === 'string' 
                    ? result.error 
                    : JSON.stringify(result.error, null, 2)
                  }
                </pre>
              </div>
            </AlertDescription>
          )}
          {result.data && (
            <AlertDescription className="mt-2">
              <div className="text-sm">
                <pre className="overflow-auto p-2 bg-gray-100 rounded">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>
            </AlertDescription>
          )}
        </Alert>
      )}
    </div>
  )
} 