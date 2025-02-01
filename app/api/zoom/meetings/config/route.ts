import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { ZoomService } from '@/lib/zoom/zoom-service'
import { SessionMeetingConfigSchema } from '@/utils/types/zoom'

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
    const zoomService = new ZoomService()
    await zoomService.init()

    const config = await zoomService.getMeetingConfig(userDbId)
    return NextResponse.json({ data: config })
  } catch (error) {
    console.error('[GET_ZOOM_CONFIG_ERROR]', error)
    return NextResponse.json(
      { error: 'Error fetching Zoom meeting configuration' },
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
    const validatedData = SessionMeetingConfigSchema.parse(body)
    const userDbId = await getUserDbId(userId)

    const zoomService = new ZoomService()
    await zoomService.init()

    await zoomService.updateMeetingConfig(userDbId, validatedData)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[UPDATE_ZOOM_CONFIG_ERROR]', error)
    return NextResponse.json(
      { error: 'Error updating Zoom meeting configuration' },
      { status: 500 }
    )
  }
} 