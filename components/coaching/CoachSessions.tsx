import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Badge } from '@/components/ui/badge'
import { VirtualizedList } from '../ui/virtualized-list'
import moment from 'moment'
import Link from 'next/link'

interface ExtendedSession {
  ulid: string
  startTime: string
  endTime: string
  durationMinutes: number
  status: string
  userRole: string
  otherParty: {
    ulid: string
    firstName: string | null
    lastName: string | null
    email: string | null
    imageUrl: string | null
  }
}

interface CoachSessionsProps {
  sessions: ExtendedSession[] | undefined
  isLoading?: boolean
}

// Helper to get badge color based on session status
const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'scheduled':
      return 'bg-blue-500'
    case 'completed':
      return 'bg-green-500'
    case 'cancelled':
      return 'bg-red-500'
    case 'no_show':
      return 'bg-yellow-500'
    default:
      return 'bg-gray-500'
  }
}

// Helper to format status text
const formatStatusText = (status: string) => {
  switch (status.toLowerCase()) {
    case 'no_show':
      return 'No Show'
    default:
      return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
  }
}

// Session Card component
const SessionCard = ({ session }: { session: ExtendedSession }) => {
  return (
    <div className="p-2 border rounded-lg">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <p className="font-medium">
            {session.otherParty.firstName} {session.otherParty.lastName}
          </p>
          <Badge className={getStatusColor(session.status)}>
            {formatStatusText(session.status)}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{moment(session.startTime).format('MMM D, h:mm A')}</span>
          <span>·</span>
          <span>{session.durationMinutes}m</span>
        </div>
      </div>
    </div>
  )
}

// No Sessions CTA component
const NoSessionsCTA = () => {
  return (
    <div className="flex flex-col items-center justify-center text-center space-y-3 py-6">
      <h3 className="text-base font-semibold text-muted-foreground">No Sessions Booked</h3>
      <p className="text-sm text-muted-foreground max-w-[250px]">
        You currently have no coaching sessions scheduled. Check your calendar availability to accept more sessions.
      </p>
      <Link href="/dashboard/coach/availability">
        <Button variant="outline" size="sm" className="mt-2">
          Manage Availability
        </Button>
      </Link>
    </div>
  )
}

export function CoachSessions({ sessions, isLoading }: CoachSessionsProps) {
  const [page, setPage] = useState(1)
  const itemsPerPage = 10

  // Sort sessions by start time
  const sortedSessions = sessions?.sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  ) || []
  
  const totalPages = Math.ceil((sortedSessions.length || 0) / itemsPerPage)
  const paginatedSessions = sortedSessions.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  )

  return (
    <Card className="flex flex-col overflow-hidden">
      <h2 className="text-base sm:text-lg font-semibold p-4">All Sessions</h2>
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full">
          {sessions && sessions.length > 0 ? (
            <div className="px-4">
              <VirtualizedList
                items={paginatedSessions}
                height={500}
                itemHeight={80}
                renderItem={(session) => (
                  <div key={session.ulid} className="mb-2">
                    <SessionCard session={session} />
                  </div>
                )}
              />
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 py-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <NoSessionsCTA />
          )}
        </ScrollArea>
      </div>
    </Card>
  )
} 