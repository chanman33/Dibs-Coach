import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { feeCalculator } from './fees';


interface CreateTransactionParams {
    type: 'session_payment' | 'bundle_payment' | 'payout' | 'refund';
    amount: number;
    currency: string;
    payerDbId: number;
    coachDbId: number;
    sessionDbId?: number;
    bundleDbId?: number;
    metadata?: Record<string, any>;
}

export class TransactionService {
    private supabase;

    // Make the constructor private to force usage of the async initializer.
    private constructor(supabase: ReturnType<typeof createServerClient>) {
        this.supabase = supabase;
    }

    /**
     * Initializes the TransactionService instance asynchronously.
     */
    static async init() {
        // Await cookies() to obtain the cookie store.
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_KEY!,
            {
                cookies: {
                    // Safe to call `.get()` now that cookieStore is resolved
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                },
            }
        );
        return new TransactionService(supabase);
    }

    async createTransaction({
        type,
        amount,
        currency,
        payerDbId,
        coachDbId,
        sessionDbId,
        bundleDbId,
        metadata = {},
    }: CreateTransactionParams) {
        const fees = feeCalculator.calculateFees(amount);

        const { data, error } = await this.supabase
            .from('Transaction')
            .insert([
                {
                    type,
                    status: 'pending',
                    amount,
                    currency,
                    platformFee: fees.totalPlatformFee,
                    coachPayout: fees.coachPayout,
                    sessionDbId,
                    bundleDbId,
                    payerDbId,
                    coachDbId,
                    metadata: {
                        ...metadata,
                        feeBreakdown: fees,
                    },
                },
            ])
            .select()
            .single();

        if (error) {
            console.error('[TRANSACTION_ERROR]', error);
            throw error;
        }

        return data;
    }

    async updateTransactionStatus(id: number, status: string, metadata?: Record<string, any>) {
        const { error } = await this.supabase
            .from('Transaction')
            .update({
                status,
                metadata: metadata ? { ...metadata } : undefined,
                updatedAt: new Date().toISOString(),
            })
            .eq('id', id);

        if (error) {
            console.error('[TRANSACTION_UPDATE_ERROR]', error);
            throw error;
        }
    }

    async getTransactionsByUser(userDbId: number, role: 'payer' | 'coach') {
        const { data, error } = await this.supabase
            .from('Transaction')
            .select(`
        *,
        payer:User!Transaction_payerDbId_fkey (
          firstName,
          lastName,
          email
        ),
        coach:User!Transaction_coachDbId_fkey (
          firstName,
          lastName,
          email
        )
      `)
            .eq(role === 'payer' ? 'payerDbId' : 'coachDbId', userDbId)
            .order('createdAt', { ascending: false });

        if (error) {
            console.error('[TRANSACTION_FETCH_ERROR]', error);
            throw error;
        }

        return data;
    }
}

export const transactionServicePromise = TransactionService.init(); 