import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { stripeService } from '@/lib/stripe';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get user's database ID and verify they are a coach
    const user = await stripeService.getUserByClerkId(userId);
    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    if (!user.role.includes('coach')) {
      return new NextResponse('Only coaches can request early payouts', { status: 403 });
    }

    // Calculate available earnings
    const { data: sessions } = await stripeService.supabase
      .from('Session')
      .select('coachPayoutAmount')
      .eq('coachDbId', user.id)
      .eq('status', 'completed')
      .eq('paymentStatus', 'completed')
      .is('payoutStatus', null);

    const availableAmount = sessions?.reduce((sum, session) => sum + session.coachPayoutAmount, 0) || 0;

    if (availableAmount <= 0) {
      return new NextResponse('No available earnings for early payout', { status: 400 });
    }

    // Process early payout with fee
    const { transfer, transaction } = await stripeService.requestEarlyPayout(
      user.id,
      availableAmount
    );

    // Update sessions as paid out
    await stripeService.supabase
      .from('Session')
      .update({ payoutStatus: 'completed' })
      .eq('coachDbId', user.id)
      .is('payoutStatus', null);

    return NextResponse.json({
      success: true,
      payout: {
        originalAmount: availableAmount,
        payoutAmount: transaction.amount,
        feeAmount: transaction.metadata.feeAmount,
        feePercentage: transaction.metadata.feePercentage,
        transferId: transfer.id,
      },
    });

  } catch (error) {
    console.error('[EARLY_PAYOUT_ERROR]', error);
    return new NextResponse(
      error instanceof Error ? error.message : 'Internal server error',
      { status: 500 }
    );
  }
} 