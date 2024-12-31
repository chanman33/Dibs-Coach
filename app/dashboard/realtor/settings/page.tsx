'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConnectCalendly } from '@/components/ConnectCalendly'

export default function SettingsPage() {
  return (
    <div className="container max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>

      <div className="grid gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Calendar Integration</CardTitle>
          </CardHeader>
          <CardContent>
            <ConnectCalendly />
          </CardContent>
        </Card>

        {/* Add more settings sections here */}
      </div>
    </div>
  )
} 