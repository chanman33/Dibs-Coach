"use client"

import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, ArrowUpRight, BarChart3, CircleSlash } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { fetchRecentCoachingSessions } from '@/utils/actions/business-portal/business-dashboard-actions'
import { RecentCoachingSession } from '@/utils/types/business'
import Link from 'next/link'

export function RecentCoachingSessions() {
  const [sessions, setSessions] = useState<RecentCoachingSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  const fetchSessions = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetchRecentCoachingSessions({})
      
      if (response.error) {
        if (response.error.code === 'NOT_FOUND') {
          setError('No organization data found. Please ensure you are part of an organization.')
        } else {
          setError(response.error.message || 'Failed to load recent coaching sessions')
        }
        setSessions([])
      } else {
        setSessions(response.data || [])
      }
    } catch (err) {
      console.error('Error fetching coaching sessions:', err)
      setError('An unexpected error occurred while loading coaching sessions')
      setSessions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSessions()
  }, [retryCount])

  const handleRetry = () => {
    setRetryCount(prevCount => prevCount + 1)
  }

  // Function to get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
  }

  // Display loading state
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center">
          <div className="grid gap-2">
            <CardTitle><Skeleton className="h-6 w-56" /></CardTitle>
            <div className="text-sm text-muted-foreground"><Skeleton className="h-4 w-32" /></div>
          </div>
          <Skeleton className="ml-auto h-8 w-24" />
        </CardHeader>
        <CardContent>
          <div style={{ maxHeight: "320px", overflowY: "auto" }}>
            <div className="space-y-4">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="flex items-center">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="ml-4 space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="ml-auto h-3 w-16" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Display error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Coaching Sessions</CardTitle>
          <CardDescription>Latest team coaching activity</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error}
              <div className="mt-4">
                <Button size="sm" onClick={handleRetry} variant="outline">
                  Retry
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  // Display empty state
  if (!sessions || sessions.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center">
          <div className="grid gap-2">
            <CardTitle>Recent Coaching Sessions</CardTitle>
            <CardDescription>Latest team coaching activity</CardDescription>
          </div>
          <Button asChild size="sm" className="ml-auto gap-1">
            <Link href="/dashboard/business/coaching/sessions">
              View All
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-muted p-3 mb-3">
              <BarChart3 className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-base font-medium mb-1">No Recent Sessions</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs">
              Your team's coaching sessions will appear here once they've been completed.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Display data state
  return (
    <Card>
      <CardHeader className="flex flex-row items-center">
        <div className="grid gap-2">
          <CardTitle>Recent Coaching Sessions</CardTitle>
          <CardDescription>Latest team coaching activity</CardDescription>
        </div>
        <Button asChild size="sm" className="ml-auto gap-1">
          <Link href="/dashboard/business/coaching/sessions">
            View All
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div style={{ maxHeight: "320px", overflowY: "auto" }}>
          <div className="space-y-4">
            {sessions.map((session) => (
              <div key={session.id} className="flex items-center">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={session.coachAvatar} alt={session.coachName} />
                  <AvatarFallback>{getInitials(session.coachName)}</AvatarFallback>
                </Avatar>
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">{session.coachName}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{session.sessionType}</span>
                    <span>•</span>
                    <span>{session.sessionDate}</span>
                  </div>
                </div>
                <div className="ml-auto text-xs text-muted-foreground capitalize">{session.status.toLowerCase()}</div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 