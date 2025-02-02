'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { WebhookEvent } from '@clerk/nextjs/server'
import { ROLES } from '@/utils/roles/roles'
import { userCreate } from '@/utils/data/user/userCreate'
import { userUpdate } from '@/utils/data/user/userUpdate'

async function createSupabaseClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}

export async function POST(req: Request) {
  const supabase = await createSupabaseClient()
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

  switch (eventType) {
    case 'user.created': {
      try {
        // Log the incoming payload for debugging
        console.log('[CLERK_WEBHOOK] Creating user with payload:', {
          email: payload?.data?.email_addresses?.[0]?.email_address,
          userId: payload?.data?.id,
        });

        // Verify required fields
        if (!payload?.data?.id) {
          throw new Error('Missing required userId in webhook payload');
        }

        // Create user in Supabase
        const result = await userCreate({
          email: payload?.data?.email_addresses?.[0]?.email_address,
          firstName: payload?.data?.first_name,
          lastName: payload?.data?.last_name,
          profileImageUrl: payload?.data?.image_url,
          userId: payload?.data?.id,
          role: ROLES.MENTEE, // Set the default role
        });

        console.log('[CLERK_WEBHOOK] User created successfully:', result);

        return NextResponse.json({
          status: 200,
          message: 'User created successfully',
          data: result
        });
      } catch (error: any) {
        console.error('[CLERK_WEBHOOK_ERROR] Failed to create user:', {
          error: error.message,
          stack: error.stack,
          payload: payload?.data
        });
        return NextResponse.json({
          status: 500,
          error: error.message || 'Failed to create user'
        });
      }
    }

    case 'user.updated': {
      try {
        const result = await userUpdate({
          email: payload?.data?.email_addresses?.[0]?.email_address,
          firstName: payload?.data?.first_name,
          lastName: payload?.data?.last_name,
          profileImageUrl: payload?.data?.image_url,
          userId: payload?.data?.id,
        })

        return NextResponse.json({
          status: 200,
          message: 'User updated successfully',
          data: result
        })
      } catch (error: any) {
        console.error('[CLERK_WEBHOOK_ERROR] Failed to update user:', error)
        return NextResponse.json({
          status: 500,
          error: error.message || 'Failed to update user'
        })
      }
    }

    default:
      console.warn('[CLERK_WEBHOOK_WARNING] Unhandled event type:', eventType)
      return NextResponse.json({
        status: 400,
        error: `Unhandled webhook event type: ${eventType}`
      })
  }
}

export async function handleNewUser(userId: string) {
  const supabase = await createSupabaseClient()
  try {
    const { data: existingUser } = await supabase
      .from('User')
      .select('id')
      .eq('userId', userId)
      .single();

    if (!existingUser) {
      // Create new user record
      const { error: createError } = await supabase
        .from('User')
        .insert({
          userId,
          role: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

      if (createError) throw createError;
    }

    return { success: true };
  } catch (error) {
    console.error('[NEW_USER_ERROR]', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
} 