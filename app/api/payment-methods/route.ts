import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { StripePaymentMethodService } from '@/lib/stripe-payment-methods'
import { z } from 'zod'

const paymentMethodService = new StripePaymentMethodService()

// Validation schemas
const savePaymentMethodSchema = z.object({
  paymentMethodId: z.string(),
  setAsDefault: z.boolean().optional(),
})

const setDefaultSchema = z.object({
  paymentMethodId: z.string(),
})

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const result = await paymentMethodService.getPaymentMethods(Number(userId))
    if (result.error) {
      return new NextResponse(result.error.message, { status: 400 })
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('[PAYMENT_METHODS_GET]', error)
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
    const validatedData = savePaymentMethodSchema.safeParse(body)
    
    if (!validatedData.success) {
      return new NextResponse('Invalid request data', { status: 400 })
    }

    const result = await paymentMethodService.savePaymentMethod(
      Number(userId),
      validatedData.data.paymentMethodId,
      validatedData.data.setAsDefault
    )

    if (result.error) {
      return new NextResponse(result.error.message, { status: 400 })
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('[PAYMENT_METHODS_POST]', error)
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
    const validatedData = setDefaultSchema.safeParse(body)
    
    if (!validatedData.success) {
      return new NextResponse('Invalid request data', { status: 400 })
    }

    const result = await paymentMethodService.setDefaultPaymentMethod(
      Number(userId),
      validatedData.data.paymentMethodId
    )

    if (result.error) {
      return new NextResponse(result.error.message, { status: 400 })
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('[PAYMENT_METHODS_PUT]', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const paymentMethodId = searchParams.get('id')

    if (!paymentMethodId) {
      return new NextResponse('Payment method ID is required', { status: 400 })
    }

    const result = await paymentMethodService.deletePaymentMethod(
      Number(userId),
      paymentMethodId
    )

    if (result.error) {
      return new NextResponse(result.error.message, { status: 400 })
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('[PAYMENT_METHODS_DELETE]', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 