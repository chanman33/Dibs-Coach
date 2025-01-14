'use client'

import * as React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'

interface SessionGuest {
  email: string
  first_name: string
  last_name: string
}

interface InviteeCounter {
  active: number
  limit: number
}

interface SessionDetails {
  uri: string
  name: string
  start_time: string
  end_time: string
  date: string
  status: string
  location: string
  invitees_counter: InviteeCounter
  event_guests: SessionGuest[]
}

interface SessionDetailsProps {
  sessionId: string
}

export function SessionDetails({ sessionId }: SessionDetailsProps) {
  const [session, setSession] = React.useState<SessionDetails | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function fetchSessionDetails() {
      try {
        setLoading(true)
        const response = await fetch(`/api/calendly/sessions/${sessionId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch session details')
        }
        const data = await response.json()
        setSession(data.session)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load session details')
      } finally {
        setLoading(false)
      }
    }

    fetchSessionDetails()
  }, [sessionId])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-4 w-[250px] mb-4" />
          <Skeleton className="h-4 w-[200px] mb-4" />
          <Skeleton className="h-4 w-[150px]" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-red-500">Error: {error}</div>
        </CardContent>
      </Card>
    )
  }

  if (!session) {
    return null
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{session.name}</h3>
            <Badge variant={session.status === 'active' ? 'default' : 'secondary'}>
              {session.status}
            </Badge>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-500">
              Date: {format(new Date(session.start_time), 'PPP')}
            </p>
            <p className="text-sm text-gray-500">
              Time: {format(new Date(session.start_time), 'p')} - {format(new Date(session.end_time), 'p')}
            </p>
            <p className="text-sm text-gray-500">
              Location: {session.location}
            </p>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm text-gray-500 mb-2">
              Invitees: {session.invitees_counter.active} / {session.invitees_counter.limit}
            </p>
            {session.event_guests.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Guests:</p>
                <ul className="space-y-1">
                  {session.event_guests.map((guest, index) => (
                    <li key={index} className="text-sm text-gray-500">
                      {guest.first_name} {guest.last_name} ({guest.email})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 