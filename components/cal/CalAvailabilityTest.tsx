'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Loader2, CalendarIcon } from 'lucide-react'
import { useAuth } from '@/utils/hooks/useAuth'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AvailabilityManager } from '@/components/coaching/AvailabilityManager'
import { fetchCoachAvailability, saveCoachAvailability } from '@/utils/actions/availability'
import { AvailabilityResponse, SaveAvailabilityParams } from '@/utils/types/availability'
import { ApiResponse, ApiErrorCode } from '@/utils/types/api'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { TestResult, ResultAlert, createBaseSchedule } from './CalTestUtils'

export default function CalAvailabilityTest() {
  const { isSignedIn, userUlid } = useAuth()
  const [availabilityData, setAvailabilityData] = useState<AvailabilityResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)
  const [selectedTimezone, setSelectedTimezone] = useState<string>(() => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  })
  const [timezones, setTimezones] = useState<string[]>([])
  const [calToken, setCalToken] = useState('')

  // Common timezones for testing
  useEffect(() => {
    setTimezones([
      'America/New_York',
      'America/Los_Angeles',
      'America/Chicago',
      'Europe/London',
      'Europe/Paris',
      'Asia/Tokyo',
      'Asia/Singapore',
      'Australia/Sydney',
      Intl.DateTimeFormat().resolvedOptions().timeZone
    ])
  }, [])

  // Fetch user's availability data
  useEffect(() => {
    // Always try to fetch availability data even if not signed in (for testing)
    fetchAvailabilityData()
  }, [isSignedIn, userUlid])

  const fetchAvailabilityData = async () => {
    try {
      setLoading(true)
      
      // Only attempt to fetch from API if user is signed in
      if (isSignedIn && userUlid) {
        const result = await fetchCoachAvailability({})
        
        console.log('Fetched availability result:', result)
        
        if (result.data) {
          setAvailabilityData(result.data)
          setResult({
            success: true,
            message: 'Successfully fetched availability schedule',
            data: result.data
          })
        } else if (result.error) {
          setResult({
            success: false,
            message: 'Failed to fetch availability schedule',
            error: result.error
          })
        } else {
          setResult({
            success: true,
            message: 'No availability schedule found',
            data: null
          })
        }
      } else {
        // If not signed in, we'll work with default or test data
        setResult({
          success: true,
          message: 'Using test availability data (not signed in)',
          data: null
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Exception while fetching availability',
        error: error instanceof Error ? error.message : String(error)
      })
    } finally {
      setLoading(false)
    }
  }

  // Test saving availability
  const handleSaveAvailability = async (params: SaveAvailabilityParams): Promise<ApiResponse<{ success: true }>> => {
    try {
      setLoading(true)
      
      if (!isSignedIn) {
        // If not signed in, just simulate success for testing
        setResult({
          success: true,
          message: 'Test mode: Simulated successful save (not actually saved)',
          data: params
        })
        toast.success('Test mode: Availability "saved" (simulation)')
        
        return {
          data: { success: true },
          error: null
        }
      }
      
      const result = await saveCoachAvailability(params)
      
      if (result.data?.success) {
        setResult({
          success: true,
          message: 'Successfully saved availability schedule',
          data: params
        })
        await fetchAvailabilityData()
        toast.success('Availability saved successfully')
      } else if (result.error) {
        setResult({
          success: false,
          message: 'Failed to save availability schedule',
          error: result.error
        })
        toast.error('Failed to save availability')
      }
      
      return result
    } catch (error) {
      const errorResult = {
        data: null,
        error: {
          code: 'INTERNAL_ERROR' as ApiErrorCode,
          message: error instanceof Error ? error.message : 'An unexpected error occurred'
        }
      }
      setResult({
        success: false,
        message: 'Exception while saving availability',
        error: error instanceof Error ? error.message : String(error)
      })
      toast.error('Error saving availability')
      return errorResult
    } finally {
      setLoading(false)
    }
  }

  // Fetch Cal.com integration token for testing
  const fetchCalTokens = async () => {
    try {
      setLoading(true)
      
      if (!isSignedIn) {
        setResult({
          success: false,
          message: 'Test mode: Cannot fetch Cal.com token when not signed in',
          error: 'Please sign in first'
        })
        return
      }
      
      const response = await fetch('/api/cal/test/get-integration')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data?.integration?.calAccessToken) {
          setCalToken(data.data.integration.calAccessToken)
          setResult({
            success: true,
            message: 'Successfully retrieved Cal.com access token',
            data: { accessToken: `${data.data.integration.calAccessToken.substring(0, 10)}...` }
          })
        } else {
          setResult({
            success: false,
            message: 'No Cal.com integration found',
            error: 'User has not connected Cal.com account'
          })
        }
      } else {
        setResult({
          success: false,
          message: 'Failed to retrieve Cal.com integration',
          error: 'API request failed'
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Exception while retrieving Cal.com integration',
        error: error instanceof Error ? error.message : String(error)
      })
    } finally {
      setLoading(false)
    }
  }

  // This would be implemented in the future to sync with Cal.com
  const syncToCalendar = async () => {
    try {
      setLoading(true)
      // Placeholder for future implementation
      setResult({
        success: false,
        message: 'Cal.com sync not yet implemented',
        error: 'This feature is coming soon'
      })
    } catch (error) {
      setResult({
        success: false,
        message: 'Exception in sync operation',
        error: error instanceof Error ? error.message : String(error)
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {!isSignedIn && (
        <Alert className="mb-4 bg-amber-50">
          <AlertTitle>Test Mode</AlertTitle>
          <AlertDescription>
            You are not signed in. This component is running in test mode and changes will not be saved.
          </AlertDescription>
        </Alert>
      )}
    
      <div className="flex items-center gap-4">
        <Button
          onClick={fetchAvailabilityData}
          disabled={loading}
          variant="outline"
          className="gap-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarIcon className="h-4 w-4" />}
          Fetch Availability
        </Button>
        
        <Button
          onClick={fetchCalTokens}
          disabled={loading || !isSignedIn}
          variant="outline"
          className="gap-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Get Cal.com Token
        </Button>
        
        <Select
          value={selectedTimezone}
          onValueChange={setSelectedTimezone}
        >
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Select timezone" />
          </SelectTrigger>
          <SelectContent>
            {timezones.map((tz) => (
              <SelectItem key={tz} value={tz}>
                {tz}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ResultAlert result={result} />

      <Tabs defaultValue="manager">
        <TabsList>
          <TabsTrigger value="manager">Availability Manager</TabsTrigger>
          <TabsTrigger value="raw">Raw Data</TabsTrigger>
        </TabsList>
        
        <TabsContent value="manager" className="pt-4">
          <AvailabilityManager
            initialSchedule={availabilityData ? availabilityData : { schedule: createBaseSchedule(), timezone: selectedTimezone }}
            onSave={handleSaveAvailability}
          />
        </TabsContent>
        
        <TabsContent value="raw" className="pt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="availability-data">Availability Data</Label>
                  <Textarea
                    id="availability-data"
                    className="font-mono h-96"
                    value={availabilityData ? JSON.stringify(availabilityData, null, 2) : 'No data available'}
                    readOnly
                  />
                </div>
                
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={syncToCalendar}
                    disabled={loading || !availabilityData}
                    className="gap-2"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Sync to Cal.com (Coming Soon)
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 