import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
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
            cookieStore.delete({ name, ...options })
          },
        },
      }
    )

    const { data: integration, error } = await supabase
      .from('calendly_integration')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('[CALENDLY_STATUS_ERROR]', error)
    }

    return NextResponse.json({ isConnected: !!integration })
  } catch (error) {
    console.error('[CALENDLY_STATUS_ERROR]', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 