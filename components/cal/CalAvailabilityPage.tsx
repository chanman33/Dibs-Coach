'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import CalAvailabilityTest from './CalAvailabilityTest'
import CalAvailabilitySyncTest from './CalAvailabilitySyncTest'
import { calApiClient, CalTokens } from '@/lib/cal/cal-api'
import { calConfig } from '@/lib/cal/cal'

export default function CalAvailabilityPage() {
  const [isConnected, setIsConnected] = useState(false)
  const [isConfigured, setIsConfigured] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showDebug, setShowDebug] = useState(false)
  const [debugValues, setDebugValues] = useState({
    clientId: '',
    clientSecret: '',
    organizationId: '',
    redirectUrl: '',
  })

  // Check if Cal.com is configured using a server endpoint
  useEffect(() => {
    async function checkConfig() {
      try {
        setIsLoading(true)
        const response = await fetch('/api/cal/config')
        const data = await response.json()
        
        setIsConfigured(data.isConfigured)
        setDebugValues({
          clientId: data.clientId || 'MISSING',
          clientSecret: data.hasClientSecret ? 'PRESENT (hidden)' : 'MISSING',
          organizationId: data.organizationId || 'MISSING',
          redirectUrl: data.redirectUrl || 'MISSING',
        })
      } catch (error) {
        console.error('Failed to check Cal.com configuration:', error)
        setIsConfigured(false)
      } finally {
        setIsLoading(false)
      }
    }
    
    checkConfig()
  }, [])

  // Check if we have tokens in localStorage
  useEffect(() => {
    const tokens = localStorage.getItem('cal_tokens')
    if (tokens) {
      try {
        const parsedTokens = JSON.parse(tokens) as CalTokens
        calApiClient.setTokens(parsedTokens)
        setIsConnected(true)
      } catch (error) {
        console.error('Failed to parse saved tokens:', error)
        localStorage.removeItem('cal_tokens')
      }
    }
  }, [])

  // Handle OAuth callback
  useEffect(() => {
    if (!isConfigured || isLoading) return
    
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    
    if (code) {
      // Exchange code for tokens
      exchangeCodeForTokens(code)
    }
  }, [isConfigured, isLoading])

  const exchangeCodeForTokens = async (code: string) => {
    if (!isConfigured) return
    
    try {
      const response = await fetch('/api/cal/exchange-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          redirect_uri: calConfig.redirectUrl,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to exchange code for tokens')
      }

      const data = await response.json()
      const tokens: CalTokens = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: Date.now() + data.expires_in * 1000,
      }

      // Store tokens and update client
      localStorage.setItem('cal_tokens', JSON.stringify(tokens))
      calApiClient.setTokens(tokens)
      setIsConnected(true)

      // Remove code from URL
      window.history.replaceState({}, '', window.location.pathname)
    } catch (error) {
      console.error('Failed to exchange code for tokens:', error)
    }
  }

  const handleConnect = async () => {
    if (!isConfigured) return
    
    try {
      // Get auth URL from server to ensure client ID is properly used
      const response = await fetch('/api/cal/auth-url')
      const data = await response.json()
      
      if (data.authUrl) {
        window.location.href = data.authUrl
      } else {
        console.error('Failed to get Cal.com auth URL')
      }
    } catch (error) {
      console.error('Failed to initiate Cal.com connection:', error)
    }
  }

  const handleReload = () => {
    window.location.reload()
  }

  const handleDisconnect = () => {
    localStorage.removeItem('cal_tokens')
    setIsConnected(false)
  }

  const toggleDebug = () => {
    setShowDebug(!showDebug)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-slate-200 h-12 w-12"></div>
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-slate-200 rounded"></div>
              <div className="h-4 bg-slate-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {!isConfigured && (
        <Alert className="mb-6" variant="destructive">
          <AlertTitle>Cal.com API Not Configured</AlertTitle>
          <AlertDescription>
            <p>Missing required Cal.com environment variables. Add them to your .env.local file:</p>
            <ul className="list-disc pl-5 mt-2">
              <li>NEXT_PUBLIC_CAL_CLIENT_ID</li>
              <li>CAL_CLIENT_SECRET</li>
              <li>NEXT_PUBLIC_CAL_ORGANIZATION_ID</li>
            </ul>
            <div className="mt-4 flex space-x-2">
              <Button onClick={toggleDebug} variant="outline" size="sm">
                {showDebug ? 'Hide Debug Info' : 'Show Debug Info'}
              </Button>
              <Button onClick={handleReload} variant="secondary" size="sm">
                Reload Page
              </Button>
            </div>
            
            {showDebug && (
              <div className="mt-4 p-4 bg-gray-100 rounded text-sm">
                <h3 className="font-semibold">Current Config Values:</h3>
                <ul className="mt-2 space-y-1">
                  <li><strong>Client ID:</strong> {debugValues.clientId}</li>
                  <li><strong>Client Secret:</strong> {debugValues.clientSecret}</li>
                  <li><strong>Organization ID:</strong> {debugValues.organizationId}</li>
                  <li><strong>Redirect URL:</strong> {debugValues.redirectUrl}</li>
                </ul>
                <p className="mt-2 text-xs text-red-600">
                  Note: These values represent what the server can see. After updating .env.local, restart your development server.
                </p>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {isConfigured && !isConnected && (
        <Alert className="mb-6">
          <AlertTitle>Not Connected to Cal.com</AlertTitle>
          <AlertDescription>
            <p className="mb-4">You need to connect your Cal.com account to use this test page.</p>
            <Button onClick={handleConnect}>Connect Cal.com</Button>
          </AlertDescription>
        </Alert>
      )}

      {isConfigured && isConnected && (
        <Alert className="mb-6" variant="default">
          <AlertTitle>Connected to Cal.com</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>Your Cal.com account is connected and ready to use.</span>
            <Button variant="outline" size="sm" onClick={handleDisconnect}>
              Disconnect
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="local-availability">
        <TabsList className="mb-6">
          <TabsTrigger value="local-availability">Local Availability</TabsTrigger>
          <TabsTrigger value="cal-integration">Cal.com Integration</TabsTrigger>
          <TabsTrigger value="sync-status">Sync Status</TabsTrigger>
        </TabsList>
        
        <TabsContent value="local-availability">
          <Card>
            <CardHeader>
              <CardTitle>Coach Availability Management</CardTitle>
              <CardDescription>
                Test the local availability scheduling system before syncing with Cal.com
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isConfigured && isConnected ? (
                <CalAvailabilityTest />
              ) : (
                <Alert>
                  <AlertTitle>{isConfigured ? 'Connect Cal.com First' : 'Cal.com Not Configured'}</AlertTitle>
                  <AlertDescription>
                    {isConfigured 
                      ? 'Please connect your Cal.com account to test availability management.'
                      : 'Please add the required Cal.com environment variables to continue.'
                    }
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="cal-integration">
          <Card>
            <CardHeader>
              <CardTitle>Cal.com Integration</CardTitle>
              <CardDescription>
                Test syncing local availability with Cal.com
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isConfigured && isConnected ? (
                <CalAvailabilitySyncTest />
              ) : (
                <Alert>
                  <AlertTitle>{isConfigured ? 'Connect Cal.com First' : 'Cal.com Not Configured'}</AlertTitle>
                  <AlertDescription>
                    {isConfigured 
                      ? 'Please connect your Cal.com account to test integration.'
                      : 'Please add the required Cal.com environment variables to continue.'
                    }
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="sync-status">
          <Card>
            <CardHeader>
              <CardTitle>Sync Status</CardTitle>
              <CardDescription>
                Monitor the synchronization status between local and Cal.com calendars
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <AlertTitle>Coming Soon</AlertTitle>
                <AlertDescription>
                  Sync status monitoring will be implemented soon.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 