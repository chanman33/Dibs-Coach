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
  
  // Clear slots when date changes
  useEffect(() => {
    setSlots([])
  }, [date])
  
  // Fetch mock availability for the selected date
  const fetchAvailability = async () => {
    if (!date) return
    
    try {
      setLoading(true)
      const formattedDate = format(date, 'yyyy-MM-dd')
      const response = await fetch(`/api/cal/test/availability?date=${formattedDate}`)
      
      if (response.ok) {
        const data = await response.json()
        if (data.data?.slots) {
          setSlots(data.data.slots)
          setResult({
            success: true,
            message: `Successfully fetched availability for ${formattedDate}`,
            data: {
              timezone: data.data.timezone,
              slotCount: data.data.slots.length,
              availableSlots: data.data.slots.filter((slot: TimeSlot) => slot.available).length
            }
          })
          toast.success('Availability fetched successfully')
        } else {
          setResult({
            success: false,
            message: 'No availability data returned',
            error: 'Empty response'
          })
          toast.error('Failed to fetch availability')
        }
      } else {
        setResult({
          success: false,
          message: 'Failed to fetch availability',
          error: `API Error: ${response.status}`
        })
        toast.error('API error')
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Exception while fetching availability',
        error: error instanceof Error ? error.message : String(error)
      })
      toast.error('Error fetching availability')
    } finally {
      setLoading(false)
    }
  }
  
  // Simulate syncing local availability to Cal.com
  const syncAvailability = async () => {
    try {
      setLoading(true)
      // This is just a simulation for the test page
      setTimeout(() => {
        setResult({
          success: true,
          message: 'Availability sync simulation completed',
          data: {
            syncedSlots: slots.length,
            timestamp: new Date().toISOString()
          }
        })
        toast.success('Sync simulation completed')
        setLoading(false)
      }, 2000)
    } catch (error) {
      setResult({
        success: false,
        message: 'Error in sync simulation',
        error: error instanceof Error ? error.message : String(error)
      })
      toast.error('Sync simulation failed')
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
  
  // Generate list of months for the month selector
  const getMonthOptions = () => {
    const months = []
    const currentYear = new Date().getFullYear()
    
    // Add 6 months before and 6 months after current month
    for (let i = -6; i <= 6; i++) {
      const monthDate = new Date()
      monthDate.setMonth(monthDate.getMonth() + i)
      months.push({
        value: `${monthDate.getFullYear()}-${monthDate.getMonth()}`,
        label: format(monthDate, 'MMMM yyyy')
      })
    }
    
    return months
  }
  
  // Handle month change from the select dropdown
  const handleMonthChange = (value: string) => {
    const [year, month] = value.split('-').map(Number)
    const newDate = new Date()
    newDate.setFullYear(year)
    newDate.setMonth(month)
    setCalendarMonth(startOfMonth(newDate))
  }
  
  // Get current month-year value for the select
  const getCurrentMonthValue = () => {
    return `${calendarMonth.getFullYear()}-${calendarMonth.getMonth()}`
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
                disabled={loading || !date}
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
                  <Button
                    onClick={syncAvailability}
                    disabled={loading || slots.length === 0}
                    size="sm"
                    variant="outline"
                  >
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Simulate Sync
                  </Button>
                </div>
              </div>
              
              {!date ? (
                <div className="py-8 text-center text-muted-foreground">
                  Please select a date from the calendar.
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
                        <Badge variant={slot.available ? "default" : "secondary"}>
                          {slot.available ? 'Available' : 'Unavailable'}
                        </Badge>
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