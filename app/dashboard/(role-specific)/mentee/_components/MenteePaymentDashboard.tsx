'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TransactionHistory } from '@/components/payments/TransactionHistory';
import { PaymentMethodManagerWrapper } from '@/components/payments/PaymentMethodManager';
import { useTransactions } from '@/hooks/use-transactions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { DollarSign, CreditCard, Calendar } from 'lucide-react';

interface MenteePaymentDashboardProps {
  userDbId: number;
}

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

export function MenteePaymentDashboard({ userDbId }: MenteePaymentDashboardProps) {
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [setupIntent, setSetupIntent] = useState<string | null>(null);
  const { transactions, isLoading: isLoadingTransactions } = useTransactions();
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/user/mentee/payment-stats?userDbId=${userDbId}`);
        if (!response.ok) throw new Error('Failed to fetch payment stats');
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('[PAYMENT_STATS_ERROR]', error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchPaymentMethods = async () => {
      try {
        const response = await fetch('/api/payments/methods');
        if (!response.ok) throw new Error('Failed to fetch payment methods');
        const data = await response.json();
        setPaymentMethods(data);
      } catch (error) {
        console.error('[PAYMENT_METHODS_ERROR]', error);
      }
    };

    fetchStats();
    fetchPaymentMethods();
  }, [userDbId]);

  const createSetupIntent = async () => {
    try {
      const response = await fetch('/api/payments/methods', {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to create setup intent');
      const data = await response.json();
      setSetupIntent(data.clientSecret);
    } catch (error) {
      console.error('[SETUP_INTENT_ERROR]', error);
    }
  };

  const handlePaymentMethodAdded = async () => {
    setSetupIntent(null);
    const response = await fetch('/api/payments/methods');
    if (response.ok) {
      const data = await response.json();
      setPaymentMethods(data);
    }
  };

  const handlePaymentMethodRemoved = async (id: string) => {
    const response = await fetch('/api/payments/methods');
    if (response.ok) {
      const data = await response.json();
      setPaymentMethods(data);
    }
  };

  const handleDefaultChanged = async (id: string) => {
    const response = await fetch('/api/payments/methods');
    if (response.ok) {
      const data = await response.json();
      setPaymentMethods(data);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalSpent.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              ${stats.recentSpent.toLocaleString()} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSessions}</div>
            <p className="text-xs text-muted-foreground">
              {stats.upcomingSessions} upcoming sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment Method</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {stats.defaultPaymentMethod ? (
              <>
                <div className="text-2xl font-bold">
                  •••• {stats.defaultPaymentMethod.last4}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.defaultPaymentMethod.brand}
                </p>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">
                No default payment method
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="history" className="space-y-4">
        <TabsList>
          <TabsTrigger value="history">Payment History</TabsTrigger>
          <TabsTrigger value="methods">Payment Methods</TabsTrigger>
        </TabsList>

        <TabsContent value="history">
          <TransactionHistory
            transactions={transactions}
            userRole="mentee"
            isLoading={isLoadingTransactions}
          />
        </TabsContent>

        <TabsContent value="methods">
          {setupIntent ? (
            <PaymentMethodManagerWrapper
              clientSecret={setupIntent}
              paymentMethods={paymentMethods}
              onPaymentMethodAdded={handlePaymentMethodAdded}
              onPaymentMethodRemoved={handlePaymentMethodRemoved}
              onDefaultChanged={handleDefaultChanged}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>
                  Manage your saved payment methods
                </CardDescription>
              </CardHeader>
              <CardContent>
                <button
                  onClick={createSetupIntent}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                >
                  Add Payment Method
                </button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 