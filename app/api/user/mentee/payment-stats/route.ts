import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { StripeService } from '@/lib/stripe';

const stripeService = new StripeService();

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userDbId = searchParams.get('userDbId');

    if (!userDbId) {
      return new NextResponse('Missing userDbId parameter', { status: 400 });
    }

    // Verify the requesting user is the same as the userDbId or is an admin
    const { data: userData, error: userError } = await stripeService.supabase
      .from('User')
      .select('id, role')
      .eq('userId', userId)
      .single();

    if (userError || !userData) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Only allow access to own stats unless admin
    if (userData.id.toString() !== userDbId && userData.role !== 'admin') {
      return new NextResponse('Unauthorized', { status: 403 });
    }

    // Get total spent on completed sessions
    const { data: completedPayments } = await stripeService.supabase
      .from('Transaction')
      .select('amount')
      .eq('payerDbId', userDbId)
      .eq('status', 'completed')
      .in('type', ['session_payment', 'bundle_payment']);

    const totalSpent = completedPayments?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;

    // Get recent spent (this month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: recentPayments } = await stripeService.supabase
      .from('Transaction')
      .select('amount')
      .eq('payerDbId', userDbId)
      .eq('status', 'completed')
      .in('type', ['session_payment', 'bundle_payment'])
      .gte('createdAt', startOfMonth.toISOString());

    const recentSpent = recentPayments?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;

    // Get total completed sessions
    const { count: totalSessions } = await stripeService.supabase
      .from('Session')
      .select('*', { count: 'exact', head: true })
      .eq('menteeDbId', userDbId)
      .eq('status', 'completed');

    // Get upcoming sessions
    const { count: upcomingSessions } = await stripeService.supabase
      .from('Session')
      .select('*', { count: 'exact', head: true })
      .eq('menteeDbId', userDbId)
      .eq('status', 'scheduled')
      .gt('startTime', new Date().toISOString());

    // Get default payment method
    const { data: user } = await stripeService.supabase
      .from('User')
      .select('stripeCustomerId')
      .eq('id', userDbId)
      .single();

    let defaultPaymentMethod = null;
    if (user?.stripeCustomerId) {
      const paymentMethods = await stripeService.stripe.paymentMethods.list({
        customer: user.stripeCustomerId,
        type: 'card',
      });

      const defaultMethod = paymentMethods.data.find(method => method.card);
      if (defaultMethod?.card) {
        defaultPaymentMethod = {
          brand: defaultMethod.card.brand,
          last4: defaultMethod.card.last4,
        };
      }
    }

    return NextResponse.json({
      totalSpent,
      recentSpent,
      totalSessions: totalSessions || 0,
      upcomingSessions: upcomingSessions || 0,
      defaultPaymentMethod,
    });
  } catch (error) {
    console.error('[PAYMENT_STATS_ERROR]', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
} 