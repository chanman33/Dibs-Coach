"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  CalendarPlus, 
  Search, 
  Calendar, 
  Clock, 
  Check, 
  X, 
  FileEdit, 
  MoreHorizontal,
  PenSquare,
  FileText,
  BarChart3,
  CheckCircle,
  ClipboardList
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { DEFAULT_AVATARS } from "@/utils/constants"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Mock data for coaching sessions
const coachingSessions = [
  {
    id: 1,
    member: {
      name: "Sarah Johnson",
      avatar: DEFAULT_AVATARS.USER
    },
    topic: "Presentation Skills",
    date: "2023-05-15",
    time: "10:00 AM",
    duration: 60,
    status: "Completed",
    notes: "Reviewed presentation materials. Sarah showed great improvement in handling objections.",
  },
  {
    id: 2,
    member: {
      name: "Michael Rodriguez",
      avatar: DEFAULT_AVATARS.USER
    },
    topic: "Client Consultation",
    date: "2023-05-13",
    time: "2:00 PM",
    duration: 45,
    status: "Completed",
    notes: "Focused on qualifying clients and options. Michael needs more practice with first-time clients.",
  },
  {
    id: 3,
    member: {
      name: "Jennifer Lee",
      avatar: DEFAULT_AVATARS.USER
    },
    topic: "Commercial Negotiations",
    date: "2023-05-18",
    time: "11:30 AM",
    duration: 90,
    status: "Scheduled",
    notes: "",
  },
  {
    id: 4,
    member: {
      name: "David Wilson",
      avatar: DEFAULT_AVATARS.USER
    },
    topic: "Social Media Marketing",
    date: "2023-05-20",
    time: "3:30 PM",
    duration: 60,
    status: "Scheduled",
    notes: "",
  },
  {
    id: 5,
    member: {
      name: "Amanda Garcia",
      avatar: DEFAULT_AVATARS.USER
    },
    topic: "New Team Member Orientation",
    date: "2023-05-12",
    time: "9:00 AM",
    duration: 120,
    status: "Completed",
    notes: "Covered company policies, system access, and first-month goals. Amanda is eager to learn.",
  },
  {
    id: 6,
    member: {
      name: "Sarah Johnson",
      avatar: DEFAULT_AVATARS.USER
    },
    topic: "Goal Setting for Q2",
    date: "2023-05-22",
    time: "1:00 PM",
    duration: 60,
    status: "Scheduled",
    notes: "",
  }
]

export default function CoachingSessionsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  
  // Filter sessions based on search query and status filter
  const filteredSessions = coachingSessions.filter(session => {
    const matchesSearch = 
      session.member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.topic.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = 
      statusFilter === "all" || 
      session.status.toLowerCase() === statusFilter.toLowerCase()
    
    return matchesSearch && matchesStatus
  })

  // Separate upcoming and past sessions
  const upcomingSessions = filteredSessions.filter(session => 
    session.status === "Scheduled" && new Date(`${session.date} ${session.time}`) >= new Date()
  )
  
  const pastSessions = filteredSessions.filter(session => 
    session.status === "Completed" || new Date(`${session.date} ${session.time}`) < new Date()
  )

  // Format date in a more readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  return (
    <div className="flex flex-col p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Coaching Sessions</h1>
          <p className="text-muted-foreground">Schedule and manage coaching sessions with your team members</p>
        </div>
        <Button>
          <CalendarPlus className="mr-2 h-4 w-4" />
          Schedule Session
        </Button>
      </div>

      {/* Filters and actions */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by team member or topic..."
            className="pl-8"
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
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{coachingSessions.length}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((pastSessions.length / coachingSessions.length) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">Sessions completed as scheduled</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingSessions.length}</div>
            <p className="text-xs text-muted-foreground">Scheduled sessions</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Coaching Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {coachingSessions.reduce((total, session) => total + session.duration, 0) / 60}
            </div>
            <p className="text-xs text-muted-foreground">Total hours this month</p>
          </CardContent>
        </Card>
      </div>

      {/* Sessions Tabs */}
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="upcoming">Upcoming Sessions</TabsTrigger>
          <TabsTrigger value="past">Past Sessions</TabsTrigger>
        </TabsList>
        
        {/* Upcoming Sessions */}
        <TabsContent value="upcoming" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Upcoming Coaching Sessions</CardTitle>
              <CardDescription>
                {upcomingSessions.length} scheduled sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingSessions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Team Member</TableHead>
                      <TableHead>Topic</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcomingSessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={session.member.avatar} alt={session.member.name} />
                              <AvatarFallback>{session.member.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{session.member.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{session.topic}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <div className="flex items-center">
                              <Calendar className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                              <span>{formatDate(session.date)}</span>
                            </div>
                            <div className="flex items-center mt-1">
                              <Clock className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                              <span>{session.time}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{session.duration} min</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {session.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Calendar className="mr-2 h-4 w-4" />
                                <span>Reschedule</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <PenSquare className="mr-2 h-4 w-4" />
                                <span>Add Agenda</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                <span>Mark Complete</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <X className="mr-2 h-4 w-4" />
                                <span>Cancel</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No upcoming sessions found. Schedule a new session to get started.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Past Sessions */}
        <TabsContent value="past" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Past Coaching Sessions</CardTitle>
              <CardDescription>
                {pastSessions.length} completed sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pastSessions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Team Member</TableHead>
                      <TableHead>Topic</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pastSessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={session.member.avatar} alt={session.member.name} />
                              <AvatarFallback>{session.member.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{session.member.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{session.topic}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Calendar className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                            <span>{formatDate(session.date)}</span>
                          </div>
                        </TableCell>
                        <TableCell>{session.duration} min</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            {session.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <FileText className="mr-2 h-4 w-4" />
                                <span>View Notes</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <FileEdit className="mr-2 h-4 w-4" />
                                <span>Edit Notes</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <ClipboardList className="mr-2 h-4 w-4" />
                                <span>Action Items</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <BarChart3 className="mr-2 h-4 w-4" />
                                <span>Progress</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No past sessions found.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recent Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Session Notes</CardTitle>
          <CardDescription>
            Notes from your most recent coaching sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pastSessions
              .filter(session => session.notes)
              .slice(0, 3)
              .map((session) => (
                <div key={session.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={session.member.avatar} alt={session.member.name} />
                        <AvatarFallback>{session.member.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium">{session.member.name}</h4>
                        <p className="text-xs text-muted-foreground">{session.topic}</p>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(session.date)}
                    </div>
                  </div>
                  <p className="text-sm border-t pt-2 mt-2">{session.notes}</p>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 