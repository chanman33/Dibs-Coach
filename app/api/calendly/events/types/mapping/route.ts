import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { EventTypeMappingSchema } from '@/utils/types/calendly'
import { CalendlyService } from '@/lib/calendly/calendly-service'

async function getUserDbId(userId: string) {
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

  const { data, error } = await supabase
    .from('User')
    .select('id')
    .eq('userId', userId)
    .single()

  if (error) throw error
  return data.id
}

export async function GET(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const userDbId = await getUserDbId(userId)
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

    const { data: mappings, error } = await supabase
      .from('CalendlyEventTypeMapping')
      .select('*')
      .eq('userDbId', userDbId)

    if (error) {
      console.error('[GET_EVENT_TYPE_MAPPINGS_ERROR]', error)
      return NextResponse.json(
        { error: 'Failed to fetch event type mappings' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: mappings })
  } catch (error) {
    console.error('[GET_EVENT_TYPE_MAPPINGS_ERROR]', error)
    return NextResponse.json(
      { error: 'Error processing request' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validatedData = EventTypeMappingSchema.parse(body)
    const userDbId = await getUserDbId(userId)

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

    // Check if mapping already exists
    const { data: existing } = await supabase
      .from('CalendlyEventTypeMapping')
      .select('id')
      .eq('userDbId', userDbId)
      .eq('eventTypeUri', validatedData.eventTypeUri)
      .single()

    if (existing) {
      // Update existing mapping
      const { data, error } = await supabase
        .from('CalendlyEventTypeMapping')
        .update({
          ...validatedData,
          userDbId,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        console.error('[UPDATE_EVENT_TYPE_MAPPING_ERROR]', error)
        return NextResponse.json(
          { error: 'Failed to update event type mapping' },
          { status: 500 }
        )
      }

      return NextResponse.json({ data })
    } else {
      // Create new mapping
      const { data, error } = await supabase
        .from('CalendlyEventTypeMapping')
        .insert({
          ...validatedData,
          userDbId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        console.error('[CREATE_EVENT_TYPE_MAPPING_ERROR]', error)
        return NextResponse.json(
          { error: 'Failed to create event type mapping' },
          { status: 500 }
        )
      }

      return NextResponse.json({ data })
    }
  } catch (error) {
    console.error('[CREATE_EVENT_TYPE_MAPPING_ERROR]', error)
    return NextResponse.json(
      { error: 'Error processing request' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const eventTypeUri = searchParams.get('eventTypeUri')
    
    if (!eventTypeUri) {
      return NextResponse.json(
        { error: 'Event type URI is required' },
        { status: 400 }
      )
    }

    const userDbId = await getUserDbId(userId)
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

    const { error } = await supabase
      .from('CalendlyEventTypeMapping')
      .delete()
      .eq('userDbId', userDbId)
      .eq('eventTypeUri', eventTypeUri)

    if (error) {
      console.error('[DELETE_EVENT_TYPE_MAPPING_ERROR]', error)
      return NextResponse.json(
        { error: 'Failed to delete event type mapping' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE_EVENT_TYPE_MAPPING_ERROR]', error)
    return NextResponse.json(
      { error: 'Error processing request' },
      { status: 500 }
    )
  }
} 