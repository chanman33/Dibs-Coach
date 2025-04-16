'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import CalAvailabilityTest from './CalAvailabilityTest'
import { fetchCalIntegrationStatus } from '@/utils/actions/cal/cal-integration-actions'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import CalManagedUserTest from './CalManagedUserTest'

// Loading skeleton component
const LoadingSkeleton = () => (
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

// Connection status alert component
const ConnectionAlert = ({ isConnected }: { isConnected: boolean }) => (
  isConnected ? (
    <Alert className="mb-6" variant="default">
      <AlertTitle>Connected to Cal.com</AlertTitle>
      <AlertDescription>
        <span>Your Cal.com account is connected and ready to use.</span>
      </AlertDescription>
    </Alert>
  ) : (
    <Alert className="mb-6">
      <AlertTitle>Not Connected to Cal.com</AlertTitle>
      <AlertDescription>
        <p className="mb-4">You need to connect your Cal.com account for full functionality.</p>
        <Button asChild>
          <Link href="/dashboard/settings?tab=integrations">Connect Cal.com</Link>
        </Button>
      </AlertDescription>
    </Alert>
  )
)

export default function CalAvailabilityPage() {
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Use the centralized Cal integration status check
  useEffect(() => {
    const checkIntegration = async () => {
      try {
        setIsLoading(true)
        const result = await fetchCalIntegrationStatus()
        
        // Set connection status based on the integration check
        setIsConnected(result.data?.isConnected || false)
      } catch (error) {
        console.error('Failed to check Cal.com integration status:', error)
        setIsConnected(false)
      } finally {
        setIsLoading(false)
      }
    }
    
    checkIntegration()
  }, [])

  if (isLoading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="space-y-6">
      <ConnectionAlert isConnected={isConnected} />

      <Tabs defaultValue="database-availability">
        <TabsList className="mb-6">
          <TabsTrigger value="database-availability">Database Availability</TabsTrigger>
          <TabsTrigger value="cal-availability">Cal.com Availability</TabsTrigger>
        </TabsList>
        
        <TabsContent value="database-availability">
          <Card>
            <CardHeader>
              <CardTitle>Database Availability Management</CardTitle>
              <CardDescription>
                Test creating, editing, and deleting availability schedules in our local database.
                These schedules are stored in our database, separate from Cal.com.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CalAvailabilityTest />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="cal-availability">
          <Card>
            <CardHeader>
              <CardTitle>Cal.com Schedules API</CardTitle>
              <CardDescription>
                Test the Cal.com regular user schedules API that manages both schedules and their availability.
                In Cal.com API v2, availability is a property within the schedule object.
                The API endpoints used are: GET/POST/DELETE /v2/schedules and GET /v2/schedules/default
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isConnected ? (
                <CalManagedUserTest />
              ) : (
                <Alert>
                  <AlertTitle>Connect Cal.com First</AlertTitle>
                  <AlertDescription>
                    Please connect your Cal.com account to test the schedules API functionality.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 