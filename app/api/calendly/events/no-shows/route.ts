import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { CalendlyService } from '@/lib/calendly/calendly-service'
import { 
  ApiResponse,
  NoShowRequestSchema,
  CalendlyInvitee,
  CalendlyInviteeSchema
} from '@/utils/types/calendly'

export async function POST(request: Request) {
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
    const requestResult = NoShowRequestSchema.safeParse(body)

    if (!requestResult.success) {
      return NextResponse.json<ApiResponse<never>>({ 
        data: null, 
        error: {
          code: 'INVALID_REQUEST',
          message: 'Invalid request body',
          details: requestResult.error.flatten()
        }
      }, { status: 400 })
    }

    const calendly = new CalendlyService()
    await calendly.init()
    await calendly.markInviteeAsNoShow(requestResult.data.inviteeUri)

    return NextResponse.json<ApiResponse<{ success: true }>>({
      data: { success: true },
      error: null
    })
  } catch (error) {
    console.error('[CALENDLY_NO_SHOW_ERROR]', error)
    return NextResponse.json<ApiResponse<never>>({ 
      data: null, 
      error: {
        code: 'OPERATION_FAILED',
        message: 'Failed to mark as no-show',
        details: error instanceof Error ? { message: error.message } : undefined
      }
    }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
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
    const uuid = searchParams.get('uuid')
    
    if (!uuid) {
      return NextResponse.json<ApiResponse<never>>({ 
        data: null, 
        error: {
          code: 'INVALID_PARAMETERS',
          message: 'UUID is required'
        }
      }, { status: 400 })
    }

    const calendly = new CalendlyService()
    await calendly.init()
    await calendly.undoInviteeNoShow(uuid)

    return NextResponse.json<ApiResponse<{ success: true }>>({
      data: { success: true },
      error: null
    })
  } catch (error) {
    console.error('[CALENDLY_NO_SHOW_ERROR]', error)
    return NextResponse.json<ApiResponse<never>>({ 
      data: null, 
      error: {
        code: 'OPERATION_FAILED',
        message: 'Failed to undo no-show',
        details: error instanceof Error ? { message: error.message } : undefined
      }
    }, { status: 500 })
  }
} 