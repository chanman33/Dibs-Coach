"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CreditCard, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import config from "@/config"

interface OrganizationBillingPanelProps {
  orgId: string
}

export function OrganizationBillingPanel({ orgId }: OrganizationBillingPanelProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Billing & Subscription
          </CardTitle>
          <CardDescription>
            Manage billing information and subscription details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Billing Not Available</AlertTitle>
            <AlertDescription>
              Billing functionality is not fully implemented yet. It's currently disabled in the system configuration (config.payments.enabled is set to {String(config.payments.enabled)}).
            </AlertDescription>
          </Alert>
          
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Current Plan</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="p-4 border rounded-md">
                <div className="text-sm text-muted-foreground">Subscription Tier</div>
                <div className="font-medium">Professional</div>
              </div>
              <div className="p-4 border rounded-md">
                <div className="text-sm text-muted-foreground">Billing Cycle</div>
                <div className="font-medium">Monthly</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 