import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { stripeService } from '@/lib/stripe';
import { TransactionService } from '@/lib/stripe/transactions';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { sessionId, paymentMethodId } = body;

    // Get user and session details
    const user = await stripeService.getUserByClerkId(userId);
    const session = await stripeService.getSessionWithCoach(sessionId);

    if (!user || !session) {
      return new NextResponse('Invalid request data', { status: 400 });
    }
    // Ensure coach details and Stripe Connect Account ID are available.
    if (!session.coach?.stripeConnectAccountId) {
      return new NextResponse('Missing coach stripe connect account', { status: 400 });
    }
    // Convert price to cents if not already in cents
    const amountInCents = session.priceInCents ?? session.priceAmount * 100;

    // Create payment intent
    const { paymentIntent, transaction } = await stripeService.createSessionPaymentIntent({
      amount: amountInCents,
      currency: session.currency.toLowerCase(),
      sessionDbId: session.id,
      coachId: session.coachDbId,
      clientId: user.id,
      connectedAccountId: session.coach.stripeConnectAccountId,
      sessionStartTime: session.startTime.toISOString(),
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      transactionId: transaction.id,
    });

  } catch (error) {
    console.error('[SESSION_PAYMENT_ERROR]', error);
    return new NextResponse(
      error instanceof Error ? error.message : 'Payment processing failed',
      { status: 500 }
    );
  }
} 