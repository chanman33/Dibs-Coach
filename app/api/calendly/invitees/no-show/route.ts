import { NextResponse } from 'next/server'
import { CalendlyService } from '@/lib/calendly/calendly-service'
import { 
  ApiResponse,
  NoShowRequestSchema,
  NoShowRequest
} from '@/utils/types/calendly'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const requestResult = NoShowRequestSchema.safeParse(body)

    if (!requestResult.success) {
      const error = {
        code: 'INVALID_REQUEST',
        message: 'Invalid request body',
        details: requestResult.error.flatten()
      }
      return NextResponse.json<ApiResponse<never>>({ 
        data: null, 
        error 
      }, { status: 400 })
    }

    const { inviteeUri } = requestResult.data

    const calendly = new CalendlyService()
    await calendly.markInviteeAsNoShow(inviteeUri)

    return NextResponse.json<ApiResponse<{ success: true }>>({
      data: { success: true },
      error: null
    })
  } catch (error) {
    console.error('[CALENDLY_MARK_NO_SHOW_ERROR]', error)
    const apiError = {
      code: 'MARK_NO_SHOW_ERROR',
      message: 'Failed to mark invitee as no-show',
      details: error instanceof Error ? { message: error.message } : undefined
    }
    return NextResponse.json<ApiResponse<never>>({ 
      data: null, 
      error: apiError 
    }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { inviteeUuid: string } }
) {
  try {
    const { inviteeUuid } = params

    if (!inviteeUuid) {
      const error = {
        code: 'MISSING_UUID',
        message: 'Invitee UUID is required'
      }
      return NextResponse.json<ApiResponse<never>>({ 
        data: null, 
        error 
      }, { status: 400 })
    }

    const calendly = new CalendlyService()
    await calendly.undoInviteeNoShow(inviteeUuid)

    return NextResponse.json<ApiResponse<{ success: true }>>({
      data: { success: true },
      error: null
    })
  } catch (error) {
    console.error('[CALENDLY_UNDO_NO_SHOW_ERROR]', error)
    const apiError = {
      code: 'UNDO_NO_SHOW_ERROR',
      message: 'Failed to undo no-show',
      details: error instanceof Error ? { message: error.message } : undefined
    }
    return NextResponse.json<ApiResponse<never>>({ 
      data: null, 
      error: apiError 
    }, { status: 500 })
  }
} 