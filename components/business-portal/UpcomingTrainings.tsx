"use client"

import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, ArrowUpRight, Calendar, GraduationCap, Target, HelpCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { fetchUpcomingTrainings } from '@/utils/actions/business-dashboard-actions'
import { UpcomingTraining } from '@/utils/types/business'
import Link from 'next/link'

export function UpcomingTrainings() {
  const [trainings, setTrainings] = useState<UpcomingTraining[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  const fetchTrainings = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetchUpcomingTrainings({})
      
      if (response.error) {
        if (response.error.code === 'NOT_FOUND') {
          setError('No organization data found. Please ensure you are part of an organization.')
        } else {
          setError(response.error.message || 'Failed to load upcoming trainings')
        }
        setTrainings([])
      } else {
        setTrainings(response.data || [])
      }
    } catch (err) {
      console.error('Error fetching upcoming trainings:', err)
      setError('An unexpected error occurred while loading training data')
      setTrainings([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTrainings()
  }, [retryCount])

  const handleRetry = () => {
    setRetryCount(prevCount => prevCount + 1)
  }

  // Get the appropriate icon based on training type
  const getTrainingIcon = (iconType: string) => {
    switch (iconType) {
      case 'graduation':
        return <GraduationCap className="h-5 w-5 text-blue-700" />
      case 'calendar':
        return <Calendar className="h-5 w-5 text-amber-700" />
      case 'target':
        return <Target className="h-5 w-5 text-green-700" />
      default:
        return <HelpCircle className="h-5 w-5 text-gray-700" />
    }
  }

  // Get background color based on icon type
  const getIconBackground = (iconType: string) => {
    switch (iconType) {
      case 'graduation':
        return 'bg-blue-100'
      case 'calendar':
        return 'bg-amber-100'
      case 'target':
        return 'bg-green-100'
      default:
        return 'bg-gray-100'
    }
  }

  // Display loading state
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center">
          <div className="grid gap-2">
            <CardTitle><Skeleton className="h-6 w-48" /></CardTitle>
            <div className="text-sm text-muted-foreground"><Skeleton className="h-4 w-32" /></div>
          </div>
          <Skeleton className="ml-auto h-8 w-24" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="flex items-center">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="ml-4 space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
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
          <CardTitle>Upcoming Training</CardTitle>
          <CardDescription>Scheduled sessions and deadlines</CardDescription>
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
  if (!trainings || trainings.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center">
          <div className="grid gap-2">
            <CardTitle>Upcoming Training</CardTitle>
            <CardDescription>Scheduled sessions and deadlines</CardDescription>
          </div>
          <Button asChild size="sm" className="ml-auto gap-1">
            <Link href="/dashboard/business/coaching/training">
              View All
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-muted p-3 mb-3">
              <GraduationCap className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-base font-medium mb-1">No Upcoming Training</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs">
              Your team's booked training sessions will appear here once they've been scheduled.
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
          <CardTitle>Upcoming Training</CardTitle>
          <CardDescription>Scheduled sessions and deadlines</CardDescription>
        </div>
        <Button asChild size="sm" className="ml-auto gap-1">
          <Link href="/dashboard/business/coaching/training">
            View All
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {trainings.map((training) => (
            <div key={training.id} className="flex items-center">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full ${getIconBackground(training.iconType)}`}>
                {getTrainingIcon(training.iconType)}
              </div>
              <div className="ml-4 space-y-1">
                <p className="text-sm font-medium">{training.title}</p>
                <p className="text-xs text-muted-foreground">
                  {training.date}{training.timeWithTZ ? `, ${training.timeWithTZ}` : ''} • {training.attendees} {training.attendees === 1 ? 'attendee' : 'attendees'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 