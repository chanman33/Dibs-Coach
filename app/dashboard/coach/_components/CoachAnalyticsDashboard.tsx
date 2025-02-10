'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, DollarSign, Users, Clock, ArrowUpRight, Wallet, PiggyBank, Calendar, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from 'date-fns';
import { TransactionHistory } from '@/components/payments/TransactionHistory';
import { useTransactions } from '@/utils/hooks/useTransactions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type Payment = {
  id: number;
  amount: number;
  status: string;
  createdAt: string;
  sessionType?: string;
}

type AnalyticsData = {
  totalSessions: number;
  recentSessions: number;
  totalEarnings: number;
  recentEarningsTotal: number;
  uniqueMenteeCount: number;
  recentPayments: Payment[];
  pendingPayments: Payment[];
  pendingBalance: number;  // Booked but not completed
  availableBalance: number;  // Completed but not paid out
  nextPayoutAmount: number;  // Amount for next weekly payout
  nextPayoutDate: string;  // Date of next payout
}

export function CoachAnalyticsDashboard({ userDbId }: { userDbId: number }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isRequestingPayout, setIsRequestingPayout] = useState(false);
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalSessions: 0,
    recentSessions: 0,
    totalEarnings: 0,
    recentEarningsTotal: 0,
    uniqueMenteeCount: 0,
    recentPayments: [],
    pendingPayments: [],
    pendingBalance: 0,
    availableBalance: 0,
    nextPayoutAmount: 0,
    nextPayoutDate: '',
  });
  const { transactions, isLoading: isLoadingTransactions } = useTransactions();

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`${window.location.origin}/api/user/coach/analytics?userDbId=${userDbId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('[ANALYTICS_FETCH_ERROR]', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [userDbId]);

  const handleEarlyPayout = async () => {
    if (analytics.availableBalance <= 0) {
      toast({
        title: "No funds available",
        description: "You don't have any completed sessions to pay out yet.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsRequestingPayout(true);
      const response = await fetch(`${window.location.origin}/api/user/coach/payout/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userDbId,
          amount: analytics.availableBalance,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to request payout');
      }

      toast({
        title: "Payout requested",
        description: "Your early payout request has been submitted. Funds will be sent within 1-2 business days.",
      });

      // Refresh analytics to update balances
      fetchAnalytics();
    } catch (error) {
      console.error('[PAYOUT_REQUEST_ERROR]', error);
      toast({
        title: "Payout request failed",
        description: "There was an error requesting your payout. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsRequestingPayout(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Finance & Analytics Dashboard</h2>
        <p className="text-muted-foreground">Track your earnings, sessions, and financial metrics</p>
      </div>
      
      {/* Balance Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Balance</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.pendingBalance)}</div>
            <p className="text-xs text-muted-foreground">
              From booked, upcoming sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.availableBalance)}</div>
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground">
                From completed sessions
              </p>
              {analytics.availableBalance > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleEarlyPayout}
                  disabled={isRequestingPayout}
                  className="w-full"
                >
                  {isRequestingPayout ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Requesting...
                    </>
                  ) : (
                    'Request Early Payout'
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Payout</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.nextPayoutAmount)}</div>
            <div className="flex flex-col gap-1">
              <p className="text-xs text-muted-foreground">
                Scheduled for {format(new Date(analytics.nextPayoutDate), 'EEEE, MMM d')}
              </p>
              <p className="text-xs text-muted-foreground">
                Bi-weekly payouts every other Friday
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalSessions}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.recentSessions} in last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.totalEarnings)}</div>
            <div className="flex items-center text-xs text-green-500">
              <ArrowUpRight className="h-4 w-4 mr-1" />
              {formatCurrency(analytics.recentEarningsTotal)} in last 30 days
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Mentees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.uniqueMenteeCount}</div>
            <p className="text-xs text-muted-foreground">
              Total mentees coached
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Session Value</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.totalSessions > 0
                ? formatCurrency(analytics.totalEarnings / analytics.totalSessions)
                : '$0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Per completed session
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payment History */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Payouts</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.recentPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{format(new Date(payment.createdAt), 'MMM d, yyyy')}</TableCell>
                    <TableCell>{payment.sessionType || 'Weekly Payout'}</TableCell>
                    <TableCell className="text-right">{formatCurrency(payment.amount)}</TableCell>
                  </TableRow>
                ))}
                {analytics.recentPayments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      No recent payouts
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.pendingPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{format(new Date(payment.createdAt), 'MMM d, yyyy')}</TableCell>
                    <TableCell>{payment.sessionType || 'Coaching Session'}</TableCell>
                    <TableCell className="text-right">{formatCurrency(payment.amount)}</TableCell>
                  </TableRow>
                ))}
                {analytics.pendingPayments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      No upcoming sessions
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="earnings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="earnings" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Available Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(analytics.availableBalance)}
                </div>
                <p className="text-sm text-muted-foreground">
                  Ready for next payout
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pending Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(analytics.pendingBalance)}
                </div>
                <p className="text-sm text-muted-foreground">
                  From upcoming sessions
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions">
          <TransactionHistory
            transactions={transactions}
            userRole="COACH"
            isLoading={isLoadingTransactions}
          />
        </TabsContent>

      </Tabs>
    </div>
  );
} 