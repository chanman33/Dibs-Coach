'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { WebhookEvent } from '@clerk/nextjs/server'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env')
  }

  // Get the headers
  const headerPayload = req.headers
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new NextResponse('Error occured -- no svix headers', {
      status: 400
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
    console.error('Error verifying webhook:', err)
    return new NextResponse('Error occured', {
      status: 400
    })
  }

  const eventType = evt.type

  if (eventType === 'user.updated') {
    const { id, image_url } = evt.data

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    try {
      // Update the user's profile image URL in our database
      const { error } = await supabase
        .from('User')
        .update({
          profileImageUrl: image_url,
          updatedAt: new Date().toISOString()
        })
        .eq('userId', id)

      if (error) {
        console.error('[CLERK_WEBHOOK_ERROR] Failed to update profile image:', error)
        return new NextResponse('Failed to update profile image', { status: 500 })
      }

      return new NextResponse('Profile image updated successfully', { status: 200 })
    } catch (error) {
      console.error('[CLERK_WEBHOOK_ERROR] Unexpected error:', error)
      return new NextResponse('Internal server error', { status: 500 })
    }
  }

  return new NextResponse('Webhook processed', { status: 200 })
} 