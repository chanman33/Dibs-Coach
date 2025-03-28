'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

export interface CalendarIntegration {
  id: string;
  userUlid: string;
  calManagedUserId: number;
  calAccessToken: string;
  calAccessTokenExpiresAt: string;
  calRefreshToken: string;
}

export interface CalWebhookTestProps {
  initialIntegration?: CalendarIntegration;
  hasCompletedOnboarding?: boolean;
}

// Safe date formatting utility
const safeFormatDate = (dateStr: string | undefined | null): string => {
  if (!dateStr) return 'N/A';
  
  try {
    const timestamp = Date.parse(dateStr);
    if (isNaN(timestamp)) return 'Invalid date';
    
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    return format(date, 'PPp');
  } catch (e) {
    console.error('[DATE_FORMAT_ERROR]', e);
    return 'Invalid date';
  }
};

export default function CalWebhookTest({ initialIntegration }: CalWebhookTestProps) {
  const [loading, setLoading] = useState(false);
  const [refreshingToken, setRefreshingToken] = useState(false);
  const [actionResult, setActionResult] = useState<{ type: 'success' | 'error', message: string, details?: string } | null>(null);
  const [eventTypes, setEventTypes] = useState<any[]>([]);
  const [selectedEventTypeId, setSelectedEventTypeId] = useState<number | null>(null);
  const [fetchingEventTypes, setFetchingEventTypes] = useState(false);
  const { isSignedIn, userUlid } = useAuth();
  const { bookings, isLoading: bookingsLoading, refetch } = useCalBookings({ includeHistory: true });
  const refreshBookings = () => {
    refetch();
  };
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
  const [calendarIntegration, setCalendarIntegration] = useState<CalendarIntegration | null>(
    initialIntegration || null
  );
  
  const [lastTokenRefresh, setLastTokenRefresh] = useState<number>(0);
  const REFRESH_COOLDOWN = 10000; // 10 seconds cooldown
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Add this near the top of the component after other state variables
  const [debugLoading, setDebugLoading] = useState(false);
  
  useEffect(() => {
    if (isSignedIn && userUlid && !calendarIntegration) {
      fetchCalendarIntegration();
    }

    // Use a delayed load for any secondary actions
    if (isSignedIn && userUlid && isInitialLoad) {
      // Set a timeout to fetch event types only after initial integration data is loaded
      const timer = setTimeout(() => {
        setIsInitialLoad(false);
        if (calendarIntegration) {
          // Only fetch event types if we haven't already and we have valid integration data
          if (eventTypes.length === 0 && !fetchingEventTypes) {
            // Check if token is likely valid before attempting fetch
            const tokenExpiryDate = calendarIntegration.calAccessTokenExpiresAt ? 
              new Date(calendarIntegration.calAccessTokenExpiresAt) : null;
            
            const isExpired = tokenExpiryDate ? new Date() > tokenExpiryDate : false;
            
            if (isExpired) {
              // Instead of automatically refreshing, show a message to the user
              setActionResult({
                type: 'error',
                message: 'Access token appears to be expired',
                details: 'Please click the "Refresh Cal.com Token" button below to refresh your access token before fetching event types.'
              });
            } else {
              fetchEventTypes();
            }
          }
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isSignedIn, userUlid, calendarIntegration, isInitialLoad, eventTypes.length, fetchingEventTypes]);
  
  const fetchCalendarIntegration = async () => {
    try {
      const response = await fetch('/api/cal/test/get-integration', {
        cache: 'no-store'
      });
      
      if (!response.ok) {
        if (response.status === 502) {
          throw new Error('Backend service is unavailable. Please try again later.');
        }
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch integration');
      }
      
      const data = await response.json();
      console.log('[DEBUG] Integration Response:', data);
      
      if (data.success && data.data?.integration) {
        console.log('[DEBUG] Setting integration:', data.data.integration);
        setCalendarIntegration(data.data.integration);
      } else {
        console.log('[DEBUG] No integration data found:', data);
      }
    } catch (error) {
      console.error('[FETCH_INTEGRATION_ERROR]', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch integration',
        variant: 'destructive'
      });
    }
  };

  const fetchEventTypes = async () => {
    // Prevent duplicate calls
    if (fetchingEventTypes) {
      return;
    }
    
    try {
      console.log('[DEBUG] Current integration state:', {
        ...calendarIntegration,
        calAccessToken: calendarIntegration?.calAccessToken ? '***' : null
      });
      setFetchingEventTypes(true);
      
      if (!calendarIntegration?.calAccessToken || !calendarIntegration?.calManagedUserId) {
        console.error('[FETCH_EVENT_TYPES_ERROR] Missing required integration data', {
          hasAccessToken: !!calendarIntegration?.calAccessToken,
          hasManagedUserId: !!calendarIntegration?.calManagedUserId,
          integration: {
            ...calendarIntegration,
            calAccessToken: calendarIntegration?.calAccessToken ? '***' : null
          }
        });
        setActionResult({
          type: 'error',
          message: 'Missing integration data',
          details: 'The Cal.com integration is missing required data. Please check your integration settings.'
        });
        return;
      }
      
      // Check token expiration before making the request
      const tokenExpiryDate = calendarIntegration.calAccessTokenExpiresAt ? 
        new Date(calendarIntegration.calAccessTokenExpiresAt) : null;
      
      const isExpired = tokenExpiryDate ? new Date() > tokenExpiryDate : false;
      
      if (isExpired) {
        setActionResult({
          type: 'error',
          message: 'Access token is expired',
          details: 'Please click the "Refresh Cal.com Token" button to refresh your access token.'
        });
        return;
      }
      
      console.log('[DEBUG] Fetching event types for managed user:', calendarIntegration.calManagedUserId);
      
      const tokenResponse = await fetch(`/api/cal/test/event-types`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('[DEBUG] Event types response status:', tokenResponse.status);
      
      if (tokenResponse.ok) {
        const data = await tokenResponse.json();
        console.log('[DEBUG] Event types response data:', data);
        
        if (data.success && data.eventTypes) {
          // Extract event types from the nested structure
          const eventTypeGroups = data.eventTypes.eventTypeGroups || [];
          console.log('[DEBUG] Event type groups:', eventTypeGroups);
          
          // Collect all event types and deduplicate by ID
          const eventTypeMap = new Map();
          eventTypeGroups.forEach((group: any) => {
            if (group.eventTypes && Array.isArray(group.eventTypes)) {
              group.eventTypes.forEach((et: any) => {
                // Only add if we don't already have this ID or if this is a more recent version
                if (!eventTypeMap.has(et.id) || et.updatedAt > eventTypeMap.get(et.id).updatedAt) {
                  eventTypeMap.set(et.id, et);
                }
              });
            }
          });
          
          // Convert map back to array
          const allEventTypes = Array.from(eventTypeMap.values());
          
          console.log('[DEBUG] Extracted event types:', {
            total: allEventTypes.length,
            types: allEventTypes.map(et => ({
              id: et.id,
              title: et.title,
              length: et.length,
              slug: et.slug
            }))
          });
          
          setEventTypes(allEventTypes);
          if (allEventTypes.length > 0) {
            setSelectedEventTypeId(allEventTypes[0].id);
            toast({
              title: "Event types loaded",
              description: `Loaded ${allEventTypes.length} unique event types successfully.`,
              variant: "default"
            });
          } else {
            setActionResult({
              type: 'error',
              message: 'No event types found',
              details: 'No event types are available for this Cal.com user. Please create at least one event type in your Cal.com account.'
            });
          }
        } else {
          throw new Error(data.error || 'Invalid response format from event types API');
        }
      } else {
        let errorMessage = `Failed to fetch event types: ${tokenResponse.statusText}`;
        let errorDetails = '';
        
        try {
          const errorData = await tokenResponse.json();
          console.error('[FETCH_EVENT_TYPES_ERROR] Error response:', errorData);
          errorMessage = errorData.error || errorMessage;
          errorDetails = errorData.details || '';
        } catch (e) {
          console.error('[FETCH_EVENT_TYPES_ERROR] Error parsing response:', e);
        }
        
        if (tokenResponse.status === 401) {
          setActionResult({
            type: 'error',
            message: 'Authentication error with Cal.com',
            details: errorDetails || 'Your Cal.com access token appears to be invalid. Please try refreshing your token or reconnecting your Cal.com account.'
          });
        } else {
          throw new Error(errorMessage);
        }
      }
    } catch (error) {
      console.error('[FETCH_EVENT_TYPES_ERROR]', error);
      setActionResult({
        type: 'error',
        message: 'Error fetching event types',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setFetchingEventTypes(false);
    }
  };

  const createBooking = async () => {
    try {
      setLoading(true);
      setActionResult(null);
      
      // If no event types loaded yet, fetch them first
      if (eventTypes.length === 0) {
        toast({
          title: "Fetching event types",
          description: "Loading your Cal.com event types...",
          variant: "default"
        });
        
        await fetchEventTypes();
        
        // If still no event types after fetching, offer to go to Cal.com
        if (eventTypes.length === 0) {
          setActionResult({
            type: 'error',
            message: 'No event types available',
            details: 'You need at least one event type in your Cal.com account to create a booking. Please create an event type in your Cal.com account first.'
          });
          return;
        }
      }
      
      if (!selectedEventTypeId) {
        // If we have event types but none selected, select the first one
        if (eventTypes.length > 0) {
          setSelectedEventTypeId(eventTypes[0].id);
        } else {
          throw new Error('Please select an event type');
        }
      }
      
      // Verify the event type exists in our list
      const selectedEventType = eventTypes.find(et => et.id === selectedEventTypeId);
      if (!selectedEventType) {
        throw new Error(`Selected event type (${selectedEventTypeId}) not found in available event types. Please refresh and try again.`);
      }

      // Log event type details for debugging
      console.log('[SELECTED_EVENT_TYPE]', {
        id: selectedEventType.id,
        title: selectedEventType.title,
        length: selectedEventType.length
      });
      
      const createBookingResponse = await fetch('/api/cal/test/create-booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          eventTypeId: selectedEventType.id,
          startTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
          endTime: new Date(Date.now() + (3600000 + selectedEventType.length * 60000)).toISOString(), // 1 hour from now + event length
          attendeeEmail: 'test-attendee@example.com',
          attendeeName: 'Test Attendee'
        })
      });
      
      if (!createBookingResponse.ok) {
        const errorData = await createBookingResponse.json();
        console.error('[CREATE_BOOKING_ERROR_DETAILS]', {
          status: createBookingResponse.status,
          statusText: createBookingResponse.statusText,
          errorData
        });
        
        // Extract more detailed error information if available
        let errorMessage = 'Failed to create booking';
        if (errorData.details && errorData.details.error) {
          // Cal.com API provides detailed error messages in this format
          errorMessage += ': ' + (errorData.details.error.message || 'Unknown error');
          
          // Log details for debugging
          console.error('[CAL_API_ERROR_DETAILS]', errorData.details.error);

          // If it's a 404, suggest refreshing event types
          if (errorData.details.error.statusCode === 404) {
            errorMessage += '. The event type may no longer exist. Please refresh event types and try again.';
          }
        } else if (errorData.error) {
          errorMessage += ': ' + errorData.error;
        }
        
        throw new Error(errorMessage);
      }
      
      const bookingData = await createBookingResponse.json();
      
      setActionResult({
        type: 'success',
        message: 'Booking Created Successfully',
        details: JSON.stringify(bookingData.booking, null, 2)
      });
      
      // Refresh bookings list
      refreshBookings();
      
    } catch (error) {
      console.error('[CREATE_BOOKING_ERROR]', error);
      setActionResult({
        type: 'error',
        message: 'Error creating booking',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const cancelLatestBooking = async () => {
    try {
      setLoading(true);
      setActionResult(null);
      
      if (!bookings || bookings.length === 0) {
        throw new Error('No bookings found to cancel. Please create a booking first.');
      }
      
      const latestBooking = bookings[0];
      
      if (!latestBooking.calBookingUid) {
        throw new Error('The latest booking does not have a Cal.com booking ID.');
      }
      
      const cancelResponse = await fetch('/api/cal/test/cancel-booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bookingUid: latestBooking.calBookingUid,
          reason: 'Cancelled via testing interface'
        })
      });
      
      if (!cancelResponse.ok) {
        const errorData = await cancelResponse.json();
        throw new Error(`Failed to cancel booking: ${errorData.error || 'Unknown error'}`);
      }
      
      const cancelResult = await cancelResponse.json();
      
      setActionResult({
        type: 'success',
        message: 'Booking cancelled successfully',
        details: JSON.stringify({
          booking: {
            calBookingUid: latestBooking.calBookingUid,
            title: latestBooking.title || 'Unknown booking'
          },
          cancellationResponse: cancelResult
        }, null, 2)
      });
      
      // Refresh bookings list
      refreshBookings();
      
    } catch (error) {
      console.error('[CANCEL_BOOKING_ERROR]', error);
      setActionResult({
        type: 'error',
        message: 'Error cancelling booking',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const rescheduleBooking = async () => {
    try {
      setLoading(true);
      setActionResult(null);
      
      if (!bookings || bookings.length === 0) {
        throw new Error('No bookings found to reschedule. Please create a booking first.');
      }
      
      const latestBooking = bookings[0];
      
      if (!latestBooking.calBookingUid) {
        throw new Error('The latest booking does not have a Cal.com booking ID.');
      }
      
      const newStartTime = new Date(Date.now() + 86400000).toISOString(); // 24 hours later
      const newEndTime = new Date(Date.now() + 90000000).toISOString();   // 25 hours later
      
      const rescheduleResponse = await fetch('/api/cal/test/reschedule-booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bookingUid: latestBooking.calBookingUid,
          startTime: newStartTime,
          endTime: newEndTime,
          reason: 'Rescheduled via testing interface'
        })
      });
      
      if (!rescheduleResponse.ok) {
        const errorData = await rescheduleResponse.json();
        throw new Error(`Failed to reschedule booking: ${errorData.error || 'Unknown error'}`);
      }
      
      const rescheduleResult = await rescheduleResponse.json();
      
      setActionResult({
        type: 'success',
        message: 'Booking rescheduled successfully',
        details: JSON.stringify({
          booking: {
            calBookingUid: latestBooking.calBookingUid,
            title: latestBooking.title || 'Unknown booking'
          },
          newStartTime,
          newEndTime,
          rescheduleResponse: rescheduleResult
        }, null, 2)
      });
      
      // Refresh bookings list
      refreshBookings();
      
    } catch (error) {
      console.error('[RESCHEDULE_BOOKING_ERROR]', error);
      setActionResult({
        type: 'error',
        message: 'Error rescheduling booking',
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
      const calResponse = await fetch('/api/cal/test/fetch-bookings');
      
      if (!calResponse.ok) {
        const errorData = await calResponse.json();
        
        if (calResponse.status === 498 && errorData.error === 'TOKEN_EXPIRED') {
          const refreshResponse = await fetch('/api/cal/refresh-token', {
            method: 'POST',
          });
          const refreshData = await refreshResponse.json();
          
          if (refreshData.success) {
            return validateBookingsHandler();
          } else {
            throw new Error('Failed to refresh expired token. Please try refreshing manually.');
          }
        }
        
        throw new Error(errorData.error || `API returned status ${calResponse.status}`);
      }
      
      let calData;
      try {
        calData = await calResponse.json();
      } catch (parseError) {
        throw new Error('Failed to parse API response');
      }
      
      if (!calData || !calData.success) {
        const errorMessage = calData?.error || 'Unknown API error';
        throw new Error(errorMessage);
      }
      
      if (!calData.bookings || !Array.isArray(calData.bookings)) {
        throw new Error('Invalid data structure in API response');
      }
      
      const calBookings = calData.bookings.map((booking: any) => ({
        uid: booking.calBookingUid,
        title: booking.title,
        startTime: booking.startTime,
        status: booking.status
      })) as CalBooking[];
      const dbBookings = (Array.isArray(bookings) ? bookings : []) as DbBooking[];
      
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
    const now = Date.now();
    if (now - lastTokenRefresh < REFRESH_COOLDOWN) {
      toast({
        title: 'Please wait',
        description: 'Token refresh is on cooldown. Please wait a few seconds.',
        variant: 'default'
      });
      return;
    }

    setRefreshingToken(true);
    setLastTokenRefresh(now);
    
    try {
      // Clear any previous error state
      setActionResult(null);
      
      const res = await fetch('/api/cal/refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) {
        // Handle HTTP errors
        let errorMessage = 'Failed to refresh token';
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // Ignore JSON parse errors
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await res.json();
      if (data.success) {
        toast({
          title: 'Success',
          description: 'Cal.com token refreshed successfully',
        });
        // Update the integration data
        await fetchCalendarIntegration();
        
        // Wait a moment before retrying event types to ensure token is active
        setTimeout(() => {
          fetchEventTypes();
        }, 1000);
      } else {
        throw new Error(data.error || 'Failed to refresh token');
      }
    } catch (error: any) {
      console.error('Error refreshing token:', error);
      
      // Set actionResult to show the error more prominently
      setActionResult({
        type: 'error',
        message: 'Failed to refresh Cal.com token',
        details: error.message || 'An unknown error occurred'
      });
      
      toast({
        title: 'Error',
        variant: 'destructive',
        description: error.message || 'Failed to refresh Cal.com token',
      });
    } finally {
      setRefreshingToken(false);
    }
  };

  // Add this function near the other API call functions
  const debugCalApi = async () => {
    try {
      setDebugLoading(true);
      
      if (!selectedEventTypeId) {
        if (eventTypes.length > 0) {
          setSelectedEventTypeId(eventTypes[0].id);
        } else {
          throw new Error('No event type selected or available');
        }
      }
      
      const response = await fetch('/api/cal/test/debug-booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          eventTypeId: selectedEventTypeId
        })
      });
      
      const data = await response.json();
      
      setActionResult({
        type: data.success ? 'success' : 'error',
        message: data.success ? 'Debug API Call Successful' : 'Debug API Call Failed',
        details: JSON.stringify(data, null, 2)
      });
    } catch (error) {
      console.error('[DEBUG_CAL_API_ERROR]', error);
      setActionResult({
        type: 'error',
        message: 'Error debugging Cal.com API',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setDebugLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cal.com API Testing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Integration Status - Only show if not connected */}
            {!calendarIntegration && (
              <Alert variant="destructive">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5" />
                  <AlertTitle>No Cal.com integration detected</AlertTitle>
                </div>
                <AlertDescription className="space-y-2">
                  <p>Please connect your Cal.com account first.</p>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/dashboard/settings?tab=integrations">
                      Go to Integration Settings
                    </Link>
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            
            {/* Only show testing UI if integration exists */}
            {calendarIntegration && (
              <>
                {/* Event Type Selection */}
                {eventTypes.length > 0 ? (
                  <div className="mb-4">
                    <label htmlFor="eventType" className="block text-sm font-medium mb-2">
                      Event Type
                    </label>
                    <select
                      id="eventType"
                      value={selectedEventTypeId || ''}
                      onChange={(e) => setSelectedEventTypeId(Number(e.target.value))}
                      className="w-full p-2 border rounded-md"
                    >
                      {eventTypes.map((eventType) => (
                        <option key={eventType.id} value={eventType.id}>
                          {eventType.title}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="mb-4">
                    <Alert>
                      <AlertTitle>No Event Types Loaded</AlertTitle>
                      <AlertDescription className="flex flex-col gap-2">
                        <p>No event types are currently loaded. You can fetch them manually or they will be loaded when creating a booking.</p>
                        <Button 
                          onClick={fetchEventTypes} 
                          disabled={fetchingEventTypes}
                          variant="outline" 
                          size="sm"
                          className="self-start"
                        >
                          {fetchingEventTypes ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          Fetch Event Types
                        </Button>
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
                
                {/* Main testing actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="py-4">
                      <CardTitle className="text-base">Booking Operations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <Button
                          onClick={createBooking}
                          disabled={loading || !selectedEventTypeId}
                          className="w-full"
                        >
                          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          Create New Booking
                        </Button>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <Button
                            onClick={cancelLatestBooking}
                            disabled={loading || bookings.length === 0}
                            variant="outline"
                          >
                            Cancel Latest
                          </Button>
                          <Button
                            onClick={rescheduleBooking}
                            disabled={loading || bookings.length === 0}
                            variant="outline"
                          >
                            Reschedule Latest
                          </Button>
                        </div>
                        
                        <Button 
                          onClick={debugCalApi} 
                          variant="outline" 
                          disabled={debugLoading || !calendarIntegration || eventTypes.length === 0} 
                          className="w-full flex items-center justify-center"
                        >
                          {debugLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> 
                              Debugging...
                            </>
                          ) : (
                            <>Debug Cal.com API</>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="py-4">
                      <CardTitle className="text-base">Authentication</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <Button 
                          onClick={refreshToken} 
                          disabled={refreshingToken}
                          variant="outline"
                          className="w-full"
                        >
                          {refreshingToken ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          Refresh Cal.com Token
                        </Button>
                        
                        <Button 
                          onClick={validateBookingsHandler}
                          disabled={validationResult.isLoading || refreshingToken}
                          className="w-full"
                        >
                          {validationResult.isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          Validate Bookings
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Action Result */}
                {actionResult && (
                  <Alert variant={actionResult.type === 'success' ? "default" : "destructive"}>
                    <div className="flex items-center gap-2">
                      {actionResult.type === 'success' ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <XCircle className="h-5 w-5" />
                      )}
                      <AlertTitle>{actionResult.message}</AlertTitle>
                    </div>
                    {actionResult.details && (
                      <AlertDescription>
                        <div className="mt-2">
                          <Textarea
                            readOnly
                            value={actionResult.details}
                            rows={6}
                            className="font-mono text-xs bg-muted"
                          />
                        </div>
                      </AlertDescription>
                    )}
                  </Alert>
                )}
                
                {/* Validation Results */}
                {validationResult.error && (
                  <Alert variant="destructive">
                    <AlertTitle>Validation Error</AlertTitle>
                    <AlertDescription>
                      {validationResult.error.includes('Failed to refresh expired token') ? (
                        <div className="space-y-2">
                          <p>Your Cal.com access token has expired and automatic refresh failed.</p>
                          <p className="text-sm">Try clicking the "Refresh Cal.com Token" button above.</p>
                        </div>
                      ) : (
                        validationResult.error
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Bookings Card - Always shown as a separate card when integration exists */}
      {calendarIntegration && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Booking History</h3>
                <Button 
                  onClick={refreshBookings} 
                  variant="outline" 
                  size="sm"
                  disabled={bookingsLoading}
                >
                  {bookingsLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Refresh
                </Button>
              </div>
              
              {bookingsLoading ? (
                <div className="flex justify-center p-6">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : bookings && bookings.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Attendee</TableHead>
                      <TableHead>Start Time</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking, index) => (
                      <TableRow key={`booking-${booking.calBookingUid || index}`}>
                        <TableCell className="font-mono text-xs">
                          {booking.calBookingUid?.substring(0, 8)}...
                        </TableCell>
                        <TableCell>{booking.title || 'Untitled'}</TableCell>
                        <TableCell>{booking.attendeeName || 'Unknown'}</TableCell>
                        <TableCell>{safeFormatDate(booking.startTime)}</TableCell>
                        <TableCell>
                          <span className={
                            booking.status === 'CANCELLED' 
                              ? 'text-red-500' 
                              : booking.status === 'CONFIRMED' 
                                ? 'text-green-500' 
                                : 'text-yellow-500'
                          }>
                            {booking.status || 'Unknown'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Alert>
                  <AlertTitle>No Bookings Found</AlertTitle>
                  <AlertDescription>
                    No bookings were found in your account. Try creating a test booking.
                  </AlertDescription>
                </Alert>
              )}
              
              {/* Cal.com Bookings (only shown when validation has been run) */}
              {!validationResult.isLoading && validationResult.calBookings && validationResult.calBookings.length > 0 && (
                <div className="mt-8 space-y-4 border-t pt-4">
                  <h3 className="text-lg font-medium">Cal.com Bookings</h3>
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
                      {validationResult.calBookings.map((booking, index) => (
                        <TableRow key={`cal-booking-${booking.uid || index}`}>
                          <TableCell className="font-mono text-xs">{booking.uid || 'N/A'}</TableCell>
                          <TableCell>{booking.title || 'Untitled'}</TableCell>
                          <TableCell>{safeFormatDate(booking.startTime || booking.start)}</TableCell>
                          <TableCell>{booking.status || 'Unknown'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {validationResult.mismatches && (validationResult.mismatches.calOnly.length > 0 || validationResult.mismatches.dbOnly.length > 0) && (
                    <Alert variant="destructive">
                      <AlertTitle>Data Inconsistencies Found</AlertTitle>
                      <AlertDescription>
                        <div className="mt-2 space-y-2">
                          {validationResult.mismatches.calOnly.length > 0 && (
                            <p>{validationResult.mismatches.calOnly.length} booking(s) exist in Cal.com but not in database</p>
                          )}
                          {validationResult.mismatches.dbOnly.length > 0 && (
                            <p>{validationResult.mismatches.dbOnly.length} booking(s) exist in database but not in Cal.com</p>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}