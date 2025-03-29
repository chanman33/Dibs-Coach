/**
 * CalManagedUserTest - Tests the Cal.com regular user schedules API
 * 
 * This component tests the Cal.com regular user schedules API endpoints:
 * - GET /v2/schedules - Fetch all user schedules
 * - POST /v2/schedules - Create a new schedule
 * - DELETE /v2/schedules/{id} - Delete a schedule
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Loader2, CalendarIcon, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  AvailabilitySlot, 
  ScheduleOverride 
} from '@/utils/types/schedule'
import { TestResult, ResultAlert, minutesToTime, formatTime } from './CalTestUtils'

/**
 * Schedule interface that matches Cal.com API v2 response format
 * In v2, availability is a property within the schedule object
 */
interface Schedule {
  id: number
  ownerId: number
  name: string
  timeZone: string
  availability: AvailabilitySlot[]
  isDefault: boolean
  overrides?: ScheduleOverride[]
}

export default function CalManagedUserTest() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [schedules, setSchedules] = useState<Schedule[]>([])
  
  // Fetch Cal.com schedules on component mount
  useEffect(() => {
    fetchCalSchedules()
  }, [])

  // Function to fetch schedules from Cal.com (using regular user schedules API)
  const fetchCalSchedules = async () => {
    try {
      setLoading(true)
      // This calls our backend API which uses the Cal.com regular user endpoint: GET /v2/schedules
      const response = await fetch('/api/cal/test/availability')
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch Cal.com schedules')
      }
      
      const data = await response.json()
      console.log('Raw Cal.com API response:', data)
      
      if (data.status === 'success' && Array.isArray(data.data)) {
        // Process schedules from Cal.com API
        const transformedSchedules = data.data.map((schedule: any): Schedule => {
          // Log the raw schedule data to better understand the structure
          console.log(`Raw schedule data for ID ${schedule.id}:`, {
            availability: schedule.availability,
            isDefault: schedule.isDefault,
            timeZone: schedule.timeZone
          })
          
          let availabilitySlots: AvailabilitySlot[] = []
          
          // Handle different formats of availability data from Cal.com
          if (Array.isArray(schedule.availability)) {
            if (schedule.availability.length === 0) {
              console.log(`Schedule ${schedule.id} has empty availability array`)
            } else if (schedule.availability.length === 7 && 
                schedule.availability.every((slot: any) => typeof slot === 'object' && Object.keys(slot).length === 0)) {
              // This is Cal.com's way of representing "no availability set yet" with [{}, {}, {}, {}, {}, {}, {}]
              console.log(`Schedule ${schedule.id} has placeholder empty objects array`)
            } else {
              // Filter out valid availability slots
              availabilitySlots = schedule.availability
                .filter((slot: any) => {
                  return slot && 
                         typeof slot === 'object' && 
                         Object.keys(slot).length > 0 &&
                         (Array.isArray(slot.days) || typeof slot.days !== 'undefined') &&
                         (typeof slot.startTime !== 'undefined' && typeof slot.endTime !== 'undefined');
                })
                .map((slot: any) => ({
                  days: slot.days,
                  startTime: typeof slot.startTime === 'number' 
                    ? minutesToTime(slot.startTime) 
                    : slot.startTime,
                  endTime: typeof slot.endTime === 'number' 
                    ? minutesToTime(slot.endTime) 
                    : slot.endTime
                }))
            }
          }
          
          return {
            id: schedule.id,
            ownerId: schedule.ownerId,
            name: schedule.name,
            timeZone: schedule.timeZone,
            availability: availabilitySlots,
            isDefault: !!schedule.isDefault,
            overrides: Array.isArray(schedule.overrides) 
              ? schedule.overrides
                  .filter((override: any) => override && typeof override === 'object' && Object.keys(override).length > 0)
                  .map((override: any) => ({
                    date: override.date,
                    startTime: typeof override.startTime === 'number' 
                      ? minutesToTime(override.startTime) 
                      : override.startTime,
                    endTime: typeof override.endTime === 'number' 
                      ? minutesToTime(override.endTime) 
                      : override.endTime
                  }))
              : []
          }
        })
        
        setSchedules(transformedSchedules)
        
        // Check if schedules have empty availability arrays
        const emptyAvailability = transformedSchedules.some(
          (schedule: Schedule) => schedule.availability.length === 0
        );
        
        if (emptyAvailability) {
          setResult({
            success: true,
            message: `Cal.com schedules loaded with empty availability: This is normal for newly created schedules. Use the direct API to add availability.`,
            data: transformedSchedules
          })
        } else {
          setResult({
            success: true,
            message: `Successfully fetched ${data.data.length} schedule(s) from Cal.com`,
            data: transformedSchedules
          })
        }
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error) {
      console.error('Failed to fetch Cal.com schedules:', error)
      setResult({
        success: false,
        message: 'Failed to fetch Cal.com schedules',
        error: error instanceof Error ? error.message : String(error)
      })
      toast.error('Failed to fetch Cal.com schedules')
    } finally {
      setLoading(false)
    }
  }

  // Create a default schedule in Cal.com (using regular user schedules API)
  const createDefaultSchedule = async () => {
    try {
      setLoading(true)
      // This calls our backend API which uses the Cal.com regular user endpoint: POST /v2/schedules
      const response = await fetch('/api/cal/test/availability', {
        method: 'POST'
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create default schedule')
      }
      
      const data = await response.json()
      
      // Check if the created schedule has proper availability
      if (data.data && (!Array.isArray(data.data.availability) || data.data.availability.length === 0 || 
          data.data.availability.some((slot: any) => !slot.days || !slot.startTime || !slot.endTime))) {
        setResult({
          success: true,
          message: 'Created default schedule, but availability slots are missing or incomplete',
          data: data.data
        })
        toast.warning('Schedule created but may need configuration in Cal.com')
      } else {
        setResult({
          success: true,
          message: 'Successfully created default schedule in Cal.com',
          data: data.data
        })
        toast.success('Created default schedule in Cal.com')
      }
      
      // Refresh schedules list
      await fetchCalSchedules()
    } catch (error) {
      console.error('Failed to create default schedule:', error)
      setResult({
        success: false,
        message: 'Failed to create default schedule',
        error: error instanceof Error ? error.message : String(error)
      })
      toast.error('Failed to create default schedule')
    } finally {
      setLoading(false)
    }
  }

  // Create a schedule with proper availability using direct Cal.com API
  const createScheduleDirectApi = async () => {
    try {
      setLoading(true)
      console.log('Creating schedule via direct Cal.com API...')
      
      // First, we need to get the Cal.com API token
      const tokenResponse = await fetch('/api/cal/test/get-integration')
      if (!tokenResponse.ok) {
        throw new Error('Failed to retrieve Cal.com API token')
      }
      
      const tokenData = await tokenResponse.json()
      if (!tokenData.success || !tokenData.data?.integration?.calAccessToken) {
        throw new Error('Cal.com API token not found')
      }
      
      const calAccessToken = tokenData.data.integration.calAccessToken
      console.log('Retrieved Cal.com API token')
      
      // Prepare the schedule data with proper availability
      const scheduleData = {
        name: "Working Hours Schedule",
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        availability: [
          {
            days: [1, 2, 3, 4, 5], // Monday to Friday
            startTime: "09:00:00", // Format required by Cal.com API
            endTime: "17:00:00"
          },
          {
            days: [6], // Saturday
            startTime: "10:00:00",
            endTime: "15:00:00"
          }
        ]
      }
      console.log('Prepared schedule data:', scheduleData)
      
      // Now call the Cal.com API directly
      const options = {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${calAccessToken}`,
          'Content-Type': 'application/json',
          'cal-api-version': 'v2'
        },
        body: JSON.stringify(scheduleData)
      }
      
      console.log('Sending request to Cal.com API...')
      const calResponse = await fetch('https://api.cal.com/v2/schedules', options)
      
      if (!calResponse.ok) {
        const errorData = await calResponse.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Cal.com API error response:', errorData)
        throw new Error(errorData.error || 'Failed to create schedule via direct API')
      }
      
      const calData = await calResponse.json()
      console.log('Cal.com API success response:', calData)
      
      setResult({
        success: true,
        message: 'Successfully created schedule directly via Cal.com API',
        data: calData
      })
      
      // Refresh schedules list
      await fetchCalSchedules()
      toast.success('Created schedule via direct Cal.com API')
    } catch (error) {
      console.error('Failed to create schedule via direct API:', error)
      setResult({
        success: false,
        message: 'Failed to create schedule via direct Cal.com API',
        error: error instanceof Error ? error.message : String(error)
      })
      toast.error('Failed to create schedule via direct Cal.com API')
    } finally {
      setLoading(false)
    }
  }

  // Delete a schedule in Cal.com (using regular user schedules API)
  const deleteSchedule = async (scheduleId: number) => {
    try {
      setLoading(true)
      console.log(`Attempting to delete schedule ${scheduleId} via backend API...`)
      
      // Check if this is the default schedule
      const schedule = schedules.find(s => s.id === scheduleId);
      if (schedule?.isDefault) {
        setResult({
          success: false,
          message: 'Cannot delete default schedule',
          error: 'Cal.com does not allow deleting the default schedule. Please set another schedule as default first.'
        });
        toast.error('Cannot delete default schedule');
        return;
      }
      
      // This calls our backend API which uses the Cal.com regular user endpoint: DELETE /v2/schedules/{id}
      console.log(`Sending DELETE request to backend API for schedule ${scheduleId}...`)
      const response = await fetch(`/api/cal/test/availability/${scheduleId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Backend API error response:', errorData)
        
        if (response.status === 400 && errorData?.message?.includes('default')) {
          setResult({
            success: false,
            message: 'Backend API refused to delete this schedule',
            error: 'This may be a default schedule or have special protection in Cal.com'
          });
          toast.error('Cannot delete this schedule via API');
          return;
        }
        
        throw new Error(errorData.error || `Failed to delete schedule ${scheduleId}`)
      }
      
      const responseData = await response.json()
      console.log('Backend API success response:', responseData)
      
      setResult({
        success: true,
        message: `Successfully deleted schedule ${scheduleId} from Cal.com`,
        data: { scheduleId, response: responseData }
      })
      
      // Refresh schedules list
      await fetchCalSchedules()
      toast.success(`Deleted schedule ${scheduleId} from Cal.com`)
    } catch (error) {
      console.error(`Failed to delete schedule:`, error)
      setResult({
        success: false,
        message: 'Failed to delete schedule',
        error: error instanceof Error ? error.message : String(error)
      })
      toast.error('Failed to delete schedule')
    } finally {
      setLoading(false)
    }
  }
  
  // Delete a schedule using direct Cal.com API
  const deleteDirectCalSchedule = async (scheduleId: number) => {
    try {
      setLoading(true)
      console.log(`Attempting to delete schedule ${scheduleId} via direct API...`)
      
      // Check if this is the default schedule
      const schedule = schedules.find(s => s.id === scheduleId);
      if (schedule?.isDefault) {
        setResult({
          success: false,
          message: 'Cannot delete default schedule',
          error: 'Cal.com does not allow deleting the default schedule. Please set another schedule as default first.'
        });
        toast.error('Cannot delete default schedule');
        return;
      }
      
      // First, we need to get the Cal.com API token
      const tokenResponse = await fetch('/api/cal/test/get-integration')
      if (!tokenResponse.ok) {
        throw new Error('Failed to retrieve Cal.com API token')
      }
      
      const tokenData = await tokenResponse.json()
      if (!tokenData.success || !tokenData.data?.integration?.calAccessToken) {
        throw new Error('Cal.com API token not found')
      }
      
      const calAccessToken = tokenData.data.integration.calAccessToken
      console.log('Retrieved Cal.com API token, preparing to delete schedule...')
      
      // Now call the Cal.com API directly
      const options = {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${calAccessToken}`,
          'Content-Type': 'application/json',
          'cal-api-version': 'v2' // Using v2 of the API
        }
      }
      
      console.log(`Sending DELETE request to Cal.com API for schedule ${scheduleId}...`)
      const calResponse = await fetch(`https://api.cal.com/v2/schedules/${scheduleId}`, options)
      
      if (!calResponse.ok) {
        const errorData = await calResponse.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Cal.com API error response:', errorData)
        
        if (calResponse.status === 400 && errorData?.message?.includes('default')) {
          setResult({
            success: false,
            message: 'Cal.com API refused to delete this schedule',
            error: 'This may be a default schedule or have special protection in Cal.com'
          });
          toast.error('Cannot delete this schedule via API');
          return;
        }
        
        throw new Error(errorData.error || `Failed to delete schedule ${scheduleId} via direct API`)
      }
      
      const calData = await calResponse.json()
      console.log('Cal.com API success response:', calData)
      
      setResult({
        success: true,
        message: `Successfully deleted schedule ${scheduleId} directly from Cal.com API`,
        data: calData
      })
      
      // Refresh schedules list
      await fetchCalSchedules()
      toast.success(`Deleted schedule ${scheduleId} via direct Cal.com API`)
    } catch (error) {
      console.error(`Failed to delete schedule via direct API:`, error)
      setResult({
        success: false,
        message: 'Failed to delete schedule via direct Cal.com API',
        error: error instanceof Error ? error.message : String(error)
      })
      toast.error('Failed to delete via direct Cal.com API')
    } finally {
      setLoading(false)
    }
  }

  // This function fixes empty availability by adding default working hours using direct Cal.com API
  const fixEmptyAvailability = async (scheduleId: number) => {
    try {
      setLoading(true)
      console.log(`Fixing availability for schedule ${scheduleId}...`)
      
      // First, we need to get the Cal.com API token
      const tokenResponse = await fetch('/api/cal/test/get-integration')
      if (!tokenResponse.ok) {
        throw new Error('Failed to retrieve Cal.com API token')
      }
      
      const tokenData = await tokenResponse.json()
      if (!tokenData.success || !tokenData.data?.integration?.calAccessToken) {
        throw new Error('Cal.com API token not found')
      }
      
      const calAccessToken = tokenData.data.integration.calAccessToken
      console.log('Retrieved Cal.com API token')
      
      // Define default working hours
      const defaultAvailability = [
        {
          days: [1, 2, 3, 4, 5], // Monday to Friday
          startTime: "09:00:00", // Format required by Cal.com API
          endTime: "17:00:00"
        }
      ]
      
      // Now call the Cal.com API directly to update the schedule
      const payload = {
        availability: defaultAvailability
      }
      console.log('Sending update to Cal.com API:', payload)
      
      const options = {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${calAccessToken}`,
          'Content-Type': 'application/json',
          'cal-api-version': 'v2'
        },
        body: JSON.stringify(payload)
      }
      
      const calResponse = await fetch(`https://api.cal.com/v2/schedules/${scheduleId}`, options)
      
      if (!calResponse.ok) {
        const errorData = await calResponse.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Cal.com API error response:', errorData)
        throw new Error(errorData.error || `Failed to update schedule ${scheduleId} availability`)
      }
      
      const calData = await calResponse.json()
      console.log('Cal.com API success response:', calData)
      
      setResult({
        success: true,
        message: `Successfully updated schedule ${scheduleId} with default working hours`,
        data: calData
      })
      
      // Refresh schedules list
      await fetchCalSchedules()
      toast.success(`Updated schedule ${scheduleId} with default working hours`)
    } catch (error) {
      console.error(`Failed to fix schedule availability:`, error)
      setResult({
        success: false,
        message: 'Failed to fix schedule availability',
        error: error instanceof Error ? error.message : String(error)
      })
      toast.error('Failed to fix schedule availability')
    } finally {
      setLoading(false)
    }
  }

  // Set a schedule as the default
  const setAsDefault = async (scheduleId: number) => {
    try {
      setLoading(true)
      console.log(`Attempting to set schedule ${scheduleId} as default...`)
      
      // First, we need to get the Cal.com API token
      const tokenResponse = await fetch('/api/cal/test/get-integration')
      if (!tokenResponse.ok) {
        throw new Error('Failed to retrieve Cal.com API token')
      }
      
      const tokenData = await tokenResponse.json()
      if (!tokenData.success || !tokenData.data?.integration?.calAccessToken) {
        throw new Error('Cal.com API token not found')
      }
      
      const calAccessToken = tokenData.data.integration.calAccessToken
      console.log('Retrieved Cal.com API token, preparing to set schedule as default...')
      
      // Now call the Cal.com API directly to set this schedule as default
      const options = {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${calAccessToken}`,
          'Content-Type': 'application/json',
          'cal-api-version': 'v2'
        },
        body: JSON.stringify({
          isDefault: true
        })
      }
      
      console.log(`Sending PATCH request to Cal.com API for schedule ${scheduleId}...`)
      const calResponse = await fetch(`https://api.cal.com/v2/schedules/${scheduleId}`, options)
      
      if (!calResponse.ok) {
        const errorData = await calResponse.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Cal.com API error response:', errorData)
        throw new Error(errorData.error || `Failed to set schedule ${scheduleId} as default`)
      }
      
      const calData = await calResponse.json()
      console.log('Cal.com API success response:', calData)
      
      setResult({
        success: true,
        message: `Successfully set schedule ${scheduleId} as default`,
        data: calData
      })
      
      // Refresh schedules list to see updated default status
      await fetchCalSchedules()
      toast.success(`Schedule ${scheduleId} is now the default`)
    } catch (error) {
      console.error(`Failed to set schedule as default:`, error)
      setResult({
        success: false,
        message: 'Failed to set schedule as default',
        error: error instanceof Error ? error.message : String(error)
      })
      toast.error('Failed to set schedule as default')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          onClick={fetchCalSchedules}
          disabled={loading}
          variant="outline"
          className="gap-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh Schedules
        </Button>
        
        <div className="flex gap-2">
          <Button
            onClick={createScheduleDirectApi}
            disabled={loading}
            variant="outline"
            className="gap-2 border-green-200 text-green-700 hover:bg-green-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarIcon className="h-4 w-4" />}
            Create New Schedule
          </Button>
        </div>
      </div>

      <ResultAlert result={result} />

      <Alert className="mb-4 bg-blue-50">
        <AlertTitle>Cal.com Schedule Information</AlertTitle>
        <AlertDescription>
          <ul className="list-disc list-inside text-sm space-y-1">
            <li>Cal.com always creates one default schedule automatically</li>
            <li>Default schedules cannot be deleted through the API</li>
            <li>You can create additional non-default schedules</li>
            <li>New schedules typically have empty availability that must be configured in Cal.com</li>
            <li>If you have multiple default schedules, use the "Set as Default" button to make one schedule the default, which will automatically remove the default status from others</li>
          </ul>
        </AlertDescription>
      </Alert>

      {schedules.filter(schedule => schedule.isDefault).length > 1 && (
        <Alert className="mb-4 bg-red-50 border-red-300">
          <AlertTitle>Multiple Default Schedules Detected</AlertTitle>
          <AlertDescription>
            <p className="mb-2">
              You have {schedules.filter(schedule => schedule.isDefault).length} default schedules. This is not normal and can cause issues with Cal.com.
            </p>
            <p className="font-medium">To fix this issue:</p>
            <ol className="list-decimal list-inside ml-2 space-y-1 mt-1">
              <li>Choose which schedule you want to keep as your default</li>
              <li>Click the "Set as Default" button on that schedule</li>
              <li>This will automatically remove the default status from all other schedules</li>
              <li>After that, you can safely delete the non-default schedules if needed</li>
            </ol>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="schedules">
        <TabsList>
          <TabsTrigger value="schedules">Schedules</TabsTrigger>
          <TabsTrigger value="raw">Raw Data</TabsTrigger>
        </TabsList>
        
        <TabsContent value="schedules" className="pt-4">
          {schedules.length === 0 ? (
            <Alert>
              <AlertTitle>No schedules found</AlertTitle>
              <AlertDescription>
                No availability schedules found in your Cal.com account. 
                Create a default schedule to get started.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-6">
              {schedules.some((schedule: Schedule) => schedule.availability.length === 0) && (
                <Alert className="bg-amber-50 mb-4">
                  <AlertTitle>Empty Availability Detected</AlertTitle>
                  <AlertDescription>
                    <p>
                      Some schedules have empty availability slots. This is normal for newly created Cal.com schedules.
                    </p>
                    <ul className="list-disc list-inside mt-2 text-sm">
                      <li>To set availability, use the Cal.com dashboard directly</li>
                      <li>Default schedules cannot be deleted through the API</li>
                      <li>Create a new schedule with the "Create Schedule (Direct API)" button to get one with proper availability</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            
              {schedules.map((schedule) => (
                <Card 
                  key={schedule.id} 
                  className={`relative 
                    ${schedule.availability.length === 0 ? 'border-amber-300' : ''} 
                    ${schedule.isDefault ? 'border-green-300 bg-green-50/30' : ''}`
                  }
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg flex items-center">
                          {schedule.name} 
                          {schedule.isDefault && (
                            <span className="ml-2 text-xs bg-green-100 text-green-800 py-0.5 px-2 rounded-full">Default</span>
                          )}
                          {schedule.availability.length === 0 && (
                            <span className="ml-2 text-xs bg-amber-100 text-amber-800 py-0.5 px-2 rounded-full">Empty Availability</span>
                          )}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Timezone: {schedule.timeZone} | ID: {schedule.id}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {!schedule.isDefault && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setAsDefault(schedule.id)}
                            disabled={loading}
                            className="border-blue-200 text-blue-700 hover:bg-blue-50"
                          >
                            Set as Default
                          </Button>
                        )}
                        {!schedule.isDefault && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => deleteDirectCalSchedule(schedule.id)}
                            disabled={loading}
                            className="border-red-200 text-red-700 hover:bg-red-50"
                          >
                            Delete (Direct API)
                          </Button>
                        )}
                        {!schedule.isDefault && (
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => deleteSchedule(schedule.id)}
                            disabled={loading}
                          >
                            Delete
                          </Button>
                        )}
                        {schedule.isDefault && (
                          <div className="text-xs text-muted-foreground italic flex items-center px-2">
                            Default schedules cannot be deleted
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2">Regular Availability</h4>
                        {schedule.availability && schedule.availability.length > 0 ? (
                          <div className="space-y-2">
                            {schedule.availability.map((slot, index) => (
                              <div key={index} className="mb-3 p-2 rounded bg-accent/10">
                                <p className="text-sm">
                                  <span className="font-medium">{Array.isArray(slot.days) ? slot.days.join(', ') : slot.days}</span>: 
                                  {' '}{formatTime(slot.startTime)} to {formatTime(slot.endTime)}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No regular availability configured</p>
                        )}
                      </div>
                      
                      {schedule.overrides && schedule.overrides.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">Date Overrides</h4>
                          <div className="space-y-2">
                            {schedule.overrides.map((override, index) => (
                              <div key={index} className="mb-3 p-2 rounded bg-yellow-50">
                                <p className="text-sm">
                                  <span className="font-medium">{override.date}</span>: 
                                  {' '}{formatTime(override.startTime)} to {formatTime(override.endTime)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="raw" className="pt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {schedules.some((schedule: Schedule) => schedule.availability.length === 0) && (
                  <Alert className="bg-amber-50 mb-4">
                    <AlertTitle>Empty Availability Detected</AlertTitle>
                    <AlertDescription>
                      <p>
                        The raw data below shows schedules with empty availability arrays.
                        This is normal for newly created Cal.com schedules.
                      </p>
                      <p className="mt-2">
                        A properly configured schedule should have availability entries with day, startTime, and endTime fields.
                        Example: <code className="text-xs bg-white/60 p-1 rounded">{`{"days":[0,1,2,3,4],"startTime":"09:00","endTime":"17:00"}`}</code>
                      </p>
                    </AlertDescription>
                  </Alert>
                )}
              
                {schedules.some((schedule: Schedule) => schedule.isDefault) && (
                  <Alert className="bg-blue-50 mb-4">
                    <AlertTitle>Default Schedule Information</AlertTitle>
                    <AlertDescription>
                      <p>
                        One or more schedules is marked as "default". Default schedules cannot be deleted through the Cal.com API.
                      </p>
                      {schedules.filter(schedule => schedule.isDefault).length > 1 && (
                        <p className="mt-2 text-red-600">
                          <strong>Warning:</strong> You have {schedules.filter(schedule => schedule.isDefault).length} default schedules. Cal.com should only have one default schedule. 
                          Use the "Set as Default" button on a non-default schedule to fix this issue.
                        </p>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              
                <div>
                  <Label htmlFor="cal-schedules">Cal.com Schedules Data</Label>
                  <Textarea
                    id="cal-schedules"
                    className="font-mono h-96"
                    value={schedules.length > 0 ? JSON.stringify(schedules, null, 2) : 'No schedules available'}
                    readOnly
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 