'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowDownIcon, ArrowUpIcon, DollarSign } from 'lucide-react';
import type { Transaction } from '@/utils/types/stripe';

// Transaction types
const TRANSACTION_TYPES = ['session_payment', 'bundle_payment', 'payout', 'refund'] as const;
type TransactionType = typeof TRANSACTION_TYPES[number];

const TRANSACTION_STATUS = ['completed', 'pending', 'failed', 'refunded', 'disputed'] as const;
type TransactionStatus = typeof TRANSACTION_STATUS[number];

// Filter types
const FILTER_TYPES = ['all', 'completed', 'pending', 'failed', 'refunded'] as const;
type FilterType = typeof FILTER_TYPES[number];

interface TransactionHistoryProps {
  transactions: Transaction[];
  userRole: 'COACH' | 'MENTEE';
  isLoading: boolean;
  onFilterChange?: (filter: FilterType) => void;
}

interface LoadingState {
  isLoading: boolean;
  error: Error | null;
}

const statusColors: Record<TransactionStatus, string> = {
  completed: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
  disputed: 'bg-orange-100 text-orange-800',
};

const typeLabels: Record<TransactionType, string> = {
  session_payment: 'Session Payment',
  bundle_payment: 'Bundle Payment',
  payout: 'Payout',
  refund: 'Refund',
};

export function TransactionHistory({
  transactions,
  userRole,
  isLoading = false,
  onFilterChange,
}: TransactionHistoryProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    error: null,
  });

  const handleFilterChange = (value: string) => {
    if (FILTER_TYPES.includes(value as FilterType)) {
      setFilter(value as FilterType);
      onFilterChange?.(value as FilterType);
    }
  };

  const getTransactionIcon = (type: TransactionType, isIncoming: boolean) => {
    if (type === 'payout') return <ArrowUpIcon className="w-4 h-4 text-red-500" />;
    if (type === 'refund') return <ArrowDownIcon className="w-4 h-4 text-orange-500" />;
    return isIncoming ? (
      <ArrowDownIcon className="w-4 h-4 text-green-500" />
    ) : (
      <ArrowUpIcon className="w-4 h-4 text-red-500" />
    );
  };

  const formatAmount = (amount: number, currency: string) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency.toUpperCase(),
      }).format(Math.abs(amount));
    } catch (error) {
      console.error('[FORMAT_ERROR]', error);
      return `${currency.toUpperCase()} ${Math.abs(amount).toFixed(2)}`;
    }
  };

  const renderTransactionItem = (transaction: Transaction) => {
    const isIncoming = userRole === 'COACH' && transaction.type === 'session_payment';
    

    return (
      <div key={transaction.metadata?.id} className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <div className={`p-2 rounded-full ${isIncoming ? 'bg-green-100' : 'bg-red-100'}`}>
            {isIncoming ? (
              <ArrowDownIcon className="h-4 w-4 text-green-600" />
            ) : (
              <ArrowUpIcon className="h-4 w-4 text-red-600" />
            )}
          </div>
          <div>
            <p className="font-medium">
              {transaction.type === 'session_payment' ? 'Session Payment' : 'Subscription Payment'}
            </p>
            <p className="text-sm text-muted-foreground">
              {transaction.metadata?.date ? format(new Date(transaction.metadata.date), 'MMM d, yyyy') : 'N/A'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="font-medium">
              {isIncoming ? '+' : '-'}{transaction.amount} {transaction.currency}
            </p>
            <Badge variant={getStatusVariant(transaction.status)}>
              {transaction.status}
            </Badge>
          </div>
        </div>
      </div>
    );
  };

  const getStatusVariant = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'failed':
        return 'destructive';
      case 'refunded':
        return 'outline';
      default:
        return 'default';
    }
  };

  if (loadingState.error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-red-500">
            <p>Failed to load transactions</p>
            <p className="text-sm">{loadingState.error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>
              View your payment history and transaction details
            </CardDescription>
          </div>
          <Select value={filter} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter transactions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Transactions</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              {userRole === 'COACH' && (
                <SelectItem value="payouts">Payouts</SelectItem>
              )}


              <SelectItem value="refunds">Refunds</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No transactions found
            </div>
          ) : (
            transactions.map(renderTransactionItem)
          )}
        </div>
      </CardContent>
    </Card>
  );
} 