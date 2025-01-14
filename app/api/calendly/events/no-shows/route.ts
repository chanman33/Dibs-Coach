import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getCalendlyConfig } from '@/lib/calendly-api'

export async function POST(request: Request) {
  try {
    const { invitee } = await request.json()
    
    const config = await getCalendlyConfig()
    
    const response = await fetch(
      `${process.env.CALENDLY_API_BASE}/no_shows`,
      {
        method: 'POST',
        headers: {
          ...config.headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ invitee })
      }
    )

    if (!response.ok) {
      console.error('[CALENDLY_ERROR] Failed to create no-show:', await response.text())
      throw new Error('Failed to create no-show')
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('[CALENDLY_NO_SHOW_ERROR]', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal Server Error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const config = await getCalendlyConfig()
    
    const response = await fetch(
      `${process.env.CALENDLY_API_BASE}/no_shows/${params.id}`,
      {
        method: 'DELETE',
        headers: config.headers
      }
    )

    if (!response.ok) {
      console.error('[CALENDLY_ERROR] Failed to delete no-show:', await response.text())
      throw new Error('Failed to delete no-show')
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('[CALENDLY_NO_SHOW_DELETE_ERROR]', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal Server Error'
      },
      { status: 500 }
    )
  }
} 