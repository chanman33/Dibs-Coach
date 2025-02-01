import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { StripeDisputeService } from '@/lib/stripe-disputes'
import { z } from 'zod'

const disputeService = new StripeDisputeService()

// Validation schemas
const evidenceSchema = z.object({
  customerName: z.string().optional(),
  customerEmailAddress: z.string().optional(),
  billingAddress: z.string().optional(),
  serviceDate: z.string().optional(),
  productDescription: z.string().optional(),
  customerSignature: z.string().optional(),
  customerPurchaseIp: z.string().optional(),
  customerCommunication: z.string().optional(),
  uncategorizedText: z.string().optional(),
})

const submitEvidenceSchema = z.object({
  disputeId: z.string(),
  evidence: evidenceSchema,
})

const processRefundSchema = z.object({
  disputeId: z.string(),
  amount: z.number().optional(),
})

export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const disputeId = searchParams.get('id')
    const sessionId = searchParams.get('sessionId')

    if (disputeId) {
      const result = await disputeService.getDispute(disputeId)
      if (result.error) {
        return new NextResponse(result.error.message, { status: 400 })
      }
      return NextResponse.json(result.data)
    }

    if (sessionId) {
      const result = await disputeService.getDisputesBySession(sessionId)
      if (result.error) {
        return new NextResponse(result.error.message, { status: 400 })
      }
      return NextResponse.json(result.data)
    }

    return new NextResponse('Either dispute ID or session ID is required', {
      status: 400,
    })
  } catch (error) {
    console.error('[DISPUTES_GET]', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await request.json()
    const validatedData = submitEvidenceSchema.safeParse(body)

    if (!validatedData.success) {
      return new NextResponse('Invalid request data', { status: 400 })
    }

    const result = await disputeService.submitEvidence(
      validatedData.data.disputeId,
      validatedData.data.evidence
    )

    if (result.error) {
      return new NextResponse(result.error.message, { status: 400 })
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('[DISPUTES_POST]', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await request.json()
    const validatedData = processRefundSchema.safeParse(body)

    if (!validatedData.success) {
      return new NextResponse('Invalid request data', { status: 400 })
    }

    const result = await disputeService.processRefund(
      validatedData.data.disputeId,
      validatedData.data.amount
    )

    if (result.error) {
      return new NextResponse(result.error.message, { status: 400 })
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('[DISPUTES_PUT]', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 