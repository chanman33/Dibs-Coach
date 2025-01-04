"use client"

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export default function SubscriptionSettings() {
  return (
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
  )
} 