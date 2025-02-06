'use server';

import { createAuthClient } from '@/utils/auth';

interface RevenueOverview {
  totalRevenue: number;
  netRevenue: number;
  platformFees: number;
  coachPayouts: number;
}

interface RevenueTrend {
  date: string;
  revenue: number;
  platformFees: number;
  coachPayouts: number;
}

interface TransactionDistribution {
  type: string;
  value: number;
}

interface CoachRevenue {
  coach: string;
  sessions: number;
  revenue: number;
  avgRating: number;
}

interface TransactionCoach {
  id: number;
  firstName: string | null;
  lastName: string | null;
}

interface TransactionData {
  amount: number;
  coachPayout: number;
  coach: {
    id: number;
    firstName: string | null;
    lastName: string | null;
  };
  session: {
    id: number;
  } | null;
}

interface TransactionHistory {
  id: number;
  type: string;
  status: string;
  amount: number;
  platformFee: number;
  coachPayout: number;
  createdAt: string;
  coach: {
    firstName: string | null;
    lastName: string | null;
  };
  payer: {
    firstName: string | null;
    lastName: string | null;
  };
}

interface PayoutHistory {
  id: number;
  status: string;
  amount: number;
  currency: string;
  processedAt: string | null;
  scheduledDate: string;
  coach: {
    firstName: string | null;
    lastName: string | null;
  };
}

export async function fetchRevenueOverview(startDate?: Date, endDate?: Date): Promise<RevenueOverview> {
  const supabase = await createAuthClient();

  const query = supabase
    .from("Transaction")
    .select(`
      amount,
      platformFee,
      coachPayout,
      type,
      status
    `)
    .eq('status', 'completed');

  if (startDate && endDate) {
    query.gte('createdAt', startDate.toISOString())
         .lte('createdAt', endDate.toISOString());
  }

  const { data: transactions, error } = await query;

  if (error) {
    console.error('[REVENUE_ERROR]', error);
    throw new Error('Failed to fetch revenue overview');
  }

  const overview = transactions.reduce((acc, transaction) => {
    acc.totalRevenue += transaction.amount || 0;
    acc.platformFees += transaction.platformFee || 0;
    acc.coachPayouts += transaction.coachPayout || 0;
    return acc;
  }, {
    totalRevenue: 0,
    platformFees: 0,
    coachPayouts: 0,
    netRevenue: 0
  });

  overview.netRevenue = overview.totalRevenue - overview.coachPayouts;

  return overview;
}

