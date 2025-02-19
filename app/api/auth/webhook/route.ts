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
        console.log('[CLERK_WEBHOOK] Creating user with payload:', {
          email: payload?.data?.email_addresses?.[0]?.email_address,
          userId: payload?.data?.id,
        });

        if (!payload?.data?.id) {
          throw new Error('Missing required userId in webhook payload');
        }

        // Check if user exists - with retry
        const { data: existingUser } = await withRetry<Pick<UserData, 'ulid' | 'userId'>>(() => 
          Promise.resolve(
            supabase
              .from('User')
              .select('ulid, userId')
              .eq('userId', payload.data.id)
              .single()
              .then(result => ({ data: result.data, error: result.error }))
          )
        );

        if (existingUser) {
          console.log('[CLERK_WEBHOOK] User already exists:', existingUser);
          return NextResponse.json({
            status: 200,
            message: 'User already exists',
            data: existingUser
          });
        }

        // Create new user - with retry
        const { data: newUser, error: createError } = await withRetry<UserData>(() => 
          Promise.resolve(
            supabase
              .from('User')
              .insert({
                ulid: generateUlid(),
                userId: payload.data.id,
                email: payload.data.email_addresses?.[0]?.email_address,
                firstName: payload.data.first_name,
                lastName: payload.data.last_name,
                displayName: payload.data.first_name && payload.data.last_name 
                  ? `${payload.data.first_name} ${payload.data.last_name}`.trim() 
                  : payload.data.email_addresses?.[0]?.email_address?.split('@')[0],
                profileImageUrl: payload.data.image_url,
                systemRole: SYSTEM_ROLES.USER,
                capabilities: [USER_CAPABILITIES.MENTEE],
                isCoach: false,
                isMentee: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              })
              .select('ulid, userId, email, firstName, lastName, profileImageUrl, systemRole, capabilities')
              .single()
              .then(result => ({ data: result.data, error: result.error }))
          )
        );

        if (createError) throw createError;

        console.log('[CLERK_WEBHOOK] User created successfully:', newUser);

        return NextResponse.json({
          status: 200,
          message: 'User created successfully',
          data: newUser
        });
      } catch (error: any) {
        console.error('[CLERK_WEBHOOK_ERROR] Failed to create user:', {
          error: error.message,
          stack: error.stack,
          payload: payload?.data
        });
        
        // Return 500 but don't expose internal error details
        return NextResponse.json({
          status: 500,
          error: 'Failed to create user. Please try signing in again.'
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
