'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowDownIcon, ArrowUpIcon, DollarSign } from 'lucide-react';

// Transaction types
const TRANSACTION_TYPES = ['session_payment', 'bundle_payment', 'payout', 'refund'] as const;
type TransactionType = typeof TRANSACTION_TYPES[number];

const TRANSACTION_STATUS = ['completed', 'pending', 'failed', 'refunded', 'disputed'] as const;
type TransactionStatus = typeof TRANSACTION_STATUS[number];

// Filter types
const FILTER_TYPES = ['all', 'completed', 'pending', 'failed', 'payouts', 'refunds'] as const;
type FilterType = typeof FILTER_TYPES[number];

interface Transaction {
  id: number;
  type: TransactionType;
  status: TransactionStatus;
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

interface TransactionHistoryProps {
  transactions: Transaction[];
  userRole: 'coach' | 'mentee';
  isLoading?: boolean;
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
    const isIncoming = 
      userRole === 'coach' 
        ? ['session_payment', 'bundle_payment'].includes(transaction.type)
        : transaction.type === 'refund';

    return (
      <div
        key={transaction.id}
        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-gray-100 rounded-full">
            {getTransactionIcon(transaction.type, isIncoming)}
          </div>
          <div>
            <p className="font-medium">
              {typeLabels[transaction.type]}
              {transaction.counterparty && (
                <span className="text-gray-500 ml-1">
                  with {transaction.counterparty.name}
                </span>
              )}
            </p>
            <p className="text-sm text-gray-500">
              {format(new Date(transaction.createdAt), 'MMM d, yyyy h:mm a')}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <p className={`font-medium ${isIncoming ? 'text-green-600' : 'text-red-600'}`}>
            {isIncoming ? '+' : '-'}{formatAmount(transaction.amount, transaction.currency)}
          </p>
          <Badge className={statusColors[transaction.status]}>
            {transaction.status}
          </Badge>
        </div>
      </div>
    );
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
              {userRole === 'coach' && (
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