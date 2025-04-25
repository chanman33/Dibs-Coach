'use server'

import { NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { WebhookEvent } from '@clerk/nextjs/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { generateUlid } from '@/utils/ulid'
import { SYSTEM_ROLES, USER_CAPABILITIES } from '@/utils/roles/roles'

interface UserUpdateData {
  email?: string;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string;
  profileImageUrl?: string | null;
  updatedAt: string;
}

interface UserData {
  ulid: string;
  userId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  profileImageUrl?: string;
  systemRole?: string;
  capabilities?: string[];
}

// Create a reusable Supabase client for webhook operations
async function createWebhookClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}

// Retry wrapper for database operations
async function withRetry<T>(
  operation: () => Promise<{ data: T | null; error: any; }>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<{ data: T | null; error: any }> {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await operation();
      if (result.error) throw result.error;
      return { data: result.data, error: null };
    } catch (error: any) {
      lastError = error;
      console.error(`[CLERK_WEBHOOK_ERROR] Attempt ${i + 1} failed:`, error);
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  
  return { data: null, error: lastError };
}

export async function POST(req: Request) {
  console.log('[CLERK_WEBHOOK] Received webhook request')

  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    console.error('[CLERK_WEBHOOK_ERROR] Missing CLERK_WEBHOOK_SECRET')
    return NextResponse.json({
      status: 500,
      error: 'Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env'
    })
  }

  // Get the headers
  const headerPayload = req.headers
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error('[CLERK_WEBHOOK_ERROR] Missing required headers')
    return NextResponse.json({
      status: 400,
      error: 'Missing required headers'
    })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET)

  let evt: WebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('[CLERK_WEBHOOK_ERROR] Error verifying webhook:', err)
    return NextResponse.json({
      status: 400,
      error: 'Error verifying webhook signature'
    })
  }

  const eventType = evt.type
  const supabase = await createWebhookClient()

  switch (eventType) {
    case 'user.created': {
      try {
        console.log('[CLERK_WEBHOOK] Processing user.created event for:', {
          userId: payload?.data?.id,
        });

        if (!payload?.data?.id) {
          throw new Error('Missing required userId in webhook payload');
        }

        const primaryEmail = payload.data.email_addresses?.find(
          (email: any) => email.id === payload.data.primary_email_address_id
        )?.email_address || payload.data.email_addresses?.[0]?.email_address;

        if (!primaryEmail) {
          console.warn('[CLERK_WEBHOOK] No primary email found for user:', payload.data.id);
          // Decide if this is an error or if you can proceed without email
        }

        const userDataToUpsert = {
          userId: payload.data.id,
          email: primaryEmail,
          firstName: payload.data.first_name,
          lastName: payload.data.last_name,
          displayName: payload.data.first_name && payload.data.last_name
            ? `${payload.data.first_name} ${payload.data.last_name}`.trim()
            : primaryEmail?.split('@')[0],
          profileImageUrl: payload.data.image_url,
          // Set default values for fields that should only be set on insert
          // These will be ignored if the user already exists due to onConflict
          systemRole: SYSTEM_ROLES.USER,
          capabilities: [USER_CAPABILITIES.MENTEE],
          isCoach: false,
          isMentee: true,
          // Keep ulid generation logic - upsert needs it if inserting
          ulid: generateUlid(),
          createdAt: new Date().toISOString(), // Will be set only on insert
          updatedAt: new Date().toISOString() // Always update timestamp
        };

        // Use upsert to handle both creation and potential existing user
        const { data: upsertedUser, error: upsertError } = await withRetry<UserData>(async () => {
          // Explicitly await the Supabase operation here
          const result = await supabase
            .from('User')
            .upsert(userDataToUpsert, {
              onConflict: 'userId', // Specify the conflict target
              // Use default values on insert (Supabase handles this behavior)
              // ignoreDuplicates: false // default is false, ensures updates happen
            })
            .select('ulid, userId, email, firstName, lastName, profileImageUrl, systemRole, capabilities')
            .single(); // Expect one row after upsert
            
          // Wrap the result to match the expected type for withRetry
          return { data: result.data, error: result.error };
        });

        if (upsertError) throw upsertError;

        console.log('[CLERK_WEBHOOK] User upserted successfully:', upsertedUser);

        return NextResponse.json({
          status: 200,
          message: 'User processed successfully',
          data: upsertedUser
        });
      } catch (error: any) {
        console.error('[CLERK_WEBHOOK_ERROR] Failed to process user.created:', {
          error: error.message,
          code: error.code, // Log the error code if available
          stack: error.stack,
          payload: payload?.data
        });

        // Return 500 but don't expose internal error details
        return NextResponse.json({
          status: 500,
          error: 'Failed to process user. Please try signing in again.'
        });
      }
    }

    case 'user.updated': {
      try {
        if (!payload?.data?.id) {
          throw new Error('Missing required userId in webhook payload');
        }

        // Get current user data to check if displayName was manually set - with retry
        const { data: currentUser } = await withRetry<Pick<UserData, 'ulid' | 'displayName' | 'firstName' | 'lastName'>>(() =>
          Promise.resolve(
            supabase
              .from('User')
              .select('ulid, displayName, firstName, lastName')
              .eq('userId', payload.data.id)
              .single()
              .then(result => ({ data: result.data, error: result.error }))
          )
        );

        // Only update displayName if it matches the old name pattern
        const oldNamePattern = currentUser?.firstName && currentUser?.lastName ? 
          `${currentUser.firstName} ${currentUser.lastName}`.trim() : null;
        
        const updateData: UserUpdateData = {
          email: payload.data.email_addresses?.[0]?.email_address,
          firstName: payload.data.first_name,
          lastName: payload.data.last_name,
          profileImageUrl: payload.data.image_url,
          updatedAt: new Date().toISOString()
        };

        // If displayName matches old name pattern, update it with new name
        if (currentUser?.displayName === oldNamePattern) {
          updateData.displayName = payload.data.first_name && payload.data.last_name ? 
            `${payload.data.first_name} ${payload.data.last_name}`.trim() :
            currentUser.displayName;
        }

        // Update user - with retry
        const { data: updatedUser, error: updateError } = await withRetry<UserData>(() =>
          Promise.resolve(
            supabase
              .from('User')
              .update(updateData)
              .eq('userId', payload.data.id)
              .select('ulid, userId, email, firstName, lastName, displayName, profileImageUrl, systemRole')
              .single()
              .then(result => ({ data: result.data, error: result.error }))
          )
        );

        if (updateError) throw updateError;

        return NextResponse.json({
          status: 200,
          message: 'User updated successfully',
          data: updatedUser
        });
      } catch (error: any) {
        console.error('[CLERK_WEBHOOK_ERROR] Failed to update user:', error);
        return NextResponse.json({
          status: 500,
          error: 'Failed to update user'
        });
      }
    }

    default:
      console.warn('[CLERK_WEBHOOK_WARNING] Unhandled event type:', eventType);
      return NextResponse.json({
        status: 400,
        error: `Unhandled webhook event type: ${eventType}`
      });
  }
}
