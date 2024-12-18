import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    // Auth check
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Initialize Supabase client
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

    // Fetch brokers with their teams
    const { data: brokers, error } = await supabase
      .from('Broker')
      .select(`
        id,
        name,
        description,
        Team:Team ( 
          id,
          name,
          brokerId
        )
      `)

    if (error) {
      console.error('[BROKERS_GET_ERROR]', error)
      return new NextResponse('Database error', { status: 500 })
    }

    // Transform the data to match the frontend interface
    const transformedBrokers = brokers.map(broker => ({
      id: broker.id,
      name: broker.name,
      teams: broker.Team || [] // Rename Team to teams for frontend
    }))

    return NextResponse.json(transformedBrokers)
  } catch (error) {
    console.error('[BROKERS_GET]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
} 