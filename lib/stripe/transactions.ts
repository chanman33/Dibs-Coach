import { createAuthClient } from '@/utils/auth/auth-client';
import { feeCalculator } from './fees';
import { randomUUID } from 'crypto';


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

    constructor() {
        // Use the cookie-free Supabase client - no need for cookies with Clerk auth
        this.supabase = createAuthClient();
    }

    /**
     * Initializes the TransactionService instance asynchronously.
     */
    static async init() {
        return new TransactionService();
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
                    ulid: randomUUID(),
                    type,
                    status: 'pending',
                    amount,
                    currency,
                    platformFee: fees.totalPlatformFee,
                    coachPayout: fees.coachPayout,
                    sessionUlid: sessionDbId ? sessionDbId.toString() : null,
                    payerUlid: payerDbId.toString(),
                    coachUlid: coachDbId.toString(),
                    updatedAt: new Date().toISOString(),
                    metadata: {
                        ...metadata,
                        bundleId: bundleDbId,
                        feeBreakdown: JSON.parse(JSON.stringify(fees)),
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
                metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
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
        payer:User!Transaction_payerUlid_fkey (
          firstName,
          lastName,
          email
        ),
        coach:User!Transaction_coachUlid_fkey (
          firstName,
          lastName,
          email
        )
      `)
            .eq(role === 'payer' ? 'payerUlid' : 'coachUlid', userDbId.toString())
            .order('createdAt', { ascending: false });

        if (error) {
            console.error('[TRANSACTION_FETCH_ERROR]', error);
            throw error;
        }

        return data;
    }
}

export const transactionServicePromise = TransactionService.init(); 