import { NextResponse } from 'next/server';
import { ApiResponse } from '@/utils/types/api';
import { withApiAuth } from '@/utils/middleware/withApiAuth';
import { createAuthClient } from '@/utils/auth';
import { ROLES } from '@/utils/roles/roles';
import { StripeService } from '@/lib/stripe';
import { z } from 'zod';

const stripeService = new StripeService();

// Validation schema for query parameters
const QueryParamsSchema = z.object({
  userUlid: z.string().min(1, 'User ULID is required')
});

// Response type for payment stats
interface PaymentStats {
  totalSpent: number;
  recentSpent: number;
  totalSessions: number;
  upcomingSessions: number;
  defaultPaymentMethod: {
    brand: string;
    last4: string;
  } | null;
}

// GET /api/user/mentee/payment-stats
export const GET = withApiAuth<PaymentStats>(async (req, { userId }) => {
  try {
    const { searchParams } = new URL(req.url);
    const validatedParams = QueryParamsSchema.parse({
      userUlid: searchParams.get('userUlid')
    });

    const supabase = await createAuthClient();

    // Verify the requesting user is the same as the userUlid or is an admin
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('ulid, role')
      .eq('userId', userId)
      .single();

    if (userError || !userData) {
      console.error('[PAYMENT_STATS_ERROR] User not found:', { userId, error: userError });
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found',
          details: userError
        }
      }, { status: 404 });
    }

    // Only allow access to own stats unless admin
    if (userData.ulid !== validatedParams.userUlid && userData.role !== ROLES.ADMIN) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied',
          details: 'You can only access your own payment stats'
        }
      }, { status: 403 });
    }

    // Get total spent on completed sessions
    const { data: completedPayments, error: completedError } = await supabase
      .from('Transaction')
      .select('amount')
      .eq('payerUlid', validatedParams.userUlid)
      .eq('status', 'completed')
      .in('type', ['session_payment', 'bundle_payment']);

    if (completedError) {
      console.error('[PAYMENT_STATS_ERROR] Failed to fetch completed payments:', completedError);
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch payment data',
          details: completedError
        }
      }, { status: 500 });
    }

    const totalSpent = completedPayments?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;

    // Get recent spent (this month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: recentPayments, error: recentError } = await supabase
      .from('Transaction')
      .select('amount')
      .eq('payerUlid', validatedParams.userUlid)
      .eq('status', 'completed')
      .in('type', ['session_payment', 'bundle_payment'])
      .gte('createdAt', startOfMonth.toISOString());

    if (recentError) {
      console.error('[PAYMENT_STATS_ERROR] Failed to fetch recent payments:', recentError);
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch recent payment data',
          details: recentError
        }
      }, { status: 500 });
    }

    const recentSpent = recentPayments?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;

    // Get total completed sessions
    const { count: totalSessions, error: totalSessionsError } = await supabase
      .from('Session')
      .select('*', { count: 'exact', head: true })
      .eq('menteeUlid', validatedParams.userUlid)
      .eq('status', 'completed');

    if (totalSessionsError) {
      console.error('[PAYMENT_STATS_ERROR] Failed to fetch total sessions:', totalSessionsError);
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch session data',
          details: totalSessionsError
        }
      }, { status: 500 });
    }

    // Get upcoming sessions
    const { count: upcomingSessions, error: upcomingError } = await supabase
      .from('Session')
      .select('*', { count: 'exact', head: true })
      .eq('menteeUlid', validatedParams.userUlid)
      .eq('status', 'scheduled')
      .gt('startTime', new Date().toISOString());

    if (upcomingError) {
      console.error('[PAYMENT_STATS_ERROR] Failed to fetch upcoming sessions:', upcomingError);
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch upcoming session data',
          details: upcomingError
        }
      }, { status: 500 });
    }

    // Get default payment method
    let defaultPaymentMethod = null;
    try {
      // Get user's numeric ID
      const { data: user, error: userIdError } = await supabase
        .from('User')
        .select('id')
        .eq('ulid', validatedParams.userUlid)
        .single();

      if (userIdError || !user) {
        throw new Error('Failed to get user ID');
      }

      defaultPaymentMethod = await stripeService.getDefaultPaymentMethod(user.id);
    } catch (error) {
      console.error('[PAYMENT_STATS_ERROR] Failed to fetch stripe payment methods:', error);
      // Don't fail the entire request if Stripe call fails
    }

    return NextResponse.json<ApiResponse<PaymentStats>>({
      data: {
        totalSpent,
        recentSpent,
        totalSessions: totalSessions || 0,
        upcomingSessions: upcomingSessions || 0,
        defaultPaymentMethod,
      },
      error: null
    });
  } catch (error) {
    console.error('[PAYMENT_STATS_ERROR]', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json<ApiResponse<never>>({
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request parameters',
          details: error.flatten()
        }
      }, { status: 400 });
    }
    return NextResponse.json<ApiResponse<never>>({
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        details: error instanceof Error ? { message: error.message } : undefined
      }
    }, { status: 500 });
  }
}); 