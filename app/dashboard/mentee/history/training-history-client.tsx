"use client"

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Calendar,
  Clock,
  Filter,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Loader2
} from 'lucide-react'
import { fetchTrainingHistory } from '@/utils/actions/training'
import { format } from 'date-fns'
import { Suspense } from 'react'

export function TrainingHistoryClient() {
  const [history, setHistory] = useState<any[]>([])
  const [filteredHistory, setFilteredHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')
  const [refreshing, setRefreshing] = useState(false)

  const loadTrainingHistory = useCallback(async () => {
    try {
      setLoading(true)
      
      const result = await fetchTrainingHistory({})
      if (result.error) {
        console.error('[TRAINING_HISTORY_ERROR]', result.error)
        return
      }
      
      setHistory(result.data || [])
      setFilteredHistory(result.data || [])
    } catch (error) {
      console.error('[TRAINING_HISTORY_ERROR]', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTrainingHistory()
  }, [loadTrainingHistory])

  useEffect(() => {
    if (tab === 'all') {
      setFilteredHistory(history)
    } else if (tab === 'completed') {
      setFilteredHistory(history.filter(item => item.status === 'COMPLETED'))
    } else if (tab === 'in-progress') {
      setFilteredHistory(history.filter(item => item.status === 'IN_PROGRESS'))
    } else if (tab === 'pending') {
      setFilteredHistory(history.filter(item => item.status === 'PENDING'))
    }
  }, [tab, history])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadTrainingHistory()
    setRefreshing(false)
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'success'
      case 'IN_PROGRESS':
        return 'default'
      case 'PENDING':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Training History</h2>
        <Button 
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </>
          )}
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
        </TabsList>
        
        <TabsContent value={tab}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Training Sessions</CardTitle>
              <CardDescription>
                Your {tab === 'all' ? '' : tab + ' '} training sessions from the platform.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredHistory.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No Training History</h3>
                  <p className="text-muted-foreground mt-2">
                    No {tab === 'all' ? '' : tab + ' '} training sessions found in your history.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Training Module</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHistory.map((training, index) => (
                      <TableRow key={training.id || index}>
                        <TableCell className="font-medium">{training.module}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                            {format(new Date(training.date), 'MMM d, yyyy')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                            {training.duration} mins
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(training.status)}>
                            {training.status === 'COMPLETED' && (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            )}
                            {training.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function TrainingHistoryPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <TrainingHistoryClient />
    </Suspense>
  )
} 