export async function fetchRevenueTrends(
  timeframe: 'daily' | 'weekly' | 'monthly' | 'yearly',
  startDate?: Date,
  endDate?: Date
): Promise<RevenueTrend[]> {
  const supabase = await createAuthClient();

  // Determine the date trunc format based on timeframe
  const dateFormat = {
    daily: 'day',
    weekly: 'week',
    monthly: 'month',
    yearly: 'year'
  }[timeframe];

  const { data, error } = await supabase
    .from("Transaction")
    .select(`
      createdAt,
      amount,
      platformFee,
      coachPayout
    `)
    .eq('status', 'completed')
    .gte('createdAt', startDate?.toISOString() || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .lte('createdAt', endDate?.toISOString() || new Date().toISOString())
    .order('createdAt');

  if (error) {
    console.error('[REVENUE_ERROR]', error);
    throw new Error('Failed to fetch revenue trends');
  }

  // Group and aggregate data by timeframe
  const trends = data.reduce((acc: { [key: string]: RevenueTrend }, transaction) => {
    const date = new Date(transaction.createdAt);
    const key = timeframe === 'daily' 
      ? date.toISOString().split('T')[0]
      : date.toISOString().slice(0, 7); // Monthly format

    if (!acc[key]) {
      acc[key] = {
        date: key,
        revenue: 0,
        platformFees: 0,
        coachPayouts: 0
      };
    }

    acc[key].revenue += transaction.amount || 0;
    acc[key].platformFees += transaction.platformFee || 0;
    acc[key].coachPayouts += transaction.coachPayout || 0;

    return acc;
  }, {});

  return Object.values(trends);
}

export async function fetchTransactionDistribution(
  startDate?: Date,
  endDate?: Date
): Promise<TransactionDistribution[]> {
  const supabase = await createAuthClient();

  const { data: transactions, error } = await supabase
    .from("Transaction")
    .select(`
      type,
      amount
    `)
    .eq('status', 'completed')
    .gte('createdAt', startDate?.toISOString() || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .lte('createdAt', endDate?.toISOString() || new Date().toISOString());

  if (error) {
    console.error('[REVENUE_ERROR]', error);
    throw new Error('Failed to fetch transaction distribution');
  }

  const distribution = transactions.reduce((acc: { [key: string]: number }, transaction) => {
    const type = transaction.type || 'Other';
    acc[type] = (acc[type] || 0) + (transaction.amount || 0);
    return acc;
  }, {});

  return Object.entries(distribution).map(([type, value]) => ({
    type,
    value
  }));
}

export async function fetchCoachRevenues(
  startDate?: Date,
  endDate?: Date
): Promise<CoachRevenue[]> {
  const supabase = await createAuthClient();

  const { data, error } = await supabase
    .from("Transaction")
    .select(`
      amount,
      coachPayout,
      coach:coachDbId(
        id,
        firstName,
        lastName
      ),
      session:sessionDbId(
        id
      )
    `)
    .eq('status', 'completed')
    .gte('createdAt', startDate?.toISOString() || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .lte('createdAt', endDate?.toISOString() || new Date().toISOString());

  if (error) {
    console.error('[REVENUE_ERROR]', error);
    throw new Error('Failed to fetch coach revenues');
  }

  // Group and aggregate by coach
  const coachStats = data.reduce((acc: { [key: number]: CoachRevenue }, transaction: any) => {
    const coach = transaction.coach;
    if (!coach?.id) return acc;

    if (!acc[coach.id]) {
      acc[coach.id] = {
        coach: `${coach.firstName || ''} ${coach.lastName || ''}`.trim(),
        sessions: 0,
        revenue: 0,
        avgRating: 0 // TODO: Fetch actual ratings
      };
    }

    acc[coach.id].sessions += transaction.session ? 1 : 0;
    acc[coach.id].revenue += transaction.coachPayout || 0;

    return acc;
  }, {});

  return Object.values(coachStats);
}

export async function fetchTransactionHistory(
  startDate?: Date,
  endDate?: Date,
  page = 1,
  pageSize = 10
): Promise<{ data: TransactionHistory[]; total: number }> {
  const supabase = await createAuthClient();

  const start = startDate?.toISOString() || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const end = endDate?.toISOString() || new Date().toISOString();

  // Get total count
  const { count } = await supabase
    .from("Transaction")
    .select('*', { count: 'exact', head: true })
    .gte('createdAt', start)
    .lte('createdAt', end);

  // Get paginated data
  const { data, error } = await supabase
    .from("Transaction")
    .select(`
      id,
      type,
      status,
      amount,
      platformFee,
      coachPayout,
      createdAt,
      coach:coachDbId(
        firstName,
        lastName
      ),
      payer:payerDbId(
        firstName,
        lastName
      )
    `)
    .gte('createdAt', start)
    .lte('createdAt', end)
    .order('createdAt', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) {
    console.error('[REVENUE_ERROR]', error);
    throw new Error('Failed to fetch transaction history');
  }

  return {
    data: data.map(item => ({
      ...item,
      coach: item.coach?.[0] || { firstName: null, lastName: null },
      payer: item.payer?.[0] || { firstName: null, lastName: null }
    })) as TransactionHistory[],
    total: count || 0
  };
}

export async function fetchPayoutHistory(
  startDate?: Date,
  endDate?: Date,
  page = 1,
  pageSize = 10
): Promise<{ data: PayoutHistory[]; total: number }> {
  const supabase = await createAuthClient();

  const start = startDate?.toISOString() || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const end = endDate?.toISOString() || new Date().toISOString();

  // Get total count
  const { count } = await supabase
    .from("Payout")
    .select('*', { count: 'exact', head: true })
    .gte('createdAt', start)
    .lte('createdAt', end);

  // Get paginated data
  const { data, error } = await supabase
    .from("Payout")
    .select(`
      id,
      status,
      amount,
      currency,
      processedAt,
      scheduledDate,
      payee:payeeDbId(
        firstName,
        lastName
      )
    `)
    .gte('createdAt', start)
    .lte('createdAt', end)
    .order('scheduledDate', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) {
    console.error('[REVENUE_ERROR]', error);
    throw new Error('Failed to fetch payout history');
  }

  return {
    data: data.map(item => ({
      ...item,
      coach: item.payee?.[0] || { firstName: null, lastName: null }
    })) as PayoutHistory[],
    total: count || 0
  };
} 