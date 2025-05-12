import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { StripeService } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

const stripeService = new StripeService();

// Transaction types
const TRANSACTION_TYPES = ['session_payment', 'bundle_payment', 'payout', 'refund'] as const;
type TransactionType = typeof TRANSACTION_TYPES[number];

const TRANSACTION_STATUS = ['completed', 'pending', 'failed', 'refunded', 'disputed'] as const;
type TransactionStatus = typeof TRANSACTION_STATUS[number];

interface TransactionUser {
  firstName: string | null;
  lastName: string | null;
  role: string;
}

interface RawDatabaseTransaction {
  id: number;
  type: string;
  status: string;
  amount: number;
  currency: string;
  createdAt: string;
  metadata: Record<string, any>;
  payer: {
    firstName: string | null;
    lastName: string | null;
    role: string;
  } | null;
  coach: {
    firstName: string | null;
    lastName: string | null;
    role: string;
  } | null;
}

interface DatabaseTransaction {
  id: number;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  currency: string;
  createdAt: string;
  metadata: Record<string, any>;
  payer: TransactionUser | null;
  coach: TransactionUser | null;
}

interface FormattedTransaction {
  id: number;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  currency: string;
  createdAt: string;
  metadata: Record<string, any>;
  counterparty: {
    name: string;
    role: 'coach' | 'mentee';
  } | null;
}

interface ApiError extends Error {
  status?: number;
  code?: string;
}

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')));
    const offset = (page - 1) * limit;

    // Validate filter
    const validFilters = ['all', 'completed', 'pending', 'failed', 'payouts', 'refunds'];
    if (!validFilters.includes(filter)) {
      return new NextResponse('Invalid filter', { status: 400 });
    }

    // Get user's database ID and role
    const user = await stripeService.getUserByClerkId(userId);
    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Build query
    let query = stripeService.supabase
      .from('Transaction')
      .select(`
        id,
        type,
        status,
        amount,
        currency,
        createdAt,
        metadata,
        payer:User!Transaction_payerDbId_fkey (
          firstName,
          lastName,
          role
        ),
        coach:User!Transaction_coachDbId_fkey (
          firstName,
          lastName,
          role
        )
      `)
      .order('createdAt', { ascending: false });

    // Apply filters
    switch (filter) {
      case 'completed':
        query = query.eq('status', 'completed');
        break;
      case 'pending':
        query = query.eq('status', 'pending');
        break;
      case 'failed':
        query = query.eq('status', 'failed');
        break;
      case 'payouts':
        query = query.eq('type', 'payout');
        break;
      case 'refunds':
        query = query.eq('type', 'refund');
        break;
    }

    // Apply user role filter
    const { data: userData } = await stripeService.supabase
      .from('User')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role?.includes('coach')) {
      // For coaches, show received payments and payouts
      query = query.or(`coachDbId.eq.${user.id},payerDbId.eq.${user.id}`);
    } else {
      // For mentees, show sent payments and refunds
      query = query.eq('payerDbId', user.id);
    }

    // Get total count for pagination
    const countResult = await stripeService.supabase
      .from('Transaction')
      .select('*', { count: 'exact', head: true })
      .or(`coachDbId.eq.${user.id},payerDbId.eq.${user.id}`);
    
    const total = countResult.count ?? 0;

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data, error } = await query;

    if (error) {
      console.error('[TRANSACTIONS_ERROR]', error);
      throw new Error('Failed to fetch transactions');
    }

    if (!data) {
      return NextResponse.json({
        transactions: [],
        pagination: {
          total: 0,
          page,
          totalPages: 0,
          hasMore: false,
        },
      });
    }

    // Format transactions for the frontend
    const formattedTransactions: FormattedTransaction[] = data.map((rawTransaction: any) => {
      // First convert the raw data to match our expected types
      const transaction: RawDatabaseTransaction = {
        id: rawTransaction.id,
        type: rawTransaction.type,
        status: rawTransaction.status,
        amount: rawTransaction.amount,
        currency: rawTransaction.currency,
        createdAt: rawTransaction.createdAt,
        metadata: rawTransaction.metadata || {},
        payer: rawTransaction.payer ? {
          firstName: rawTransaction.payer.firstName,
          lastName: rawTransaction.payer.lastName,
          role: rawTransaction.payer.role,
        } : null,
        coach: rawTransaction.coach ? {
          firstName: rawTransaction.coach.firstName,
          lastName: rawTransaction.coach.lastName,
          role: rawTransaction.coach.role,
        } : null,
      };

      // Then validate and convert to database format
      const dbTransaction: DatabaseTransaction = {
        id: transaction.id,
        type: validateTransactionType(transaction.type),
        status: validateTransactionStatus(transaction.status),
        amount: transaction.amount,
        currency: transaction.currency,
        createdAt: transaction.createdAt,
        metadata: transaction.metadata,
        payer: transaction.payer,
        coach: transaction.coach,
      };

      // Finally transform to the frontend format
      return {
        id: dbTransaction.id,
        type: dbTransaction.type,
        status: dbTransaction.status,
        amount: dbTransaction.amount,
        currency: dbTransaction.currency,
        createdAt: dbTransaction.createdAt,
        metadata: dbTransaction.metadata,
        counterparty: dbTransaction.type === 'payout' ? null : {
          name: userData?.role?.includes('coach')
            ? formatName(dbTransaction.payer)
            : formatName(dbTransaction.coach),
          role: userData?.role?.includes('coach') ? 'mentee' : 'coach',
        },
      };
    });

    return NextResponse.json({
      transactions: formattedTransactions,
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('[TRANSACTIONS_ERROR]', error);
    const apiError = error as ApiError;
    return new NextResponse(
      apiError.message || 'Internal server error',
      { status: apiError.status || 500 }
    );
  }
}

function formatName(user: TransactionUser | null): string {
  if (!user) return '';
  return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User';
}

function validateTransactionType(type: string): TransactionType {
  if (TRANSACTION_TYPES.includes(type as TransactionType)) {
    return type as TransactionType;
  }
  throw new Error(`Invalid transaction type: ${type}`);
}

function validateTransactionStatus(status: string): TransactionStatus {
  if (TRANSACTION_STATUS.includes(status as TransactionStatus)) {
    return status as TransactionStatus;
  }
  throw new Error(`Invalid transaction status: ${status}`);
} 