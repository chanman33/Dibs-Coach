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
import { CalendlyEventTypes } from '@/components/calendly/CalendlyEventTypes'
import { CoachingAvailabilityEditor } from '@/components/calendly/CoachingAvailabilityEditor'
import { ROLES, type UserRole, hasAnyRole } from "@/utils/roles/roles"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRouter } from "next/navigation"

export default function Settings() {
  const router = useRouter()
  const { user } = useUser()
  const [loading, setLoading] = useState(false)
  const [userRoles, setUserRoles] = useState<UserRole[]>([])
  const [loadingRoles, setLoadingRoles] = useState(true)

  useEffect(() => {
    async function fetchUserRoles() {
      if (user?.id) {
        try {
          const response = await fetch(`/api/user/role?userId=${user.id}`)
          const data = await response.json()
          setUserRoles(data.roles)
        } catch (error) {
          console.error("[ROLE_FETCH_ERROR]", error)
          setUserRoles([ROLES.MENTEE])
        }
        setLoadingRoles(false)
      }
    }

    fetchUserRoles()
  }, [user?.id])

  const isCoachOrAdmin = hasAnyRole(userRoles, [ROLES.COACH, ROLES.ADMIN])

  if (loadingRoles) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      <Tabs defaultValue="account" className="w-full">
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
          {isCoachOrAdmin && (
            <TabsTrigger 
              value="calendly"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Calendly
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

        {isCoachOrAdmin ? (
          <TabsContent value="calendly" className="space-y-4 mt-6">
            <Card className="p-6">
              <ConnectCalendly />
            </Card>

            <Tabs defaultValue="coaching-availability" className="w-full">
              <TabsList>
                <TabsTrigger value="coaching-availability">Coaching Availability</TabsTrigger>
                <TabsTrigger value="event-types">Event Types</TabsTrigger>
              </TabsList>

              <TabsContent value="coaching-availability" className="mt-6">
                <CoachingAvailabilityEditor 
                  onSave={() => router.refresh()}
                  onCancel={() => router.back()}
                />
              </TabsContent>

              <TabsContent value="event-types" className="mt-6">
                <CalendlyEventTypes />
              </TabsContent>
            </Tabs>
          </TabsContent>
        ) : (
          <TabsContent value="calendly" className="space-y-4 mt-6">
            <Alert>
              <AlertDescription>
                Calendly integration is only available for coaches. If you're interested in becoming a coach, please visit our coaching application page.
              </AlertDescription>
            </Alert>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
} 