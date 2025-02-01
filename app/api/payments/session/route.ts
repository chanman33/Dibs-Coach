import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { StripeService } from '@/lib/stripe';

// Schema for session payment request
const sessionPaymentSchema = z.object({
  sessionDbId: z.number(),
  amount: z.number().positive(),
  currency: z.string().default('USD'),
});

const stripeService = new StripeService();

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = sessionPaymentSchema.parse(body);

    // Get session details to verify access and get coach info
    const session = await stripeService.getSessionWithCoach(validatedData.sessionDbId);
    if (!session) {
      return new NextResponse('Session not found', { status: 404 });
    }

    // Get client's database ID
    const user = await stripeService.getUserByClerkId(userId);
    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Create payment intent
    const { paymentIntent, transaction } = await stripeService.createSessionPaymentIntent({
      amount: validatedData.amount,
      currency: validatedData.currency,
      sessionDbId: validatedData.sessionDbId,
      coachId: session.coachDbId,
      clientId: user.id,
      connectedAccountId: session.coach.stripeConnectAccountId,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      transactionId: transaction.id,
    });
  } catch (error) {
    console.error('[PAYMENT_ERROR]', error);
    if (error instanceof z.ZodError) {
      return new NextResponse('Invalid request data', { status: 400 });
    }
    return new NextResponse('Internal server error', { status: 500 });
  }
} 