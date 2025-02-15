import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { EventTypeMappingSchema, ApiResponse } from '@/utils/types/calendly'
import { createAuthClient } from '@/utils/auth'

async function getUserDbId(userId: string) {
  const supabase = await createAuthClient()
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
    return NextResponse.json<ApiResponse<never>>({ 
      data: null, 
      error: {
        code: 'UNAUTHORIZED',
        message: 'Not authenticated'
      }
    }, { status: 401 })
  }

  try {
    const userDbId = await getUserDbId(userId)
    const supabase = await createAuthClient()

    const { data: mappings, error } = await supabase
      .from('CalendlyEventTypeMapping')
      .select('*')
      .eq('userDbId', userDbId)

    if (error) {
      console.error('[GET_EVENT_TYPE_MAPPINGS_ERROR]', error)
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch event type mappings',
          details: error
        }
      }, { status: 500 })
    }

    return NextResponse.json<ApiResponse<any>>({ 
      data: mappings,
      error: null
    })
  } catch (error) {
    console.error('[GET_EVENT_TYPE_MAPPINGS_ERROR]', error)
    return NextResponse.json<ApiResponse<never>>({
      data: null,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error processing request',
        details: error instanceof Error ? { message: error.message } : undefined
      }
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json<ApiResponse<never>>({ 
      data: null, 
      error: {
        code: 'UNAUTHORIZED',
        message: 'Not authenticated'
      }
    }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validatedData = EventTypeMappingSchema.parse(body)
    const userDbId = await getUserDbId(userId)
    const supabase = await createAuthClient()

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
        return NextResponse.json<ApiResponse<never>>({
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to update event type mapping',
            details: error
          }
        }, { status: 500 })
      }

      return NextResponse.json<ApiResponse<any>>({ 
        data,
        error: null
      })
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
        return NextResponse.json<ApiResponse<never>>({
          data: null,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to create event type mapping',
            details: error
          }
        }, { status: 500 })
      }

      return NextResponse.json<ApiResponse<any>>({ 
        data,
        error: null
      })
    }
  } catch (error) {
    console.error('[CREATE_EVENT_TYPE_MAPPING_ERROR]', error)
    return NextResponse.json<ApiResponse<never>>({
      data: null,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error processing request',
        details: error instanceof Error ? { message: error.message } : undefined
      }
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json<ApiResponse<never>>({ 
      data: null, 
      error: {
        code: 'UNAUTHORIZED',
        message: 'Not authenticated'
      }
    }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const eventTypeUri = searchParams.get('eventTypeUri')
    
    if (!eventTypeUri) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'INVALID_PARAMETERS',
          message: 'Event type URI is required'
        }
      }, { status: 400 })
    }

    const userDbId = await getUserDbId(userId)
    const supabase = await createAuthClient()

    const { error } = await supabase
      .from('CalendlyEventTypeMapping')
      .delete()
      .eq('userDbId', userDbId)
      .eq('eventTypeUri', eventTypeUri)

    if (error) {
      console.error('[DELETE_EVENT_TYPE_MAPPING_ERROR]', error)
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to delete event type mapping',
          details: error
        }
      }, { status: 500 })
    }

    return NextResponse.json<ApiResponse<boolean>>({ 
      data: true,
      error: null
    })
  } catch (error) {
    console.error('[DELETE_EVENT_TYPE_MAPPING_ERROR]', error)
    return NextResponse.json<ApiResponse<never>>({
      data: null,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error processing request',
        details: error instanceof Error ? { message: error.message } : undefined
      }
    }, { status: 500 })
  }
} 