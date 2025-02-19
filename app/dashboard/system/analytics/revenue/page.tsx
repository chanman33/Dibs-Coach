'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/ui/data-table';
import { BarChart, LineChart, DonutChart } from '@tremor/react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { 
  fetchRevenueOverview,
  fetchRevenueTrends,
  fetchTransactionDistribution,
  fetchCoachRevenues,
  fetchTransactionHistory,
  fetchPayoutHistory,
  type Transaction,
  type Payout,
  type CoachRevenue
} from '@/utils/actions/admin-revenue-actions';

interface RevenueOverview {
  totalRevenue: number;
  netRevenue: number;
  platformFees: number;
  coachPayouts: number;
  totalUsers: number;
  activeUsers: number;
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

interface PageData {
  overview: RevenueOverview | null;
  trends: RevenueTrend[];
  distribution: TransactionDistribution[];
  coachRankings: CoachRevenue[];
}

// Revenue Overview Card Component
const RevenueOverviewCard = ({ data }: { data: RevenueOverview | null }) => {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Overview</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Total Users</p>
          <p className="text-2xl font-bold">{data?.totalUsers?.toLocaleString() || '0'}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Active Users</p>
          <p className="text-2xl font-bold">{data?.activeUsers?.toLocaleString() || '0'}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Total Revenue</p>
          <p className="text-2xl font-bold">${data?.totalRevenue?.toFixed(2) || '0.00'}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Net Revenue</p>
          <p className="text-2xl font-bold">${data?.netRevenue?.toFixed(2) || '0.00'}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Platform Fees</p>
          <p className="text-2xl font-bold">${data?.platformFees?.toFixed(2) || '0.00'}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Coach Payouts</p>
          <p className="text-2xl font-bold">${data?.coachPayouts?.toFixed(2) || '0.00'}</p>
        </div>
      </div>
    </Card>
  );
};

// Revenue Trends Chart Component
const RevenueTrendsChart = ({ data }: { data: RevenueTrend[] }) => {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Revenue Trends</h3>
      <LineChart
        data={data}
        index="date"
        categories={["revenue", "platformFees", "coachPayouts"]}
        colors={["blue", "green", "orange"]}
        valueFormatter={(value: number) => `$${value.toFixed(2)}`}
        yAxisWidth={60}
      />
    </Card>
  );
};

// Transaction Distribution Chart Component
const TransactionDistributionChart = ({ data }: { data: TransactionDistribution[] }) => {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Transaction Distribution</h3>
      <DonutChart
        data={data}
        index="type"
        category="value"
        valueFormatter={(value: number) => `$${value.toFixed(2)}`}
        colors={["blue", "green", "orange", "red"]}
      />
    </Card>
  );
};

// Coach Revenue Rankings Component
const CoachRevenueRankings = ({ data }: { data: CoachRevenue[] }) => {
  const columns = [
    { accessorKey: "coach", header: "Coach" },
    { 
      accessorKey: "sessions", 
      header: "Total Sessions",
      cell: ({ row }: any) => row.original.sessions.toLocaleString()
    },
    { 
      accessorKey: "revenue", 
      header: "Total Revenue",
      cell: ({ row }: any) => `$${row.original.revenue.toFixed(2)}`
    },
    { 
      accessorKey: "avgRating", 
      header: "Avg. Rating",
      cell: ({ row }: any) => row.original.avgRating?.toFixed(1) || 'N/A'
    },
  ];

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Coach Revenue Rankings</h3>
      <DataTable columns={columns} data={data || []} />
    </Card>
  );
};

