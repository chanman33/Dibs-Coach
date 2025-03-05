'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CalendarDays, Clock, Search, Star, UserCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/components/ui/use-toast'
import type { TrainingSession } from '@/utils/actions/training'
import { WithAuth } from '@/components/auth/with-auth'

interface TrainingHistoryClientProps {
  initialData: {
    sessions: TrainingSession[]
  }
}

function TrainingHistoryClient({ initialData }: TrainingHistoryClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredSessions = initialData.sessions.filter(session => {
    const matchesSearch = searchQuery === '' || 
      session.coach.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (session.notes?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (session.topics?.some((topic: string) => topic.toLowerCase().includes(searchQuery.toLowerCase())))

    const matchesStatus = statusFilter === 'all' || session.status.toLowerCase() === statusFilter.toLowerCase()

    return matchesSearch && matchesStatus
  })

  const getBadgeVariant = (status: TrainingSession['status']) => {
    switch (status) {
      case 'COMPLETED':
        return 'secondary' as const
      case 'CANCELLED':
        return 'destructive' as const
      default:
        return 'default' as const
    }
  }

  if (!initialData.sessions.length) {
    return (
      <div className="container max-w-5xl py-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Training History</h1>
          <p className="text-muted-foreground mt-2">
            View and manage your past training sessions
          </p>
        </div>

        <Card className="mt-8 p-6">
          <div className="text-center py-8 space-y-4">
            <div className="flex justify-center">
              <CalendarDays className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No Training Sessions Yet</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              You haven't completed any training sessions yet. Book your first session to get started!
            </p>
            <Button 
              className="mt-4"
              onClick={() => {/* Handle booking */}}
            >
              Book Your First Session
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-5xl py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Training History</h1>
        <p className="text-muted-foreground mt-2">
          View and manage your past training sessions
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Search sessions..." 
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select 
          value={statusFilter} 
          onValueChange={setStatusFilter}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sessions</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="mt-6">
          <div className="space-y-4">
            {filteredSessions.map((session) => (
              <Card key={session.ulid} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <UserCircle className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">{session.coach.name}</h3>
                      <Badge variant={getBadgeVariant(session.status)}>
                        {session.status}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">{session.notes}</p>
                    
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        <span>{format(new Date(session.startTime), 'PPP')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{session.duration} minutes</span>
                      </div>
                      {session.rating && (
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-yellow-400" />
                          <span>{session.rating}/5</span>
                        </div>
                      )}
                    </div>

                    {session.topics && (
                      <div className="flex flex-wrap gap-2">
                        {session.topics.map((topic: string) => (
                          <Badge key={topic} variant="outline">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {/* Handle booking follow-up */}}
                  >
                    Book Follow-up
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="calendar">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Calendar view coming soon</p>
          </div>
        </TabsContent>
        
        <TabsContent value="stats">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Statistics view coming soon</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default WithAuth(TrainingHistoryClient) 