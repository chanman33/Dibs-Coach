import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { ZoomService } from '@/lib/zoom/zoom-service'
import {
  ZoomMeetingSchema,
  ZoomMeetingUpdateSchema,
  type ZoomMeeting,
  type ZoomMeetingUpdate,
} from '@/utils/types/zoom'
import { createUserIfNotExists } from '@/utils/auth'

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validatedData = ZoomMeetingSchema.parse(body)
    
    const user = await createUserIfNotExists(userId)
    if (!user?.userUlid) {
      console.error('[CREATE_ZOOM_MEETING_ERROR] User not found')
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const zoomService = new ZoomService()
    await zoomService.init()

    // Create the Zoom meeting
    const meeting = await zoomService.createMeeting(validatedData)

    // If sessionId is provided, store the meeting URLs
    const sessionId = body.sessionId as string | undefined
    if (sessionId) {
      await zoomService.storeMeetingUrls(sessionId, meeting.id, {
        startUrl: meeting.start_url,
        joinUrl: meeting.join_url,
      })
    }

    return NextResponse.json({ data: meeting })
  } catch (error) {
    console.error('[CREATE_ZOOM_MEETING_ERROR]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validatedData = ZoomMeetingUpdateSchema.parse(body)
    
    const user = await createUserIfNotExists(userId)
    if (!user?.userUlid) {
      console.error('[UPDATE_ZOOM_MEETING_ERROR] User not found')
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const zoomService = new ZoomService()
    await zoomService.init()

    // Update the Zoom meeting
    const meeting = await zoomService.updateMeeting(validatedData)

    // If sessionId is provided, update the meeting URLs
    const sessionId = body.sessionId as string | undefined
    if (sessionId) {
      await zoomService.storeMeetingUrls(sessionId, meeting.id, {
        startUrl: meeting.start_url,
        joinUrl: meeting.join_url,
      })
    }

    return NextResponse.json({ data: meeting })
  } catch (error) {
    console.error('[UPDATE_ZOOM_MEETING_ERROR]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const meetingId = searchParams.get('meetingId')

    if (!meetingId) {
      return NextResponse.json(
        { error: 'Meeting ID is required' },
        { status: 400 }
      )
    }

    const zoomService = new ZoomService()
    await zoomService.init()

    const meeting = await zoomService.getMeeting(parseInt(meetingId))
    return NextResponse.json({ data: meeting })
  } catch (error) {
    console.error('[GET_ZOOM_MEETING_ERROR]', error)
    return NextResponse.json(
      { error: 'Error fetching Zoom meeting' },
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
    const meetingId = searchParams.get('meetingId')

    if (!meetingId) {
      return NextResponse.json(
        { error: 'Meeting ID is required' },
        { status: 400 }
      )
    }

    const zoomService = new ZoomService()
    await zoomService.init()

    await zoomService.deleteMeeting(parseInt(meetingId))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE_ZOOM_MEETING_ERROR]', error)
    return NextResponse.json(
      { error: 'Error deleting Zoom meeting' },
      { status: 500 }
    )
  }
} 