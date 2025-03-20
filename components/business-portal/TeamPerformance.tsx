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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AlertCircle, UserX } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { fetchTeamPerformance } from '@/utils/actions/business-dashboard-actions'

export function TeamPerformance() {
  const [teamData, setTeamData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  const getTeamPerformance = async () => {
    console.log('Fetching team performance data...')
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetchTeamPerformance({})
      console.log('Team performance response:', response)
      
      if (response.error) {
        // Handle different error types
        if (response.error.code === 'NOT_FOUND') {
          setError('No organization data found. Please ensure you are part of an organization.')
        } else {
          setError(response.error.message || 'Failed to load team performance data')
        }
        setTeamData([])
      } else {
        setTeamData(response.data || [])
      }
    } catch (err) {
      console.error('Error fetching team performance data:', err)
      setError('An unexpected error occurred while loading team performance data')
      setTeamData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getTeamPerformance()
  }, [retryCount])

  const handleRetry = () => {
    setRetryCount(prevCount => prevCount + 1)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-[200px]" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-[300px]" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-3 w-[100px]" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
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
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-2 text-xs opacity-80">
              Development info: Check the console for more details.
            </div>
          )}
        </AlertDescription>
      </Alert>
    )
  }

  if (!teamData || teamData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Performance</CardTitle>
          <CardDescription>
            No team performance data available
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center pt-6 pb-8">
          <div className="flex flex-col items-center justify-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <UserX className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No Coaching Activity Found</h3>
            <p className="text-sm text-muted-foreground max-w-md mb-6">
              Your team doesn't have any coaching activity yet. This could be because:
            </p>
            <ul className="text-sm text-muted-foreground list-disc text-left mb-6">
              <li className="mb-1">No coaches are assigned to your organization</li>
              <li className="mb-1">Your coaches haven't conducted any sessions</li>
              <li className="mb-1">Your organization is new to the platform</li>
            </ul>
            <Button size="sm" onClick={handleRetry} variant="outline">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Performance</CardTitle>
        <CardDescription>Top performing team members this quarter</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Coach</TableHead>
              <TableHead className="text-right">Sessions</TableHead>
              <TableHead className="text-right">Rating</TableHead>
              <TableHead className="text-right">Client Growth</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teamData.map((coach) => (
              <TableRow key={coach.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={coach.avatar} alt={coach.name} />
                      <AvatarFallback>
                        {coach.name.split(' ').map((n: string) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    {coach.name}
                  </div>
                </TableCell>
                <TableCell className="text-right">{coach.sessions}</TableCell>
                <TableCell className="text-right">
                  <span className="flex items-center justify-end">
                    {coach.ratings}
                    <Badge 
                      variant="outline" 
                      className={`ml-2 ${
                        coach.ratings >= 4.8 
                          ? 'bg-green-50 text-green-700 border-green-200' 
                          : coach.ratings >= 4.5 
                            ? 'bg-blue-50 text-blue-700 border-blue-200' 
                            : 'bg-gray-50 text-gray-700 border-gray-200'
                      }`}
                    >
                      {coach.ratings >= 4.8 ? 'Excellent' : coach.ratings >= 4.5 ? 'Good' : 'Average'}
                    </Badge>
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <span className={coach.clientGrowth > 0 ? 'text-green-600' : 'text-red-600'}>
                    {coach.clientGrowth > 0 ? '+' : ''}{coach.clientGrowth}%
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
} 