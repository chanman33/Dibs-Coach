'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Loader2, CheckCircle, XCircle, CalendarIcon } from 'lucide-react'
import { useAuth } from '@/utils/hooks/useAuth'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AvailabilityManager } from '@/components/coaching/AvailabilityManager'
import { fetchCoachAvailability, saveCoachAvailability } from '@/utils/actions/availability'
import { AvailabilityResponse, SaveAvailabilityParams } from '@/utils/types/availability'
import { ApiResponse, ApiErrorCode } from '@/utils/types/api'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface TestResult {
  success: boolean
  message: string
  data?: any
  error?: any
}

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
    if (isSignedIn && userUlid) {
      fetchAvailabilityData()
    }
  }, [isSignedIn, userUlid])

  const fetchAvailabilityData = async () => {
    try {
      setLoading(true)
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
      <div className="flex items-center gap-4">
        <Button
          onClick={fetchAvailabilityData}
          disabled={loading || !isSignedIn}
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
                <h4 className="font-semibold mb-1">Data:</h4>
                <pre className="overflow-auto p-2 bg-gray-100 rounded">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>
            </AlertDescription>
          )}
        </Alert>
      )}

      <Card className="border-t-4 border-t-primary">
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Availability Manager</h3>
          <AvailabilityManager 
            key={JSON.stringify(availabilityData)} 
            onSave={handleSaveAvailability} 
            initialSchedule={availabilityData || undefined}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Cal.com Availability Sync</h3>
            <p className="text-sm text-muted-foreground">
              This section will allow syncing the local availability schedule to Cal.com.
              Currently this feature is not implemented.
            </p>
            <div className="flex flex-col gap-4">
              <div>
                <Label htmlFor="cal-token" className="mb-2 block">Cal.com Access Token</Label>
                <Textarea 
                  id="cal-token"
                  value={calToken ? `${calToken.substring(0, 10)}...` : 'No token available'}
                  readOnly
                  rows={1}
                  className="font-mono text-sm"
                />
              </div>
              <Button 
                onClick={syncToCalendar}
                disabled={true}
                className="w-fit"
              >
                Sync to Cal.com (Coming Soon)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 