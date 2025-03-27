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
import Link from 'next/link';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { format } from 'date-fns';
import { validateBookings, BookingValidationResult, CalBooking, DbBooking } from './validateBookings';
import { toast } from '@/components/ui/use-toast';

interface TestResult {
  type: 'success' | 'error';
  message: string;
  details?: string;
}

export interface CalendarIntegration {
  id: string;
  userUlid: string;
  calManagedUserId?: string;
  calAccessToken?: string;
  calAccessTokenExpiresAt?: string;
  calRefreshToken?: string;
}

export interface CalWebhookTestProps {
  initialIntegration?: CalendarIntegration;
  hasCompletedOnboarding?: boolean;
}

// Safe date formatting utility
const safeFormatDate = (dateStr: string | undefined | null): string => {
  if (!dateStr) return 'N/A';
  
  try {
    // First check if the string is a valid date format
    const timestamp = Date.parse(dateStr);
    if (isNaN(timestamp)) {
      return 'Invalid date';
    }
    
    const date = new Date(timestamp);
    // Double-check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    return format(date, 'PPp');
  } catch (e) {
    console.error('[DATE_FORMAT_ERROR]', e);
    return 'Invalid date';
  }
};

// Template payloads for different webhook events
const eventTemplates = {
  'booking-created': {
    triggerEvent: 'BOOKING_CREATED',
    createdAt: new Date().toISOString(),
    payload: {
      uid: `mock-booking-${Date.now()}`,
      title: 'Test Booking',
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
        id: 0,
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
      uid: '',
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
        id: 0,
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
      uid: '',
      title: 'Rescheduled Booking',
      eventTypeId: 123,
      startTime: new Date(Date.now() + 86400000).toISOString(),
      endTime: new Date(Date.now() + 90000000).toISOString(),
      attendees: [
        {
          email: 'attendee@example.com',
          name: 'Test Attendee',
          timeZone: 'America/New_York',
          language: { locale: 'en' }
        }
      ],
      organizer: {
        id: 0,
        name: 'Test Organizer',
        email: 'organizer@example.com',
        timeZone: 'America/New_York',
        language: { locale: 'en' }
      }
    }
  }
};

