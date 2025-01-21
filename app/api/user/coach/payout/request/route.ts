import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { addDays } from 'date-fns';

export async function POST(req: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { userDbId, amount } = await req.json();

    if (!userDbId || !amount) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Verify the requesting user is the same as the userDbId or is an admin
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('id, role')
      .eq('userId', clerkUserId)
      .single();

    if (userError || !userData) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Only allow access to own payouts unless admin
    if (userData.id.toString() !== userDbId && userData.role !== 'admin') {
      return new NextResponse('Unauthorized', { status: 403 });
    }

    // Get recent early payout requests to prevent abuse
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: recentPayoutRequests } = await supabase
      .from('Payout')
      .select('*', { count: 'exact', head: true })
      .eq('coachDbId', userDbId)
      .eq('type', 'early_request')
      .gte('createdAt', thirtyDaysAgo.toISOString());

    // Limit early payouts to 2 per month to encourage using the regular bi-weekly schedule
    if (recentPayoutRequests && recentPayoutRequests >= 2) {
      return new NextResponse(
        'Maximum early payout requests reached. Please wait for the scheduled bi-weekly payout.',
        { status: 400 }
      );
    }

    // Verify available balance
    const { data: completedUnpaidSessions } = await supabase
      .from('Session')
      .select('Payment(amount)')
      .eq('coachDbId', userDbId)
      .eq('status', 'completed')
      .eq('Payment.payoutStatus', 'pending');

    const availableBalance = completedUnpaidSessions?.reduce((sum: number, session: any) => {
      return sum + Number(session.Payment?.amount || 0);
    }, 0) || 0;

    if (availableBalance < amount) {
      return new NextResponse('Insufficient available balance', { status: 400 });
    }

    // Start a transaction to create payout and update payment statuses
    const { data: payout, error: payoutError } = await supabase
      .from('Payout')
      .insert({
        coachDbId: userDbId,
        amount,
        status: 'pending',
        type: 'early_request',
        createdAt: new Date().toISOString(),
        expectedPayoutDate: addDays(new Date(), 2).toISOString(), // Early payouts processed within 2 business days
      })
      .select()
      .single();

    if (payoutError) {
      console.error('[PAYOUT_CREATE_ERROR]', payoutError);
      return new NextResponse('Failed to create payout', { status: 500 });
    }

    // Update payment statuses to mark them as being processed
    const { error: updateError } = await supabase
      .from('Payment')
      .update({ 
        payoutStatus: 'processing',
        payoutId: payout.id,
      })
      .eq('payeeDbId', userDbId)
      .eq('payoutStatus', 'pending')
      .eq('status', 'completed');

    if (updateError) {
      console.error('[PAYMENT_UPDATE_ERROR]', updateError);
      return new NextResponse('Failed to update payments', { status: 500 });
    }

    return NextResponse.json({
      message: 'Early payout request submitted successfully',
      payoutId: payout.id,
      expectedPayoutDate: payout.expectedPayoutDate,
    });
  } catch (error) {
    console.error('[PAYOUT_REQUEST_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 