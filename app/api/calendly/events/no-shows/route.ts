import { NextResponse } from 'next/server'
import { CalendlyService } from '@/lib/calendly/calendly-service'
import { 
  ApiResponse,
  NoShowRequestSchema,
  CalendlyInvitee,
  CalendlyInviteeSchema
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

    const calendly = new CalendlyService()
    await calendly.markInviteeAsNoShow(requestResult.data.inviteeUri)

    return NextResponse.json<ApiResponse<{ success: true }>>({
      data: { success: true },
      error: null
    })
  } catch (error) {
    console.error('[CALENDLY_NO_SHOW_ERROR]', error)
    const apiError = {
      code: 'OPERATION_FAILED',
      message: 'Failed to mark as no-show',
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
  { params }: { params: { uuid: string } }
) {
  try {
    const calendly = new CalendlyService()
    await calendly.undoInviteeNoShow(params.uuid)

    return NextResponse.json<ApiResponse<{ success: true }>>({
      data: { success: true },
      error: null
    })
  } catch (error) {
    console.error('[CALENDLY_NO_SHOW_ERROR]', error)
    const apiError = {
      code: 'OPERATION_FAILED',
      message: 'Failed to undo no-show',
      details: error instanceof Error ? { message: error.message } : undefined
    }
    return NextResponse.json<ApiResponse<never>>({ 
      data: null, 
      error: apiError 
    }, { status: 500 })
  }
} 