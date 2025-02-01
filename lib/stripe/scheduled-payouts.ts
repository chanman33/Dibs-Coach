import { stripeService } from './index';
import { createServerClient } from '@supabase/ssr';

interface CoachEarnings {
  coachDbId: number;
  totalAmount: number;
  sessionIds: number[];
}

export async function processScheduledPayouts() {
  try {
    const supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      {
        cookies: {
          get(name: string) { return undefined; },
          set(name: string, value: string, options: any) { return; },
          remove(name: string, options: any) { return; },
        },
      }
    );

    // Get all completed sessions that haven't been paid out
    const { data: sessions, error } = await supabase
      .from('Session')
      .select(`
        id,
        coachDbId,
        coachPayoutAmount,
        status,
        paymentStatus
      `)
      .eq('status', 'completed')
      .eq('paymentStatus', 'completed')
      .is('payoutStatus', null);

    if (error) throw error;

    // Group sessions by coach and calculate total amounts
    const coachEarnings = sessions.reduce((acc: { [key: number]: CoachEarnings }, session) => {
      if (!acc[session.coachDbId]) {
        acc[session.coachDbId] = {
          coachDbId: session.coachDbId,
          totalAmount: 0,
          sessionIds: [],
        };
      }
      
      acc[session.coachDbId].totalAmount += session.coachPayoutAmount;
      acc[session.coachDbId].sessionIds.push(session.id);
      
      return acc;
    }, {});

    // Process payouts for each coach
    for (const earnings of Object.values(coachEarnings)) {
      try {
        // Create the payout
        await stripeService.scheduleCoachPayout(
          earnings.coachDbId,
          earnings.totalAmount,
          'usd'
        );

        // Update sessions as paid out
        await supabase
          .from('Session')
          .update({ payoutStatus: 'completed' })
          .in('id', earnings.sessionIds);

      } catch (error) {
        console.error(`[PAYOUT_ERROR] Failed to process payout for coach ${earnings.coachDbId}:`, error);
        // Continue with other coaches even if one fails
        continue;
      }
    }

    return {
      success: true,
      processedCoaches: Object.keys(coachEarnings).length,
      totalPayouts: Object.values(coachEarnings).reduce((sum, e) => sum + e.totalAmount, 0),
    };

  } catch (error) {
    console.error('[PAYOUT_ERROR] Scheduled payout processing failed:', error);
    throw error;
  }
} 