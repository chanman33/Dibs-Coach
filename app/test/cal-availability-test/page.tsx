'use client'

import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import CalAvailabilityTest from '../../../components/cal/CalAvailabilityTest'
import CalAvailabilitySyncTest from '../../../components/cal/CalAvailabilitySyncTest'

export default function CalAvailabilityTestPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Cal.com Availability Testing</h1>
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
              <CalAvailabilityTest />
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
              <CalAvailabilitySyncTest />
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