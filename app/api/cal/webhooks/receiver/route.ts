import { NextRequest, NextResponse } from 'next/server';
import { createAuthClient } from '@/utils/auth';
import { env } from '@/lib/env';
import crypto from 'crypto';
import { generateUlid } from '@/utils/ulid';

// Cal.com webhook event types
export enum CalWebhookEventType {
  BOOKING_CREATED = 'BOOKING_CREATED',
  BOOKING_RESCHEDULED = 'BOOKING_RESCHEDULED',
  BOOKING_CANCELLED = 'BOOKING_CANCELLED',
  BOOKING_REJECTED = 'BOOKING_REJECTED',
  BOOKING_REQUESTED = 'BOOKING_REQUESTED',
  BOOKING_PAYMENT_INITIATED = 'BOOKING_PAYMENT_INITIATED',
  BOOKING_PAYMENT_CONFIRMED = 'BOOKING_PAYMENT_CONFIRMED',
  BOOKING_UPDATED = 'BOOKING_UPDATED',
  FORM_SUBMITTED = 'FORM_SUBMITTED',
  MEETING_ENDED = 'MEETING_ENDED',
  RECORDING_READY = 'RECORDING_READY'
}

// Payload interfaces
interface CalBookingPayload {
  uid: string;
  title: string;
  eventTypeId: number;
  startTime: string;
  endTime: string;
  description?: string;
  attendees: {
    email: string;
    name: string;
    timeZone: string;
    language: {
      locale: string;
    };
  }[];
  organizer: {
    id: number;
    name: string;
    email: string;
    username?: string;
    timeZone: string;
    language: {
      locale: string;
    };
  };
  status?: string;
  responses?: Record<string, any>;
  metadata?: Record<string, any>;
  location?: string;
  cancellationReason?: string;
  rejectionReason?: string;
  payment?: {
    amount: number;
    currency: string;
    status: string;
  };
}

interface CalWebhookEvent {
  triggerEvent: CalWebhookEventType;
  createdAt: string;
  payload: CalBookingPayload;
}

/**
 * Verify the Cal.com webhook signature
 */
function verifyCalSignature(request: NextRequest, body: string): boolean {
  if (!env.CAL_WEBHOOK_SECRET) {
    console.error('[WEBHOOK_ERROR] No webhook secret configured', {
      timestamp: new Date().toISOString()
    });
    return false;
  }

  const signature = request.headers.get('X-Cal-Signature-256');
  if (!signature) {
    console.error('[WEBHOOK_ERROR] No signature provided in headers', {
      headers: Object.fromEntries(request.headers.entries()),
      timestamp: new Date().toISOString()
    });
    return false;
  }

  // For test mode, accept any signature
  if (request.headers.get('X-Test-Mode') === 'true') {
    console.log('[WEBHOOK] Test mode enabled, skipping signature verification', {
      timestamp: new Date().toISOString()
    });
    return true;
  }

  try {
    const hmac = crypto.createHmac('sha256', env.CAL_WEBHOOK_SECRET);
    const digest = hmac.update(body).digest('hex');
    const signatureHash = `sha256=${digest}`;

    // Use timingSafeEqual to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signatureHash),
      Buffer.from(signature)
    );
  } catch (error) {
    console.error('[WEBHOOK_ERROR] Signature verification failed:', {
      error,
      signature: signature ? signature.substring(0, 20) + '...' : 'undefined', // Only log part of the signature
      timestamp: new Date().toISOString(),
      stack: error instanceof Error ? error.stack : undefined
    });
    return false;
  }
}

/**
 * Process a booking created/updated event
 */
