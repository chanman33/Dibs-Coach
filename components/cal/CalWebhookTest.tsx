'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/utils/hooks/useAuth';
import { useCalBookings } from '@/utils/hooks/useCalBookings';

interface TestResult {
  success: boolean;
  message: string;
  data?: any;
  error?: any;
}

export default function CalWebhookTest() {
  const [loading, setLoading] = useState(false);
  const [webhookResult, setWebhookResult] = useState<TestResult | null>(null);
  const [customPayload, setCustomPayload] = useState('');
  const [selectedTab, setSelectedTab] = useState('booking-created');
  const { isSignedIn, userUlid } = useAuth();
  const { bookings, isLoading: bookingsLoading } = useCalBookings({ includeHistory: true });

  // Template payloads for different webhook events
  const eventTemplates = {
    'booking-created': {
      triggerEvent: 'BOOKING_CREATED',
      createdAt: new Date().toISOString(),
      payload: {
        uid: `mock-booking-${Date.now()}`,
        title: 'Test Booking',
        eventTypeId: 123,
        startTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        endTime: new Date(Date.now() + 7200000).toISOString(), // 2 hours from now
        attendees: [
          {
            email: 'attendee@example.com',
            name: 'Test Attendee',
            timeZone: 'America/New_York',
            language: { locale: 'en' }
          }
        ],
        organizer: {
          id: 0, // Will be replaced with real ID
          name: 'Test Organizer',
          email: 'organizer@example.com',
          timeZone: 'America/New_York',
          language: { locale: 'en' }
        }
      }
    },
    'booking-cancelled': {
      triggerEvent: 'BOOKING_CANCELLED',
      createdAt: new Date().toISOString(),
      payload: {
        uid: '', // Will be filled from existing booking
        title: 'Cancelled Booking',
        eventTypeId: 123,
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(),
        attendees: [
          {
            email: 'attendee@example.com',
            name: 'Test Attendee',
            timeZone: 'America/New_York',
            language: { locale: 'en' }
          }
        ],
        organizer: {
          id: 0, // Will be replaced with real ID
          name: 'Test Organizer',
          email: 'organizer@example.com',
          timeZone: 'America/New_York',
          language: { locale: 'en' }
        },
        cancellationReason: 'Testing webhook cancellation'
      }
    },
    'booking-rescheduled': {
      triggerEvent: 'BOOKING_RESCHEDULED',
      createdAt: new Date().toISOString(),
      payload: {
        uid: '', // Will be filled from existing booking
        title: 'Rescheduled Booking',
        eventTypeId: 123,
        startTime: new Date(Date.now() + 86400000).toISOString(), // 1 day from now
        endTime: new Date(Date.now() + 90000000).toISOString(), // 1 day + 1 hour from now
        attendees: [
          {
            email: 'attendee@example.com',
            name: 'Test Attendee',
            timeZone: 'America/New_York',
            language: { locale: 'en' }
          }
        ],
        organizer: {
          id: 0, // Will be replaced with real ID
          name: 'Test Organizer',
          email: 'organizer@example.com',
          timeZone: 'America/New_York',
          language: { locale: 'en' }
        }
      }
    }
  };

  // Fetch user's calendar integration data
  const [calendarIntegration, setCalendarIntegration] = useState<any>(null);
  
  useEffect(() => {
    if (isSignedIn && userUlid) {
      fetchCalendarIntegration();
    }
  }, [isSignedIn, userUlid]);
  
  const fetchCalendarIntegration = async () => {
    try {
      const response = await fetch('/api/cal/test/get-integration');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.integration) {
          setCalendarIntegration(data.data.integration);
        }
      }
    } catch (error) {
      console.error('[FETCH_INTEGRATION_ERROR]', error);
    }
  };

  const preparePayload = (templateKey: string) => {
    const template = JSON.parse(JSON.stringify(eventTemplates[templateKey as keyof typeof eventTemplates]));
    
    // Set the organizer ID if we have managed user data
    if (calendarIntegration?.calManagedUserId) {
      template.payload.organizer.id = calendarIntegration.calManagedUserId;
    }
    
    // For cancelled or rescheduled events, use an existing booking ID if available
    if ((templateKey === 'booking-cancelled' || templateKey === 'booking-rescheduled') && bookings.length > 0) {
      template.payload.uid = bookings[0].calBookingUid;
    }
    
    return JSON.stringify(template, null, 2);
  };

  const handleTabChange = (value: string) => {
    setSelectedTab(value);
    setCustomPayload(preparePayload(value));
  };

  const testWebhook = async () => {
    setLoading(true);
    setWebhookResult(null);
    
    try {
      // Prepare the payload
      const payload = customPayload || preparePayload(selectedTab);
      
      // Send the webhook to our test endpoint that handles signature generation
      const response = await fetch('/api/cal/test/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: payload
      });
      
      const result = await response.json();
      
      setWebhookResult({
        success: response.ok && result.success,
        message: result.message || (response.ok ? 'Webhook processed successfully' : 'Failed to process webhook'),
        data: result.data,
        error: !response.ok || !result.success ? result.error : undefined
      });
    } catch (error) {
      setWebhookResult({
        success: false,
        message: 'Error sending webhook',
        error: error
      });
    } finally {
      setLoading(false);
    }
  };

  // Initialize custom payload when user data is loaded
  useEffect(() => {
    if (!customPayload && calendarIntegration) {
      setCustomPayload(preparePayload(selectedTab));
    }
  }, [calendarIntegration, selectedTab, customPayload]);

  return (
    <div className="space-y-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Cal.com Webhook Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <Alert>
              <AlertTitle>Test Mode</AlertTitle>
              <AlertDescription>
                This tool sends test webhook events to your webhook handler. 
                The webhook secret is securely stored in environment variables.
              </AlertDescription>
            </Alert>
            
            {/* Webhook Event Type Selection */}
            <Tabs
              defaultValue="booking-created"
              value={selectedTab}
              onValueChange={handleTabChange}
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="booking-created">Booking Created</TabsTrigger>
                <TabsTrigger value="booking-cancelled">Booking Cancelled</TabsTrigger>
                <TabsTrigger value="booking-rescheduled">Booking Rescheduled</TabsTrigger>
              </TabsList>
              
              <TabsContent value="booking-created">
                <p className="text-sm text-muted-foreground mb-4">
                  Test the booking created webhook event.
                </p>
              </TabsContent>
              
              <TabsContent value="booking-cancelled">
                <p className="text-sm text-muted-foreground mb-4">
                  Test the booking cancelled webhook event.
                  {bookings.length === 0 && " (No existing bookings found for cancellation test)"}
                </p>
              </TabsContent>
              
              <TabsContent value="booking-rescheduled">
                <p className="text-sm text-muted-foreground mb-4">
                  Test the booking rescheduled webhook event.
                  {bookings.length === 0 && " (No existing bookings found for rescheduling test)"}
                </p>
              </TabsContent>
            </Tabs>
            
            {/* Custom Payload Editor */}
            <div>
              <label htmlFor="payload" className="block text-sm font-medium mb-2">
                Webhook Payload
              </label>
              <div className="relative">
                <Textarea
                  id="payload"
                  rows={15}
                  value={customPayload}
                  onChange={(e) => setCustomPayload(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                You can edit the payload for more specific test scenarios
              </p>
            </div>
            
            {/* Test Webhook Button */}
            <div className="flex justify-end">
              <Button 
                onClick={testWebhook} 
                disabled={loading || !customPayload}
                className="flex items-center gap-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Test Webhook
              </Button>
            </div>
            
            {/* Test Result */}
            {webhookResult && (
              <div className="mt-6">
                <Alert variant={webhookResult.success ? "default" : "destructive"}>
                  <div className="flex items-center gap-2">
                    {webhookResult.success ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <XCircle className="h-5 w-5" />
                    )}
                    <AlertTitle>{webhookResult.message}</AlertTitle>
                  </div>
                  <AlertDescription>
                    <div className="mt-2">
                      <Textarea
                        readOnly
                        value={JSON.stringify(webhookResult.success ? webhookResult.data : webhookResult.error, null, 2)}
                        rows={5}
                        className="font-mono text-xs bg-muted"
                      />
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            )}
            
            {/* Integration Status */}
            {calendarIntegration ? (
              <Alert className="mt-6 bg-green-50">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <AlertTitle>Cal.com integration detected</AlertTitle>
                </div>
                <AlertDescription>
                  Your Cal.com account is connected to user ID {calendarIntegration.calManagedUserId}.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive" className="mt-6">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5" />
                  <AlertTitle>No Cal.com integration detected</AlertTitle>
                </div>
                <AlertDescription>
                  Please connect your Cal.com account first. Webhook events may not work properly.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}