// Transaction History Table Component
const TransactionHistoryTable = ({ dateRange }: { dateRange: DateRange | undefined }) => {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ data: Transaction[]; total: number }>({ data: [], total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await fetchTransactionHistory({
          from: dateRange?.from,
          to: dateRange?.to,
          page,
          pageSize: 10
        });

        if (result.error) {
          toast({
            title: 'Error',
            description: result.error.message,
            variant: 'destructive'
          });
          return;
        }

        if (!result.data) {
          toast({
            title: 'Error',
            description: 'No data received from server',
            variant: 'destructive'
          });
          return;
        }

        setData(result.data);
      } catch (error) {
        console.error('[TRANSACTION_ERROR]', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch transactions',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange, page]);

  const columns = [
    { 
      accessorKey: "createdAt", 
      header: "Date",
      cell: ({ row }: any) => format(new Date(row.original.createdAt), 'MMM d, yyyy')
    },
    { 
      accessorKey: "type", 
      header: "Type",
      cell: ({ row }: any) => (
        <Badge variant={row.original.type === 'refund' ? 'destructive' : 'default'}>
          {row.original.type}
        </Badge>
      )
    },
    { 
      accessorKey: "payer", 
      header: "Payer",
      cell: ({ row }: any) => `${row.original.payer?.firstName || ''} ${row.original.payer?.lastName || ''}`.trim() || 'N/A'
    },
    { 
      accessorKey: "coach", 
      header: "Coach",
      cell: ({ row }: any) => `${row.original.coach?.firstName || ''} ${row.original.coach?.lastName || ''}`.trim() || 'N/A'
    },
    { 
      accessorKey: "amount", 
      header: "Amount",
      cell: ({ row }: any) => `$${row.original.amount.toFixed(2)}`
    },
    { 
      accessorKey: "platformFee", 
      header: "Platform Fee",
      cell: ({ row }: any) => `$${row.original.platformFee.toFixed(2)}`
    },
    { 
      accessorKey: "coachPayout", 
      header: "Coach Payout",
      cell: ({ row }: any) => `$${row.original.coachPayout.toFixed(2)}`
    },
    { 
      accessorKey: "status", 
      header: "Status",
      cell: ({ row }: any) => (
        <Badge variant={
          row.original.status === 'completed' ? 'default' :
          row.original.status === 'failed' ? 'destructive' :
          'secondary'
        }>
          {row.original.status}
        </Badge>
      )
    },
  ];

  return (
    <Card className="p-6">
      <DataTable 
        columns={columns} 
        data={data.data}
        searchKey="type"
      />
    </Card>
  );
};

// Payout History Table Component
const PayoutHistoryTable = ({ dateRange }: { dateRange: DateRange | undefined }) => {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ data: Payout[]; total: number }>({ data: [], total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await fetchPayoutHistory({
          from: dateRange?.from,
          to: dateRange?.to,
          page,
          pageSize: 10
        });

        if (result.error) {
          toast({
            title: 'Error',
            description: result.error.message,
            variant: 'destructive'
          });
          return;
        }

        if (!result.data) {
          toast({
            title: 'Error',
            description: 'No data received from server',
            variant: 'destructive'
          });
          return;
        }

        setData(result.data);
      } catch (error) {
        console.error('[PAYOUT_ERROR]', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch payouts',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange, page]);

  const columns = [
    { 
      accessorKey: "scheduledDate", 
      header: "Scheduled Date",
      cell: ({ row }: any) => format(new Date(row.original.scheduledDate), 'MMM d, yyyy')
    },
    { 
      accessorKey: "coach", 
      header: "Coach",
      cell: ({ row }: any) => `${row.original.coach?.firstName || ''} ${row.original.coach?.lastName || ''}`.trim() || 'N/A'
    },
    { 
      accessorKey: "amount", 
      header: "Amount",
      cell: ({ row }: any) => `${row.original.currency} ${row.original.amount.toFixed(2)}`
    },
    { 
      accessorKey: "status", 
      header: "Status",
      cell: ({ row }: any) => (
        <Badge variant={
          row.original.status === 'processed' ? 'default' :
          row.original.status === 'failed' ? 'destructive' :
          'secondary'
        }>
          {row.original.status}
        </Badge>
      )
    },
    { 
      accessorKey: "processedAt", 
      header: "Processed Date",
      cell: ({ row }: any) => row.original.processedAt ? format(new Date(row.original.processedAt), 'MMM d, yyyy') : 'Pending'
    },
  ];

  return (
    <Card className="p-6">
      <DataTable 
        columns={columns} 
        data={data.data}
        searchKey="status"
      />
    </Card>
  );
};

// Main Revenue Analytics Page
export default function RevenueAnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [timeframe, setTimeframe] = useState("monthly");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PageData>({
    overview: null,
    trends: [],
    distribution: [],
    coachRankings: []
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [overview, trends, distribution, coachRevenues] = await Promise.all([
          fetchRevenueOverview({
            from: dateRange?.from,
            to: dateRange?.to
          }),
          fetchRevenueTrends({
            timeframe: timeframe as 'daily' | 'weekly' | 'monthly' | 'yearly',
            from: dateRange?.from,
            to: dateRange?.to
          }),
          fetchTransactionDistribution({
            from: dateRange?.from,
            to: dateRange?.to
          }),
          fetchCoachRevenues({
            from: dateRange?.from,
            to: dateRange?.to
          })
        ]);

        if (overview.error) throw new Error(overview.error.message);
        if (trends.error) throw new Error(trends.error.message);
        if (distribution.error) throw new Error(distribution.error.message);
        if (coachRevenues.error) throw new Error(coachRevenues.error.message);

        setData({
          overview: overview.data,
          trends: trends.data || [],
          distribution: distribution.data || [],
          coachRankings: coachRevenues.data || []
        });
      } catch (error) {
        console.error('[REVENUE_ERROR]', error);
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to load revenue data',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange, timeframe]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Revenue Analytics</h2>
        <div className="flex gap-4">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <RevenueOverviewCard data={data.overview} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RevenueTrendsChart data={data.trends} />
        <TransactionDistributionChart data={data.distribution} />
      </div>

      <Tabs defaultValue="rankings" className="w-full">
        <TabsList>
          <TabsTrigger value="rankings">Coach Rankings</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
        </TabsList>
        <TabsContent value="rankings">
          <CoachRevenueRankings data={data.coachRankings} />
        </TabsContent>
        <TabsContent value="transactions">
          <TransactionHistoryTable dateRange={dateRange} />
        </TabsContent>
        <TabsContent value="payouts">
          <PayoutHistoryTable dateRange={dateRange} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
