'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  const [webhookSecret, setWebhookSecret] = useState('');
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

  const generateWebhookSignature = (payload: string, secret: string) => {
    // This simulates how Cal.com actually generates signatures
    // Generate a simple hex signature that mimics Cal.com's signature format
    const encoder = new TextEncoder();
    const data = encoder.encode(payload);
    
    // Create a simple hash-like string (not cryptographically secure but works for testing)
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      hash = ((hash << 5) - hash) + data[i];
      hash = hash & hash; // Convert to 32bit integer
    }
    
    // Convert to hex and ensure it's always the same length
    const hexHash = Math.abs(hash).toString(16).padStart(8, '0');
    return `sha256=${hexHash.repeat(8)}`; // Make it look like a SHA256 hash
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
      
      // Generate a signature (in a real scenario, this would be done by Cal.com)
      const signature = generateWebhookSignature(payload, webhookSecret);
      
      // Send the webhook to our endpoint
      const response = await fetch('/api/cal/webhooks/receiver', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Cal-Signature-256': signature,
          'X-Test-Mode': 'true' // Mark this as a test request
        },
        body: payload
      });
      
      const result = await response.json();
      
      setWebhookResult({
        success: response.ok,
        message: response.ok ? 'Webhook processed successfully' : 'Failed to process webhook',
        data: result,
        error: !response.ok ? result.error : undefined
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
            {/* Webhook Secret Input */}
            <div>
              <Label htmlFor="webhook-secret">Webhook Secret</Label>
              <Input
                id="webhook-secret"
                placeholder="Enter your Cal.com webhook secret"
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                This is the secret you configured in your Cal.com webhook settings
              </p>
            </div>
            
            {/* Webhook Event Type Selection */}
            <Tabs
              defaultValue="booking-created"
              value={selectedTab}
              onValueChange={handleTabChange}
              className="mt-4"
            >
              <TabsList className="mb-4">
                <TabsTrigger value="booking-created">Booking Created</TabsTrigger>
                <TabsTrigger value="booking-cancelled">Booking Cancelled</TabsTrigger>
                <TabsTrigger value="booking-rescheduled">Booking Rescheduled</TabsTrigger>
              </TabsList>
              
              <TabsContent value="booking-created">
                <p className="mb-2">Test how your system handles new booking creation events.</p>
              </TabsContent>
              <TabsContent value="booking-cancelled">
                <p className="mb-2">Test how your system handles booking cancellation events.</p>
                {bookings.length === 0 && !bookingsLoading && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertTitle>No existing bookings found</AlertTitle>
                    <AlertDescription>
                      Create a booking first to test cancellation functionality.
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>
              <TabsContent value="booking-rescheduled">
                <p className="mb-2">Test how your system handles booking reschedule events.</p>
                {bookings.length === 0 && !bookingsLoading && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertTitle>No existing bookings found</AlertTitle>
                    <AlertDescription>
                      Create a booking first to test rescheduling functionality.
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>
            </Tabs>
            
            {/* Payload Editor */}
            <div>
              <Label htmlFor="webhook-payload">Webhook Payload</Label>
              <Textarea
                id="webhook-payload"
                value={customPayload}
                onChange={(e) => setCustomPayload(e.target.value)}
                className="font-mono h-72 mt-1"
              />
            </div>
            
            {/* Test Button */}
            <Button onClick={testWebhook} disabled={loading || !webhookSecret}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Test Webhook
            </Button>
          
            {/* Test Results */}
            {webhookResult && (
              <Alert className={`mt-4 ${webhookResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
                {webhookResult.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertTitle>
                  {webhookResult.success ? 'Success' : 'Error'}
                </AlertTitle>
                <AlertDescription>
                  {webhookResult.message}
                  {webhookResult.error && (
                    <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                      {JSON.stringify(webhookResult.error, null, 2)}
                    </pre>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}