async function processBookingEvent(
  event: CalWebhookEvent,
  supabase: ReturnType<typeof createAuthClient>
) {
  const { triggerEvent, payload } = event;
  const { uid: bookingUid, organizer, startTime, endTime, title, description, attendees, status } = payload;
  const now = new Date().toISOString();

  console.log(`[CAL_WEBHOOK] Processing ${triggerEvent} for booking ${bookingUid}`);

  try {
    // Generate ULID with error handling
    let bookingUlid: string;
    try {
      bookingUlid = generateUlid();
    } catch (error) {
      console.error('[CAL_WEBHOOK_ERROR] Failed to generate ULID:', error);
      return false;
    }

    // Find the CalendarIntegration for this organizer
    const { data: calIntegration, error: calError } = await supabase
      .from('CalendarIntegration')  // PascalCase table name
      .select('userUlid')
      .eq('calManagedUserId', organizer.id)
      .single();

    if (calError) {
      console.error('[CAL_WEBHOOK_ERROR] Unable to find calendar integration:', calError);
      return false;
    }

    const userUlid = calIntegration.userUlid;

    // Check if the booking already exists in our database
    const { data: existingBooking, error: bookingError } = await supabase
      .from('CalBooking')  // PascalCase table name
      .select('ulid')
      .eq('calBookingUid', bookingUid)
      .maybeSingle();

    if (bookingError && bookingError.code !== 'PGRST116') {
      console.error('[CAL_WEBHOOK_ERROR] Error checking for existing booking:', bookingError);
      return false;
    }

    // Prepare booking data
    const attendeeEmails = attendees.map(a => a.email).join(', ');
    const primaryAttendee = attendees[0] || { email: '', name: '' };

    if (existingBooking) {
      // Update existing booking
      if (triggerEvent === CalWebhookEventType.BOOKING_CANCELLED) {
        // Mark as cancelled
        const { error: updateError } = await supabase
          .from('CalBooking')  // PascalCase table name
          .update({
            status: 'CANCELLED',
            cancellationReason: payload.cancellationReason || 'Cancelled via Cal.com',
            updatedAt: now
          })
          .eq('calBookingUid', bookingUid);
          
        if (updateError) {
          console.error('[CAL_WEBHOOK_ERROR] Failed to cancel booking:', updateError);
          return false;
        }
      } else {
        // Update booking details
        const bookingStatus = 
          triggerEvent === CalWebhookEventType.BOOKING_REJECTED ? 'REJECTED' :
          triggerEvent === CalWebhookEventType.BOOKING_REQUESTED ? 'PENDING' :
          'CONFIRMED';
          
        const { error: updateError } = await supabase
          .from('CalBooking')  // PascalCase table name
          .update({
            title,
            description: description || '',
            startTime,
            endTime,
            attendeeEmail: primaryAttendee.email,
            attendeeName: primaryAttendee.name,
            allAttendees: attendeeEmails,
            status: bookingStatus,
            metadata: payload.metadata || {},
            updatedAt: now
          })
          .eq('calBookingUid', bookingUid);
          
        if (updateError) {
          console.error('[CAL_WEBHOOK_ERROR] Failed to update booking:', updateError);
          return false;
        }
      }
      
      console.log(`[CAL_WEBHOOK] Successfully updated booking ${bookingUid}`);
      return true;
    } else {
      // Create new booking record
      if (triggerEvent === CalWebhookEventType.BOOKING_CANCELLED) {
        // No need to create a record for a cancelled booking that doesn't exist in our system
        return true;
      }
      
      const bookingStatus = 
        triggerEvent === CalWebhookEventType.BOOKING_REJECTED ? 'REJECTED' :
        triggerEvent === CalWebhookEventType.BOOKING_REQUESTED ? 'PENDING' :
        'CONFIRMED';
      
      const { error: createError } = await supabase
        .from('CalBooking')  // PascalCase table name
        .insert({
          ulid: bookingUlid,  // Use pre-generated ULID
          userUlid,
          calBookingUid: bookingUid,
          title,
          description: description || '',
          startTime,
          endTime,
          attendeeEmail: primaryAttendee.email,
          attendeeName: primaryAttendee.name,
          allAttendees: attendeeEmails,
          status: bookingStatus,
          metadata: payload.metadata || {},
          createdAt: now,
          updatedAt: now
        });
        
      if (createError) {
        console.error('[CAL_WEBHOOK_ERROR] Failed to create booking:', createError);
        return false;
      }
      
      console.log(`[CAL_WEBHOOK] Successfully created booking ${bookingUid}`);
      return true;
    }
  } catch (error) {
    console.error('[CAL_WEBHOOK_ERROR] Exception processing booking event:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Ensure webhook secret is configured
    if (!env.CAL_WEBHOOK_SECRET) {
      console.error('[CAL_WEBHOOK_ERROR] Webhook secret is not configured');
      return NextResponse.json({ 
        error: 'Webhook secret is not configured' 
      }, { status: 500 });
    }

    // Parse request body as text for signature verification
    let body;
    try {
      body = await request.text();
    } catch (error) {
      console.error('[CAL_WEBHOOK_ERROR] Failed to read request body:', error);
      return NextResponse.json({ 
        error: 'Failed to read request body' 
      }, { status: 400 });
    }
    
    // Verify webhook signature
    if (!verifyCalSignature(request, body)) {
      console.error('[CAL_WEBHOOK_ERROR] Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    
    try {
      // Parse the event
      const event: CalWebhookEvent = JSON.parse(body);
      const { triggerEvent } = event;
      
      console.log(`[CAL_WEBHOOK] Received ${triggerEvent} event`);
      
      // Initialize Supabase client
      const supabase = createAuthClient();
      
      // Process different event types
      switch (triggerEvent) {
        case CalWebhookEventType.BOOKING_CREATED:
        case CalWebhookEventType.BOOKING_UPDATED:
        case CalWebhookEventType.BOOKING_RESCHEDULED:
        case CalWebhookEventType.BOOKING_CANCELLED:
        case CalWebhookEventType.BOOKING_REJECTED:
        case CalWebhookEventType.BOOKING_REQUESTED:
          const success = await processBookingEvent(event, supabase);
          if (!success) {
            return NextResponse.json({ 
              error: 'Failed to process booking event',
              event_type: triggerEvent 
            }, { status: 500 });
          }
          break;
          
        case CalWebhookEventType.MEETING_ENDED:
          // Process meeting ended event (could update session status, etc.)
          console.log('[CAL_WEBHOOK] Meeting ended event received:', event.payload);
          // TODO: Implement meeting ended handling
          break;
          
        case CalWebhookEventType.FORM_SUBMITTED:
          // Process form submission
          console.log('[CAL_WEBHOOK] Form submission received:', event.payload);
          // TODO: Implement form submission handling
          break;
          
        default:
          console.log(`[CAL_WEBHOOK] Unhandled event type: ${triggerEvent}`);
          return NextResponse.json({ 
            message: `Unhandled event type: ${triggerEvent}`,
            status: 'ignored' 
          }, { status: 200 });
      }
      
      // Return success response
      return NextResponse.json({ 
        success: true,
        event_type: triggerEvent
      });
    } catch (error) {
      console.error('[CAL_WEBHOOK_ERROR] Error processing webhook payload:', {
        error,
        body: body.substring(0, 200), // Log just the first 200 chars for debugging
        timestamp: new Date().toISOString()
      });
      return NextResponse.json({ 
        error: 'Failed to process webhook payload',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 400 });
    }
  } catch (error) {
    console.error('[CAL_WEBHOOK_ERROR] Unhandled exception:', {
      error,
      timestamp: new Date().toISOString(),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'An unexpected error occurred while processing the webhook'
    }, { status: 500 });
  }
} 