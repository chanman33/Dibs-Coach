'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, DollarSign, Users, Clock } from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import { Loader2 } from 'lucide-react';

type AnalyticsData = {
  totalSessions: number;
  recentSessions: number;
  totalEarnings: number;
  recentEarningsTotal: number;
  uniqueMenteeCount: number;
}

export function CoachAnalyticsDashboard({ userDbId }: { userDbId: number }) {
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalSessions: 0,
    recentSessions: 0,
    totalEarnings: 0,
    recentEarningsTotal: 0,
    uniqueMenteeCount: 0,
  });

  useEffect(() => {
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

    fetchAnalytics();
  }, [userDbId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
      
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
            <p className="text-xs text-muted-foreground">
              {formatCurrency(analytics.recentEarningsTotal)} in last 30 days
            </p>
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
    </div>
  );
} 