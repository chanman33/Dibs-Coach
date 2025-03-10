"use client"

import config from '@/config'
import { UserProfile } from '@clerk/nextjs'
import { useUser } from '@clerk/nextjs'
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { useState, useEffect } from 'react'
import { ConnectCalendly } from '@/components/calendly/ConnectCalendly'
import { USER_CAPABILITIES } from "@/utils/roles/roles"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import { fetchUserCapabilities } from "@/utils/actions/user-actions"
import { useCalendlyConnection } from '@/utils/hooks/useCalendly'
import { Calendar, ExternalLink, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { toast } from 'react-hot-toast'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import Link from 'next/link'

export default function Settings() {
  const router = useRouter()
  const { user } = useUser()
  const [loading, setLoading] = useState(false)
  const [userCapabilities, setUserCapabilities] = useState<string[]>([])
  const [loadingCapabilities, setLoadingCapabilities] = useState(true)
  const { 
    status: calendlyStatus, 
    isLoading: isCalendlyLoading, 
    isConnecting,
    handleConnect,
    refreshStatus: refreshCalendlyStatus 
  } = useCalendlyConnection(`${typeof window !== 'undefined' ? window.location.origin : ''}/dashboard/settings?tab=calendly&calendly=success`)
  const isCoach = userCapabilities.includes('COACH')
  const [activeTab, setActiveTab] = useState("account")
  const [isDisconnecting, setIsDisconnecting] = useState(false)

  // Debug state changes
  useEffect(() => {
    console.log('[SETTINGS_PAGE_DEBUG] Calendly status changed:', {
      status: calendlyStatus,
      isLoading: isCalendlyLoading,
      isConnecting,
      isDisconnecting,
      timestamp: new Date().toISOString()
    })
  }, [calendlyStatus, isCalendlyLoading, isConnecting, isDisconnecting])

  // Set the active tab based on the URL parameter
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      const tab = url.searchParams.get('tab')
      console.log('[SETTINGS_PAGE_DEBUG] URL change detected:', {
        tab,
        currentTab: activeTab,
        success: url.searchParams.get('success'),
        error: url.searchParams.get('error'),
        timestamp: new Date().toISOString()
      })

      if (tab && ['account', 'notifications', 'subscription', 'calendly'].includes(tab)) {
        setActiveTab(tab)
      }
      
      // Check for success or error messages in URL
      const success = url.searchParams.get('success')
      const error = url.searchParams.get('error')

      if (success) {
        console.log('[SETTINGS_PAGE_DEBUG] Processing success:', {
          success,
          currentStatus: calendlyStatus,
          timestamp: new Date().toISOString()
        })
        
        // Only show success message and refresh if we don't already have a connection
        if (!calendlyStatus?.connected) {
          toast.success('Calendly connected successfully!')
          refreshCalendlyStatus()
        }
        
        // Remove the query parameter to avoid showing the message again on refresh
        url.searchParams.delete('success')
        window.history.replaceState({}, '', url.toString())
      } else if (error) {
        console.error('[SETTINGS_PAGE_DEBUG] Processing error:', {
          error,
          currentStatus: calendlyStatus,
          timestamp: new Date().toISOString()
        })
        toast.error(`Error: ${error}`)
        // Remove the query parameter to avoid showing the message again on refresh
        url.searchParams.delete('error')
        window.history.replaceState({}, '', url.toString())
      }
    }
  }, [calendlyStatus?.connected]) // Only re-run when connection status changes

  useEffect(() => {
    async function loadUserCapabilities() {
      if (user?.id) {
        console.log('[SETTINGS_PAGE_DEBUG] Loading capabilities:', {
          userId: user.id,
          timestamp: new Date().toISOString()
        })
        try {
          const result = await fetchUserCapabilities()
          
          if (result.error) {
            throw result.error
          }

          if (result.data) {
            console.log('[SETTINGS_PAGE_DEBUG] Capabilities loaded:', {
              capabilities: result.data.capabilities,
              timestamp: new Date().toISOString()
            })
            setUserCapabilities(result.data.capabilities)
          }
        } catch (error) {
          console.error("[SETTINGS_PAGE_DEBUG] Capabilities fetch error:", {
            error,
            timestamp: new Date().toISOString()
          })
          setUserCapabilities([])
        }
        setLoadingCapabilities(false)
      }
    }

    loadUserCapabilities()
  }, [user?.id])

  const handleDisconnectCalendly = async () => {
    try {
      console.log('[SETTINGS_PAGE_DEBUG] Starting disconnect:', {
        currentStatus: calendlyStatus,
        timestamp: new Date().toISOString()
      })
      setIsDisconnecting(true)
      const response = await fetch('/api/calendly/disconnect', {
        method: 'POST',
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('[SETTINGS_PAGE_DEBUG] Disconnect failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          timestamp: new Date().toISOString()
        })
        throw new Error('Failed to disconnect Calendly')
      }
      
      console.log('[SETTINGS_PAGE_DEBUG] Disconnect successful')
      toast.success('Calendly disconnected successfully')
      refreshCalendlyStatus()
    } catch (error) {
      console.error('[SETTINGS_PAGE_DEBUG] Disconnect error:', {
        error,
        timestamp: new Date().toISOString()
      })
      toast.error('Failed to disconnect Calendly')
    } finally {
      setIsDisconnecting(false)
    }
  }

  // Debug render
  console.log('[SETTINGS_PAGE_DEBUG] Rendering:', {
    isCoach,
    activeTab,
    loadingCapabilities,
    calendlyStatus,
    timestamp: new Date().toISOString()
  })

  if (loadingCapabilities) {
    console.log('[SETTINGS_PAGE_DEBUG] Loading capabilities')
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0">
          <TabsTrigger
            value="account"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            Account
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            Notifications
          </TabsTrigger>
          <TabsTrigger
            value="subscription"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            Subscription
          </TabsTrigger>
          {isCoach && (
            <TabsTrigger
              value="calendly"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent flex items-center gap-2"
            >
              Calendly
              {!isCalendlyLoading && calendlyStatus?.connected && !calendlyStatus?.needsReconnect && (
                <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
                  <Calendar className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="account" className="space-y-4 mt-6">
          {config?.auth?.enabled && (
            <Card className="p-0 border-none">
              <UserProfile
                appearance={{
                  elements: {
                    card: "!border !border-solid !border-border bg-background text-foreground rounded-lg shadow-none",
                    navbar: "!border-b !border-solid !border-border",
                    rootBox: "[&_*]:!shadow-none [&>div]:bg-background [&>div]:!border [&>div]:!border-solid [&>div]:!border-border [&_.cl-card]:!border [&_.cl-card]:!border-solid [&_.cl-card]:!border-border",
                    pageScrollBox: "bg-background [&>div]:bg-background"
                  },
                  variables: {
                    borderRadius: "0.75rem"
                  }
                }}
              />
            </Card>
          )}
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose what notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <div className="flex flex-col space-y-1">
                  <label htmlFor="email-notifications" className="font-medium">Email Notifications</label>
                  <p className="text-sm text-muted-foreground">Receive email updates about your account activity</p>
                </div>
                <Switch id="email-notifications" />
              </div>
              <Separator />
              <div className="flex items-center justify-between space-x-2">
                <div className="flex flex-col space-y-1">
                  <label htmlFor="marketing-emails" className="font-medium">Marketing Emails</label>
                  <p className="text-sm text-muted-foreground">Receive emails about new features and updates</p>
                </div>
                <Switch id="marketing-emails" />
              </div>
              <Separator />
              <div className="flex items-center justify-between space-x-2">
                <div className="flex flex-col space-y-1">
                  <label htmlFor="reminder-notifications" className="font-medium">Session Reminders</label>
                  <p className="text-sm text-muted-foreground">Get notified about upcoming sessions and events</p>
                </div>
                <Switch id="reminder-notifications" />
              </div>
              <Button disabled={loading} className="mt-4">
                {loading ? "Saving..." : "Save Preferences"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Details</CardTitle>
              <CardDescription>
                Manage your subscription and billing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <div>
                  <h3 className="font-medium">Current Plan</h3>
                  <p className="text-sm text-muted-foreground">Free Tier</p>
                </div>
                <Button variant="outline">Upgrade Plan</Button>
              </div>
              <Separator />
              <div>
                <h3 className="font-medium mb-2">Billing History</h3>
                <p className="text-sm text-muted-foreground">No billing history available</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {isCoach ? (
          <TabsContent value="calendly" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Calendly Integration</CardTitle>
                <CardDescription>Connect your Calendly account to manage your coaching sessions</CardDescription>
              </CardHeader>
              <CardContent>
                {isCalendlyLoading ? (
                  <div className="flex items-center space-x-2">
                    <LoadingSpinner size="sm" />
                    <span>Loading Calendly status...</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center space-x-2 mb-4">
                      <span>Status:</span>
                      {calendlyStatus?.connected ? (
                        <Badge className="bg-green-500">Connected</Badge>
                      ) : calendlyStatus?.needsReconnect ? (
                        <Badge variant="destructive">Connection Error</Badge>
                      ) : (
                        <Badge variant="secondary">Not Connected</Badge>
                      )}
                    </div>

                    {calendlyStatus?.connected ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDisconnectCalendly}
                        disabled={isDisconnecting}
                      >
                        {isDisconnecting ? (
                          <>
                            <LoadingSpinner size="sm" className="mr-2" />
                            Disconnecting...
                          </>
                        ) : (
                          'Disconnect'
                        )}
                      </Button>
                    ) : calendlyStatus?.needsReconnect ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleConnect}
                        disabled={isConnecting}
                      >
                        {isConnecting ? (
                          <>
                            <LoadingSpinner size="sm" className="mr-2" />
                            Reconnecting...
                          </>
                        ) : (
                          'Reconnect'
                        )}
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleConnect}
                        disabled={isConnecting}
                      >
                        {isConnecting ? (
                          <>
                            <LoadingSpinner size="sm" className="mr-2" />
                            Connecting...
                          </>
                        ) : (
                          'Connect'
                        )}
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ) : (
          <TabsContent value="calendly" className="space-y-4 mt-6">
            <Alert>
              <AlertTitle>Calendly Integration</AlertTitle>
              <AlertDescription>
                Calendly integration is only available for coaches. If you&apos;re interested in becoming a coach,{' '}
                <Link href="/dashboard/coaching/apply" className="underline">
                  visit our coaching application page
                </Link>
                .
              </AlertDescription>
            </Alert>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
} 