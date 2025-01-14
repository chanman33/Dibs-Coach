'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'react-hot-toast'

interface InviteeQA {
  position: number
  question: string
  answer: string
}

interface Invitee {
  uri: string
  name: string
  email: string
  scheduled_at: string
  questions_and_answers: InviteeQA[]
  rescheduled: boolean
  timezone: string
  no_show: {
    uri: string
  } | null
}

interface Pagination {
  next_page: boolean
  next_page_token?: string
  previous_page_token?: string
}

interface InviteeListProps {
  eventUuid: string
  eventStartTime: string
  eventStatus: string
}

export function InviteeList({ eventUuid, eventStartTime, eventStatus }: InviteeListProps) {
  const [invitees, setInvitees] = useState<Invitee[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [pageToken, setPageToken] = useState<string>()
  const [page, setPage] = useState(1)

  const fetchInvitees = async (token?: string) => {
    try {
      setIsLoading(true)
      setError(undefined)

      const params = new URLSearchParams()
      if (token) {
        params.append('page_token', token)
      }

      const response = await fetch(`/api/calendly/events/${eventUuid}/invitees?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch invitees')
      }

      const data = await response.json()
      setInvitees(data.invitees)
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invitees')
      toast.error('Failed to load invitees')
    } finally {
      setIsLoading(false)
    }
  }

  const handleNoShow = async (inviteeUri: string) => {
    try {
      const response = await fetch('/api/calendly/no-shows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invitee: inviteeUri }),
      })

      if (!response.ok) {
        throw new Error('Failed to mark no-show')
      }

      toast.success('Marked as no-show')
      fetchInvitees(pageToken)
    } catch (err) {
      toast.error('Failed to mark no-show')
    }
  }

  const handleUndoNoShow = async (noShowUri: string) => {
    try {
      const response = await fetch(`/api/calendly/no-shows/${noShowUri.split('/')[4]}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to undo no-show')
      }

      toast.success('Removed no-show status')
      fetchInvitees(pageToken)
    } catch (err) {
      toast.error('Failed to undo no-show')
    }
  }

  useEffect(() => {
    fetchInvitees(pageToken)
  }, [pageToken])

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        {error}
      </div>
    )
  }

  const currentDate = Date.now()
  const eventDate = Date.parse(eventStartTime)
  const canMarkNoShow = currentDate > eventDate && eventStatus !== 'canceled'

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Scheduled At</TableHead>
            <TableHead>Questions & Answers</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Timezone</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invitees.map((invitee) => (
            <TableRow key={invitee.uri}>
              <TableCell>{invitee.name}</TableCell>
              <TableCell>{invitee.email}</TableCell>
              <TableCell>
                {format(new Date(invitee.scheduled_at), 'PPp')}
              </TableCell>
              <TableCell>
                {invitee.questions_and_answers?.length > 0 ? (
                  <div className="space-y-2">
                    {invitee.questions_and_answers.map((qa) => (
                      <div key={qa.position} className="text-sm">
                        <p className="font-medium">{qa.question}</p>
                        <p className="text-muted-foreground">{qa.answer}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-muted-foreground">N/A</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={invitee.rescheduled ? "secondary" : "default"}>
                  {invitee.rescheduled ? 'Rescheduled' : 'Original'}
                </Badge>
              </TableCell>
              <TableCell>{invitee.timezone}</TableCell>
              <TableCell>
                {canMarkNoShow && !invitee.no_show && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleNoShow(invitee.uri)}
                  >
                    Mark No-Show
                  </Button>
                )}
                {invitee.no_show && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUndoNoShow(invitee.no_show!.uri)}
                  >
                    Undo No-Show
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex justify-between">
        {page > 1 && (
          <Button
            variant="outline"
            onClick={() => {
              setPage(p => p - 1)
              setPageToken(pagination?.previous_page_token)
            }}
          >
            Previous
          </Button>
        )}
        {pagination?.next_page && (
          <Button
            variant="outline"
            onClick={() => {
              setPage(p => p + 1)
              setPageToken(pagination.next_page_token)
            }}
          >
            Next
          </Button>
        )}
      </div>
    </div>
  )
} 