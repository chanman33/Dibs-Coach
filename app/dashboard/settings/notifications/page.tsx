"use client"

import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useState } from 'react'

export default function NotificationsSettings() {
  const [loading, setLoading] = useState(false)

  return (
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
  )
} 