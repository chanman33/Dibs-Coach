'use client'

/**
 * Cal.com Managed Users API Test
 * 
 * This component provides a testing interface for Cal.com API v2 managed users endpoints.
 * 
 * Endpoints implemented:
 * - GET /api/cal/users/get-all - Get all managed users (internal API)
 * - GET /api/cal/users/get-user - Get a specific managed user (internal API)
 * - DELETE /api/cal/users/delete-user - Delete a managed user (internal API)
 * - POST /api/cal/users/create-managed-user - Create a managed user (internal API)
 * - PUT /api/cal/users/update-user - Update a managed user (internal API)
 * - POST /v2/oauth-clients/{clientId}/users/{userId}/refresh - Refresh a user's token
 * - POST /v2/oauth-clients/{clientId}/users/{userId}/force-refresh - Force refresh a user's token
 * 
 * All requests include the x-cal-client-id and x-cal-secret-key headers automatically
 * via the makeCalApiRequest utility.
 */

import { useState } from 'react'
import { makeCalApiRequest } from '@/utils/cal/cal-api-utils'
import { env } from '@/lib/env'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

type ManagedUser = {
  id: number
  email: string
  name: string
  timeZone?: string
  timeFormat?: number
  weekStart?: string
  locale?: string
  defaultScheduleId?: number
}

type ResponseData = {
  status: string
  data: any
  error?: any
}

