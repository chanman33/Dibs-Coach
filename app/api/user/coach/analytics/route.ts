import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { addDays, startOfDay, endOfDay, nextFriday, addWeeks } from 'date-fns';

type SessionWithPayment = {
  Payment: {
    amount: number;
  } | null;
}

type Payout = {
  id: number;
  amount: number;
  status: string;
  createdAt: string;
  type: string;
}

type UpcomingSession = {
  id: number;
  startTime: string;
  type: string;
  Payment: {
    amount: number;
  } | null;
}

export async function GET(req: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userDbId = searchParams.get('userDbId');

    if (!userDbId) {
      return new NextResponse('Missing userDbId parameter', { status: 400 });
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

    // Only allow access to own analytics unless admin
    if (userData.id.toString() !== userDbId && userData.role !== 'admin') {
      return new NextResponse('Unauthorized', { status: 403 });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const now = new Date();
    const today = startOfDay(now);
    
    // Calculate next bi-weekly payout date (every other Friday)
    const nextPayoutFriday = nextFriday(today);
    // If today is after this week's Friday, use next Friday
    const basePayoutDate = today > nextPayoutFriday ? addWeeks(nextPayoutFriday, 1) : nextPayoutFriday;
    // If this Friday is not a payout Friday (odd week), add another week
    const isPayoutWeek = Math.floor(basePayoutDate.getTime() / (14 * 24 * 60 * 60 * 1000)) % 2 === 0;
    const nextPayoutDate = isPayoutWeek ? basePayoutDate : addWeeks(basePayoutDate, 1);

    // Get total sessions
    const { count: totalSessions } = await supabase
      .from('Session')
      .select('*', { count: 'exact', head: true })
      .eq('coachDbId', userDbId);

    // Get completed sessions in last 30 days
    const { count: recentSessions } = await supabase
      .from('Session')
      .select('*', { count: 'exact', head: true })
      .eq('coachDbId', userDbId)
      .eq('status', 'completed')
      .gte('startTime', thirtyDaysAgo.toISOString());

    // Get total earnings from completed sessions
    const { data: earnings } = await supabase
      .from('Payment')
      .select('amount')
      .eq('payeeDbId', userDbId)
      .eq('status', 'completed');

    const totalEarnings = earnings?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;

    // Get recent earnings (last 30 days)
    const { data: recentEarnings } = await supabase
      .from('Payment')
      .select('amount, createdAt')
      .eq('payeeDbId', userDbId)
      .eq('status', 'completed')
      .gte('createdAt', thirtyDaysAgo.toISOString());

    const recentEarningsTotal = recentEarnings?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;

    // Get unique mentees count
    const { data: uniqueMentees } = await supabase
      .from('Session')
      .select('menteeDbId')
      .eq('coachDbId', userDbId)
      .eq('status', 'completed');

    const uniqueMenteeCount = new Set(uniqueMentees?.map(session => session.menteeDbId)).size;

    // Get pending balance (booked but not completed sessions)
    const { data: pendingSessions } = await supabase
      .from('Session')
      .select('Payment(amount)')
      .eq('coachDbId', userDbId)
      .eq('status', 'scheduled')
      .gt('startTime', now.toISOString());

    const pendingBalance = (pendingSessions as SessionWithPayment[] | null)?.reduce((sum, session) => {
      return sum + Number(session.Payment?.amount || 0);
    }, 0) || 0;

    // Get available balance (completed sessions not yet paid out)
    const { data: completedUnpaidSessions } = await supabase
      .from('Session')
      .select('Payment(amount)')
      .eq('coachDbId', userDbId)
      .eq('status', 'completed')
      .eq('Payment.payoutStatus', 'pending');

    const availableBalance = (completedUnpaidSessions as SessionWithPayment[] | null)?.reduce((sum, session) => {
      return sum + Number(session.Payment?.amount || 0);
    }, 0) || 0;

    // Calculate next payout (available balance that will be paid in next bi-weekly payout)
    const nextPayoutAmount = availableBalance;

    // Get recent payouts (completed)
    const { data: recentPayments } = await supabase
      .from('Payout')
      .select('id, amount, status, createdAt, type')
      .eq('coachDbId', userDbId)
      .eq('status', 'completed')
      .order('createdAt', { ascending: false })
      .limit(10);

    // Get upcoming sessions
    const { data: upcomingSessions } = await supabase
      .from('Session')
      .select('id, startTime:createdAt, type, Payment(amount)')
      .eq('coachDbId', userDbId)
      .eq('status', 'scheduled')
      .gt('startTime', now.toISOString())
      .order('startTime', { ascending: true })
      .limit(10);

    // Transform sessions to payment format
    const pendingPayments = (upcomingSessions as UpcomingSession[] | null)?.map(session => ({
      id: session.id,
      amount: session.Payment?.amount || 0,
      status: 'scheduled',
      createdAt: session.startTime,
      sessionType: session.type
    })) || [];

    return NextResponse.json({
      totalSessions: totalSessions || 0,
      recentSessions: recentSessions || 0,
      totalEarnings,
      recentEarningsTotal,
      uniqueMenteeCount,
      pendingBalance,
      availableBalance,
      nextPayoutAmount,
      nextPayoutDate: nextPayoutDate.toISOString(),
      recentPayments: recentPayments as Payout[] || [],
      pendingPayments,
    });
  } catch (error) {
    console.error('[ANALYTICS_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 