import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

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

    // Get total earnings
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

    return NextResponse.json({
      totalSessions: totalSessions || 0,
      recentSessions: recentSessions || 0,
      totalEarnings,
      recentEarningsTotal,
      uniqueMenteeCount,
    });
  } catch (error) {
    console.error('[ANALYTICS_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 