import { useState, useEffect } from 'react';

interface Transaction {
  id: number;
  type: 'session_payment' | 'bundle_payment' | 'payout' | 'refund';
  status: 'completed' | 'pending' | 'failed' | 'refunded' | 'disputed';
  amount: number;
  currency: string;
  createdAt: string;
  metadata?: {
    sessionId?: number;
    bundleId?: number;
    payoutId?: number;
    refundReason?: string;
  };
  counterparty?: {
    name: string;
    role: 'coach' | 'mentee';
  };
}

interface PaginationData {
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

interface UseTransactionsProps {
  initialFilter?: string;
  limit?: number;
}

interface UseTransactionsReturn {
  transactions: Transaction[];
  isLoading: boolean;
  error: Error | null;
  filter: string;
  pagination: PaginationData;
  setFilter: (filter: string) => void;
  setPage: (page: number) => void;
  refresh: () => void;
}

export function useTransactions({
  initialFilter = 'all',
  limit = 10,
}: UseTransactionsProps = {}): UseTransactionsReturn {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filter, setFilter] = useState(initialFilter);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page: 1,
    totalPages: 1,
    hasMore: false,
  });

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const searchParams = new URLSearchParams({
        filter,
        page: page.toString(),
        limit: limit.toString(),
      });

      const response = await fetch(`/api/payments/transactions?${searchParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();
      setTransactions(data.transactions);
      setPagination(data.pagination);
    } catch (err) {
      console.error('[TRANSACTIONS_ERROR]', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch transactions'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [filter, page, limit]);

  const handleSetFilter = (newFilter: string) => {
    setFilter(newFilter);
    setPage(1); // Reset to first page when filter changes
  };

  const handleSetPage = (newPage: number) => {
    setPage(Math.max(1, Math.min(newPage, pagination.totalPages)));
  };

  return {
    transactions,
    isLoading,
    error,
    filter,
    pagination,
    setFilter: handleSetFilter,
    setPage: handleSetPage,
    refresh: fetchTransactions,
  };
} 