export default function CalManagedUsersTest() {
  // Use the client ID from environment variables
  const clientId = env.NEXT_PUBLIC_CAL_CLIENT_ID
  
  // State for form inputs
  const [userId, setUserId] = useState('')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [timeZone, setTimeZone] = useState('America/New_York')
  const [timeFormat, setTimeFormat] = useState<string>('12')
  const [weekStart, setWeekStart] = useState('Monday')
  const [locale, setLocale] = useState('en')
  
  // State for response data
  const [response, setResponse] = useState<ResponseData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Add state to track deletion success
  const [userDeleted, setUserDeleted] = useState(false)
  const [deletedUserId, setDeletedUserId] = useState<string>('')
  
  // Supported locales in Cal.com
  const locales = [
    'ar', 'ca', 'de', 'es', 'eu', 'he', 'id', 'ja', 'lv', 'pl', 
    'ro', 'sr', 'th', 'vi', 'az', 'cs', 'el', 'es-419', 'fi', 
    'hr', 'it', 'km', 'nl', 'pt', 'ru', 'sv', 'tr', 'zh-CN', 
    'bg', 'da', 'en', 'et', 'fr', 'hu', 'iw', 'ko', 'no', 
    'pt-BR', 'sk', 'ta', 'uk', 'zh-TW'
  ]
  
  // Supported week start days in Cal.com
  const weekStartOptions = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 
    'Friday', 'Saturday', 'Sunday'
  ]
  
  // Format the response for display
  const formatResponse = (data: any) => {
    return JSON.stringify(data, null, 2)
  }
  
  // API call handlers
  const getAllManagedUsers = async () => {
    setLoading(true)
    setError('')
    
    try {
      // Use the API route with directFetch to get the most accurate results
      const response = await fetch('/api/cal/users/get-all?directFetch=true')
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Request failed with status ${response.status}`)
      }
      
      const result = await response.json()
      setResponse(result)
    } catch (err: any) {
      setError(err.message || 'Error fetching managed users')
    } finally {
      setLoading(false)
    }
  }
  
  const createManagedUser = async () => {
    if (!email || !name) {
      setError('Email and name are required')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      const payload: any = {
        email,
        name,
        timeZone,
        timeFormat: parseInt(timeFormat),
        weekStart,
        locale
      }
      
      // Use the internal API endpoint instead of calling Cal.com directly
      const response = await fetch('/api/cal/users/create-managed-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Request failed with status ${response.status}`)
      }
      
      const result = await response.json()
      setResponse(result)
    } catch (err: any) {
      setError(err.message || 'Error creating managed user')
    } finally {
      setLoading(false)
    }
  }
  
  const getManagedUser = async () => {
    if (!userId) {
      setError('User ID is required')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      // Use the internal API endpoint instead of calling Cal.com directly
      const response = await fetch(`/api/cal/users/get-user?userId=${userId}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Request failed with status ${response.status}`)
      }
      
      const result = await response.json()
      setResponse(result)
    } catch (err: any) {
      setError(err.message || 'Error fetching managed user')
    } finally {
      setLoading(false)
    }
  }
  
  const updateManagedUser = async () => {
    if (!userId) {
      setError('User ID is required')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      const payload: any = {}
      
      if (email) payload.email = email
      if (name) payload.name = name
      if (timeZone) payload.timeZone = timeZone
      if (timeFormat) payload.timeFormat = parseInt(timeFormat)
      if (weekStart) payload.weekStart = weekStart
      if (locale) payload.locale = locale
      
      // Use the internal API endpoint instead of calling Cal.com directly
      const response = await fetch(`/api/cal/users/update-user?userId=${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Request failed with status ${response.status}`)
      }
      
      const result = await response.json()
      setResponse(result)
    } catch (err: any) {
      setError(err.message || 'Error updating managed user')
    } finally {
      setLoading(false)
    }
  }
  
  const deleteManagedUser = async () => {
    if (!userId) {
      setError('User ID is required')
      return
    }
    
    setLoading(true)
    setError('')
    setUserDeleted(false)
    
    try {
      // Use the internal API endpoint instead of calling Cal.com directly
      const response = await fetch(`/api/cal/users/delete-user?userId=${userId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Request failed with status ${response.status}`)
      }
      
      const result = await response.json()
      setResponse(result)
      
      // Mark user as successfully deleted
      setUserDeleted(true)
      setDeletedUserId(userId)
    } catch (err: any) {
      setError(err.message || 'Error deleting managed user')
    } finally {
      setLoading(false)
    }
  }
  
  const refreshManagedUserToken = async () => {
    if (!clientId) {
      setError('CAL_CLIENT_ID environment variable is not set')
      return
    }
    
    if (!userId) {
      setError('User ID is required')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      const result = await makeCalApiRequest({
        endpoint: `/oauth-clients/${clientId}/users/${userId}/refresh`,
        method: 'POST'
      })
      
      setResponse(result)
    } catch (err: any) {
      setError(err.message || 'Error refreshing token')
    } finally {
      setLoading(false)
    }
  }
  
  const forceRefreshManagedUserToken = async () => {
    if (!clientId) {
      setError('CAL_CLIENT_ID environment variable is not set')
      return
    }
    
    if (!userId) {
      setError('User ID is required')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      const result = await makeCalApiRequest({
        endpoint: `/oauth-clients/${clientId}/users/${userId}/force-refresh`,
        method: 'POST'
      })
      
      setResponse(result)
    } catch (err: any) {
      setError(err.message || 'Error force refreshing token')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Cal.com Managed Users API Test</h1>
      
      {/* Add note about caching behavior */}
      {userDeleted && (
        <Alert className="mb-6">
          <AlertDescription>
            <p>
              <strong>Note:</strong> User {deletedUserId} was deleted. It may take a moment for all Cal.com systems 
              to reflect this change.
            </p>
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Cal.com API Settings</CardTitle>
              <CardDescription>
                Using Client ID: {clientId ? clientId : 'Not set in environment variables'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="userId">User ID</Label>
                  <Input 
                    id="userId"
                    placeholder="Managed User ID (for operations on existing users)"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Tabs defaultValue="all" className="mt-6">
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="all">List/Get</TabsTrigger>
              <TabsTrigger value="create">Create</TabsTrigger>
              <TabsTrigger value="modify">Modify/Delete</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Get All Managed Users</CardTitle>
                  <CardDescription>
                    Retrieve all managed users using internal API endpoint
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={getAllManagedUsers}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? <LoadingSpinner /> : 'Get All Users'}
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Get Managed User</CardTitle>
                  <CardDescription>
                    Retrieve a specific managed user by ID using internal API endpoint
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={getManagedUser}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? <LoadingSpinner /> : 'Get User'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="create">
              <Card>
                <CardHeader>
                  <CardTitle>Create Managed User</CardTitle>
                  <CardDescription>
                    Create a new managed user
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email (required)</Label>
                      <Input 
                        id="email"
                        placeholder="user@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">Name (required)</Label>
                      <Input 
                        id="name"
                        placeholder="User Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timeZone">Time Zone</Label>
                      <Input 
                        id="timeZone"
                        placeholder="America/New_York"
                        value={timeZone}
                        onChange={(e) => setTimeZone(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timeFormat">Time Format</Label>
                      <Select 
                        value={timeFormat} 
                        onValueChange={setTimeFormat}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select time format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="12">12-hour</SelectItem>
                          <SelectItem value="24">24-hour</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="weekStart">Week Start</Label>
                      <Select 
                        value={weekStart} 
                        onValueChange={setWeekStart}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select week start" />
                        </SelectTrigger>
                        <SelectContent>
                          {weekStartOptions.map(day => (
                            <SelectItem key={day} value={day}>
                              {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="locale">Locale</Label>
                      <Select 
                        value={locale} 
                        onValueChange={setLocale}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select locale" />
                        </SelectTrigger>
                        <SelectContent>
                          {locales.map(loc => (
                            <SelectItem key={loc} value={loc}>
                              {loc}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      onClick={createManagedUser}
                      disabled={loading}
                      className="w-full"
                    >
                      {loading ? <LoadingSpinner /> : 'Create User'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="modify" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Update Managed User</CardTitle>
                  <CardDescription>
                    Update an existing managed user's details using internal API endpoint
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="updateEmail">Email</Label>
                      <Input 
                        id="updateEmail"
                        placeholder="user@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="updateName">Name</Label>
                      <Input 
                        id="updateName"
                        placeholder="User Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="updateTimeZone">Time Zone</Label>
                      <Input 
                        id="updateTimeZone"
                        placeholder="America/New_York"
                        value={timeZone}
                        onChange={(e) => setTimeZone(e.target.value)}
                      />
                    </div>
                    <Button 
                      onClick={updateManagedUser}
                      disabled={loading}
                      className="w-full"
                    >
                      {loading ? <LoadingSpinner /> : 'Update User'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Delete Managed User</CardTitle>
                  <CardDescription>
                    Permanently delete a managed user using internal API endpoint
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={deleteManagedUser}
                    disabled={loading}
                    variant="destructive"
                    className="w-full"
                  >
                    {loading ? <LoadingSpinner /> : 'Delete User'}
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Token Operations</CardTitle>
                  <CardDescription>
                    Refresh or force refresh managed user tokens
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={refreshManagedUserToken}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? <LoadingSpinner /> : 'Refresh Token'}
                  </Button>
                  <Button 
                    onClick={forceRefreshManagedUserToken}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? <LoadingSpinner /> : 'Force Refresh Token'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>API Response</CardTitle>
              <CardDescription>Response from Cal.com API</CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <ScrollArea className="h-[600px] rounded-md border p-4">
                {loading ? (
                  <div className="flex justify-center items-center h-full">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : response ? (
                  <div>
                    {response?.data?.users && (
                      <div className="mb-2 text-xs text-muted-foreground">
                        {response.data.users.length} users found
                      </div>
                    )}
                    <pre className="text-sm">{formatResponse(response)}</pre>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No response yet. Run an API operation to see results.
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
