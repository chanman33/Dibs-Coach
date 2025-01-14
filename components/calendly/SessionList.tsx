'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import { format, parseISO, isPast } from 'date-fns'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'react-hot-toast'
import Link from 'next/link'

interface Session {
  uri: string
  name: string
  date: string
  start_time: string
  end_time: string
  start_time_formatted: string
  end_time_formatted: string
  status: 'active' | 'canceled'
}

interface Pagination {
  next_page: boolean
  next_page_token?: string
  previous_page_token?: string
}

type FilterOption = 'all' | 'active' | 'canceled' | 'asc' | 'desc'

const filterOptions = [
  { value: 'all', label: 'All Sessions' },
  { value: 'asc', label: 'Date Ascending' },
  { value: 'desc', label: 'Date Descending' },
  { value: 'active', label: 'Active Sessions' },
  { value: 'canceled', label: 'Canceled Sessions' },
]

export function SessionList() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [pageToken, setPageToken] = useState<string>()
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState<FilterOption>('all')
  const [cancelDialog, setCancelDialog] = useState(false)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [cancelReason, setCancelReason] = useState('')

  const fetchSessions = async (token?: string) => {
    try {
      setIsLoading(true)
      setError(undefined)

      const params = new URLSearchParams()
      if (token) {
        params.append('page_token', token)
      }
      
      if (filter === 'active' || filter === 'canceled') {
        params.append('status', filter)
      }
      if (filter === 'asc' || filter === 'desc') {
        params.append('sort', `start_time:${filter}`)
      }

      const response = await fetch(`/api/calendly/scheduled_events?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch sessions')
      }

      const data = await response.json()
      setSessions(data.events)
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions')
      toast.error('Failed to load sessions')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelSession = async () => {
    if (!selectedSession) return

    try {
      const uuid = selectedSession.uri.split('/')[4]
      const response = await fetch(`/api/calendly/cancel_event/${uuid}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: cancelReason }),
      })

      if (!response.ok) {
        throw new Error('Failed to cancel session')
      }

      toast.success('Session canceled successfully')
      setCancelDialog(false)
      setSelectedSession(null)
      setCancelReason('')
      fetchSessions(pageToken)
    } catch (err) {
      toast.error('Failed to cancel session')
    }
  }

  useEffect(() => {
    fetchSessions(pageToken)
  }, [pageToken, filter])

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Coaching Sessions</h2>
        <Select
          value={filter}
          onValueChange={(value) => {
            setFilter(value as FilterOption)
            setPage(1)
            setPageToken(undefined)
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter sessions" />
          </SelectTrigger>
          <SelectContent>
            {filterOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {sessions.length > 0 ? (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Session Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session) => {
                const startTime = parseISO(session.start_time)
                const endTime = parseISO(session.end_time)
                const canCancel = !isPast(startTime) && session.status === 'active'

                return (
                  <TableRow key={session.uri}>
                    <TableCell>
                      <Link 
                        href={`/sessions/${session.uri.split('/')[4]}`}
                        className="text-primary hover:underline"
                      >
                        {session.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {format(startTime, 'PPP')}
                    </TableCell>
                    <TableCell>
                      {format(startTime, 'p')} - {format(endTime, 'p')}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={session.status === 'active' ? 'default' : 'secondary'}
                      >
                        {session.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {canCancel && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setSelectedSession(session)
                            setCancelDialog(true)
                          }}
                        >
                          Cancel Session
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
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
                  setPageToken(pagination?.next_page_token)
                }}
              >
                Next
              </Button>
            )}
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          No sessions found
        </div>
      )}

      <Dialog open={cancelDialog} onOpenChange={setCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Coaching Session</DialogTitle>
            <DialogDescription>
              {selectedSession && (
                <div className="space-y-2 mt-2">
                  <p className="font-medium">{selectedSession.name}</p>
                  <p>{format(parseISO(selectedSession.start_time), 'PPP')}</p>
                  <p>
                    {format(parseISO(selectedSession.start_time), 'p')} - {' '}
                    {format(parseISO(selectedSession.end_time), 'p')}
                  </p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Cancellation Reason
              </label>
              <Textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please provide a reason for cancellation"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCancelDialog(false)
                setSelectedSession(null)
                setCancelReason('')
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelSession}
              disabled={!cancelReason.trim()}
            >
              Confirm Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 