import { NextResponse } from 'next/server'
import { CalendlyService } from '@/lib/calendly-service'

export async function POST(request: Request) {
  try {
    const { inviteeUri } = await request.json()

    if (!inviteeUri) {
      return NextResponse.json(
        { error: 'inviteeUri is required' },
        { status: 400 }
      )
    }

    const calendly = new CalendlyService()
    await calendly.markInviteeAsNoShow(inviteeUri)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[CALENDLY_MARK_NO_SHOW_ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to mark invitee as no-show' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { inviteeUuid: string } }
) {
  try {
    const { inviteeUuid } = params

    const calendly = new CalendlyService()
    await calendly.undoInviteeNoShow(inviteeUuid)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[CALENDLY_UNDO_NO_SHOW_ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to undo no-show' },
      { status: 500 }
    )
  }
} 