export default function CalWebhookTest({
  initialIntegration,
  hasCompletedOnboarding,
}: CalWebhookTestProps) {
  const [loading, setLoading] = useState(false);
  const [refreshingToken, setRefreshingToken] = useState(false);
  const [webhookResult, setWebhookResult] = useState<TestResult | null>(null);
  const [customPayload, setCustomPayload] = useState('');
  const [selectedTab, setSelectedTab] = useState('booking-created');
  const { isSignedIn, userUlid } = useAuth();
  const { bookings, isLoading: bookingsLoading } = useCalBookings({ includeHistory: true });
  const [validationResult, setValidationResult] = useState<BookingValidationResult>({
    isLoading: false,
    calBookings: [],
    mismatches: {
      calOnly: [],
      dbOnly: []
    },
    error: null
  });

  // Fetch user's calendar integration data
  const [calendarIntegration, setCalendarIntegration] = useState<CalendarIntegration | null>(null);
  
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
    const template = eventTemplates[templateKey as keyof typeof eventTemplates];
    if (!template) return '';
    
    const templateCopy = JSON.parse(JSON.stringify(template));
    
    // Set the organizer ID if we have managed user data
    if (calendarIntegration?.calManagedUserId) {
      templateCopy.payload.organizer.id = calendarIntegration.calManagedUserId;
    }
    
    // For cancelled or rescheduled events, use an existing booking ID if available
    if ((templateKey === 'booking-cancelled' || templateKey === 'booking-rescheduled') && bookings.length > 0) {
      templateCopy.payload.uid = bookings[0].calBookingUid;
    }
    
    return JSON.stringify(templateCopy, null, 2);
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
        type: response.ok && result.success ? 'success' : 'error',
        message: result.message || (response.ok ? 'Webhook processed successfully' : 'Failed to process webhook'),
        details: !response.ok || !result.success ? result.error : undefined
      });
    } catch (error) {
      setWebhookResult({
        type: 'error',
        message: 'Error sending webhook',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const validateBookingsHandler = async () => {
    setValidationResult({
      isLoading: true,
      calBookings: [],
      mismatches: {
        calOnly: [],
        dbOnly: []
      },
      error: null
    });
    
    try {
      console.log('[VALIDATE_BOOKINGS] Starting booking validation');
      
      // Fetch bookings from Cal.com API
      const calResponse = await fetch('/api/cal/test/fetch-bookings');
      
      console.log('[VALIDATE_BOOKINGS] API response received:', { 
        status: calResponse.status,
        ok: calResponse.ok 
      });
      
      // Handle non-OK responses immediately
      if (!calResponse.ok) {
        const errorData = await calResponse.json();
        
        // Handle token expiration
        if (calResponse.status === 498 && errorData.error === 'TOKEN_EXPIRED') {
          console.log('[VALIDATE_BOOKINGS] Token expired, attempting refresh...');
          
          // Attempt to refresh the token
          const refreshResponse = await fetch('/api/cal/refresh-token', {
            method: 'POST',
          });
          const refreshData = await refreshResponse.json();
          
          if (refreshData.success) {
            console.log('[VALIDATE_BOOKINGS] Token refreshed successfully, retrying validation...');
            // Retry the validation after successful token refresh
            return validateBookingsHandler();
          } else {
            throw new Error('Failed to refresh expired token. Please try refreshing manually.');
          }
        }
        
        throw new Error(errorData.error || `API returned status ${calResponse.status}`);
      }
      
      // Parse the response defensively
      let calData;
      try {
        calData = await calResponse.json();
        console.log('[VALIDATE_BOOKINGS] API response parsed:', { 
          success: calData?.success,
          hasData: !!calData?.data,
          hasError: !!calData?.error
        });
      } catch (parseError) {
        console.error('[BOOKING_VALIDATION_PARSE_ERROR]', parseError);
        throw new Error('Failed to parse API response');
      }
      
      // Handle API errors
      if (!calData || !calData.success) {
        const errorMessage = calData?.error || 'Unknown API error';
        console.error('[BOOKING_VALIDATION_API_ERROR]', { error: errorMessage });
        throw new Error(errorMessage);
      }
      
      // Validate response structure
      if (!calData.bookings || !Array.isArray(calData.bookings)) {
        console.error('[BOOKING_VALIDATION_DATA_ERROR]', 'Invalid bookings array in response');
        throw new Error('Invalid data structure in API response');
      }
      
      // Safely access and validate bookings arrays
      const calBookings = calData.bookings as CalBooking[];
      const dbBookings = (Array.isArray(bookings) ? bookings : []) as DbBooking[];
      
      // Update state with validation results
      const validationResult = validateBookings(calBookings, dbBookings);
      setValidationResult(validationResult);
      
    } catch (error) {
      console.error('[BOOKING_VALIDATION_ERROR]', error);
      setValidationResult({
        isLoading: false,
        calBookings: [],
        mismatches: {
          calOnly: [],
          dbOnly: []
        },
        error: error instanceof Error ? error.message : 'Failed to validate bookings'
      });
    }
  };

  const refreshToken = async () => {
    setRefreshingToken(true);
    try {
      const res = await fetch('/api/cal/refresh-token', {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: 'Success',
          description: 'Cal.com token refreshed successfully',
        });
      } else {
        throw new Error(data.error || 'Failed to refresh token');
      }
    } catch (error: any) {
      console.error('Error refreshing token:', error);
      toast({
        title: 'Error',
        variant: 'destructive',
        description: error.message || 'Failed to refresh Cal.com token',
      });
    } finally {
      setRefreshingToken(false);
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
            {/* Configuration Status */}
            {webhookResult?.details?.includes('CAL_WEBHOOK_SECRET') ? (
              <Alert variant="destructive">
                <AlertTitle>Missing Webhook Configuration</AlertTitle>
                <AlertDescription className="space-y-2">
                  <p>The webhook secret is not configured. To set it up:</p>
                  <ol className="list-decimal ml-4 space-y-1">
                    <li>Go to your Cal.com dashboard</li>
                    <li>Navigate to Developer Settings → Webhooks</li>
                    <li>Create a new webhook or view an existing one</li>
                    <li>Copy the signing secret</li>
                    <li>Add it to your <code>.env</code> file as <code>CAL_WEBHOOK_SECRET=your_secret</code></li>
                    <li>Restart your development server</li>
                  </ol>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <AlertTitle>Test Mode</AlertTitle>
                <AlertDescription>
                  This tool sends test webhook events to your webhook handler. 
                  The webhook secret is securely stored in environment variables.
                </AlertDescription>
              </Alert>
            )}
            
            {/* Integration Status - Only show if not connected */}
            {!calendarIntegration && (
              <Alert variant="destructive">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5" />
                  <AlertTitle>No Cal.com integration detected</AlertTitle>
                </div>
                <AlertDescription className="space-y-2">
                  <p>Please connect your Cal.com account first. Webhook events require a Cal.com connection.</p>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/dashboard/settings?tab=integrations">
                      Go to Integration Settings
                    </Link>
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            
            {/* Only show webhook testing UI if integration exists */}
            {calendarIntegration && (
              <>
                <Tabs
                  defaultValue="booking-created"
                  value={selectedTab}
                  onValueChange={handleTabChange}
                >
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="booking-created">Booking Created</TabsTrigger>
                    <TabsTrigger value="booking-cancelled">Booking Cancelled</TabsTrigger>
                    <TabsTrigger value="booking-rescheduled">Booking Rescheduled</TabsTrigger>
                    <TabsTrigger value="fetch-bookings">Fetch Bookings</TabsTrigger>
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
                  
                  <TabsContent value="fetch-bookings">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          Fetch and validate bookings between Cal.com and database.
                        </p>
                        <div className="flex gap-2">
                          <Button 
                            onClick={refreshToken} 
                            disabled={refreshingToken || !calendarIntegration}
                            variant="outline"
                            className="flex items-center gap-2"
                          >
                            {refreshingToken && <Loader2 className="h-4 w-4 animate-spin" />}
                            Refresh Cal.com Token
                          </Button>
                          <Button 
                            onClick={validateBookingsHandler}
                            disabled={validationResult.isLoading || refreshingToken}
                            className="flex items-center gap-2"
                          >
                            {validationResult.isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                            Validate Bookings
                          </Button>
                        </div>
                      </div>
                      
                      {validationResult.error && (
                        <Alert variant="destructive">
                          <AlertTitle>Validation Error</AlertTitle>
                          <AlertDescription>
                            {validationResult.error.includes('Failed to refresh expired token') ? (
                              <div className="space-y-2">
                                <p>Your Cal.com access token has expired and automatic refresh failed.</p>
                                <p className="text-sm">Please try:</p>
                                <ol className="list-decimal pl-5 text-sm space-y-1">
                                  <li>Click the "Refresh Cal.com Token" button above</li>
                                  <li>If that doesn't work, try reconnecting your Cal.com account in settings</li>
                                  <li>If problems persist, please contact support</li>
                                </ol>
                              </div>
                            ) : (
                              validationResult.error
                            )}
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      {!validationResult.isLoading && validationResult.calBookings && validationResult.calBookings.length === 0 && (
                        <Alert>
                          <AlertTitle>No Bookings Found</AlertTitle>
                          <AlertDescription className="space-y-2">
                            <p>No bookings were found in your Cal.com account.</p>
                            <p className="text-sm">This can happen if:</p>
                            <ul className="list-disc pl-5 text-sm space-y-1">
                              <li>You haven't created any bookings yet in your Cal.com account</li>
                              <li>All your bookings have been cancelled or archived</li>
                              <li>There are API permission issues with your Cal.com connection</li>
                            </ul>
                            <p className="mt-2 text-sm">Try creating a test booking:</p>
                            <ol className="list-decimal pl-5 text-sm space-y-1">
                              <li>Go to the "Booking Created" tab</li>
                              <li>Click "Test Webhook" to simulate a new booking</li>
                              <li>Return to this tab and click "Validate Bookings" again</li>
                              <li>You should see one booking in your database but not in Cal.com</li>
                            </ol>
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      {!validationResult.isLoading && validationResult.calBookings && validationResult.calBookings.length > 0 && (
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-sm font-medium mb-2">Cal.com Bookings</h3>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>UID</TableHead>
                                  <TableHead>Title</TableHead>
                                  <TableHead>Start Time</TableHead>
                                  <TableHead>Status</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {validationResult.calBookings.map((booking: any, index: number) => {
                                  // Create a stable key for React
                                  const rowKey = booking?.uid ? `booking-${booking.uid}` : `booking-index-${index}`;
                                  
                                  return (
                                    <TableRow key={rowKey}>
                                      <TableCell className="font-mono text-xs">{booking?.uid || 'N/A'}</TableCell>
                                      <TableCell>{booking?.title || 'Untitled'}</TableCell>
                                      <TableCell>{safeFormatDate(booking?.startTime || booking?.start)}</TableCell>
                                      <TableCell>{booking?.status || 'Unknown'}</TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                          
                          {validationResult.mismatches && (validationResult.mismatches.calOnly.length > 0 || validationResult.mismatches.dbOnly.length > 0) && (
                            <Alert variant="destructive">
                              <AlertTitle>Data Inconsistencies Found</AlertTitle>
                              <AlertDescription>
                                <div className="mt-2 space-y-2">
                                  {validationResult.mismatches.calOnly.map((booking, index) => (
                                    <div key={`cal-only-${booking.uid}-${index}`} className="text-sm">
                                      Booking <code className="text-xs">{booking.uid}</code> exists in Cal.com but not in database
                                    </div>
                                  ))}
                                  {validationResult.mismatches.dbOnly.map((booking, index) => (
                                    <div key={`db-only-${booking.calBookingUid}-${index}`} className="text-sm">
                                      Booking <code className="text-xs">{booking.calBookingUid}</code> exists in database but not in Cal.com
                                    </div>
                                  ))}
                                </div>
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
                
                {/* Show payload editor and test button only for webhook test tabs */}
                {selectedTab !== 'fetch-bookings' && (
                  <>
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
                        <Alert variant={webhookResult.type === 'success' ? "default" : "destructive"}>
                          <div className="flex items-center gap-2">
                            {webhookResult.type === 'success' ? (
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
                                value={webhookResult.details || 'No additional details available'}
                                rows={5}
                                className="font-mono text-xs bg-muted"
                              />
                            </div>
                          </AlertDescription>
                        </Alert>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}