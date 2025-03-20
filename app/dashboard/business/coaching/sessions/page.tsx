"use client"

import { useState, useEffect } from "react"
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
  ClipboardList,
  CalendarClock,
  CalendarX,
  User
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import { CoachingStatsCards } from "../../../../../components/business-portal/coaching/coaching-stats-cards"
import { fetchOrganizationCoachingSessions, CoachingSession } from "@/utils/actions/business-portal/coaching-sessions"
import { useOrganization } from "@/utils/auth/OrganizationContext"
import { RecentSessionNotes } from "../_components/recent-session-notes"

export default function CoachingSessionsPage() {
  const { organizationUlid, isLoading: isOrgLoading } = useOrganization()
  const [sessions, setSessions] = useState<CoachingSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Session notes modal state
  const [selectedSession, setSelectedSession] = useState<CoachingSession | null>(null)
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false)
  
  // Recent notes pagination state
  const [currentNotesPage, setCurrentNotesPage] = useState(1)
  const notesPerPage = 5
  
  const openNotesModal = (session: CoachingSession) => {
    setSelectedSession(session)
    setIsNotesModalOpen(true)
  }
  
  const closeNotesModal = () => {
    setIsNotesModalOpen(false)
    // Clear the selected session after a brief delay to avoid UI flashes
    setTimeout(() => setSelectedSession(null), 200)
  }
  
  // Stats state
  const [stats, setStats] = useState({
    totalSessions: 0,
    completedSessions: 0,
    upcomingSessions: 0,
    totalHours: 0,
    completionRate: 0
  })

  // Fetch sessions on component mount
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setIsLoading(true)
        
        if (!organizationUlid) {
          console.error('[FETCH_SESSIONS_ERROR] No organization context found')
          setError('No organization context found')
          return
        }
        
        const result = await fetchOrganizationCoachingSessions(organizationUlid)
        
        if (result.error) {
          console.error('[FETCH_SESSIONS_ERROR]', result.error)
          setError(result.error.message)
          // For development, use mock data instead of empty data
          const mockSessions = generateMockSessions()
          
          // Debug log to see what sessions are being created
          console.log('[MOCK_SESSIONS]', {
            allSessions: mockSessions,
            upcoming: mockSessions.filter(s => s.status === 'SCHEDULED'),
            past: mockSessions.filter(s => s.status === 'COMPLETED')
          })
          
          setSessions(mockSessions)
          setStats({
            totalSessions: mockSessions.length,
            completedSessions: mockSessions.filter(s => s.status === 'COMPLETED').length,
            upcomingSessions: mockSessions.filter(s => s.status === 'SCHEDULED').length,
            totalHours: mockSessions.reduce((total, s) => total + s.duration, 0) / 60,
            completionRate: 75
          })
        } else if (result.data) {
          // If we have real data, use it
          if (result.data.sessions && result.data.sessions.length > 0) {
            setSessions(result.data.sessions)
            setStats(result.data.stats)
          } else {
            // For development when no real data exists, use mock data
            const mockSessions = generateMockSessions()
            
            // Debug log to see what sessions are being created
            console.log('[MOCK_SESSIONS]', {
              allSessions: mockSessions,
              upcoming: mockSessions.filter(s => s.status === 'SCHEDULED'),
              past: mockSessions.filter(s => s.status === 'COMPLETED')
            })
            
            setSessions(mockSessions)
            setStats({
              totalSessions: mockSessions.length,
              completedSessions: mockSessions.filter(s => s.status === 'COMPLETED').length,
              upcomingSessions: mockSessions.filter(s => s.status === 'SCHEDULED').length,
              totalHours: mockSessions.reduce((total, s) => total + s.duration, 0) / 60,
              completionRate: 75
            })
          }
        }
      } catch (err) {
        console.error('[FETCH_SESSIONS_ERROR]', err)
        setError('Failed to load coaching sessions')
        // For development, use mock data instead of empty data
        const mockSessions = generateMockSessions()
        setSessions(mockSessions)
        setStats({
          totalSessions: mockSessions.length,
          completedSessions: mockSessions.filter(s => s.status === 'COMPLETED').length,
          upcomingSessions: mockSessions.filter(s => s.status === 'SCHEDULED').length,
          totalHours: mockSessions.reduce((total, s) => total + s.duration, 0) / 60,
          completionRate: 75
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (!isOrgLoading && organizationUlid) {
      fetchSessions()
    }
  }, [organizationUlid, isOrgLoading])
  
  // Function to generate mock sessions data for development
  const generateMockSessions = (): CoachingSession[] => {
    const today = new Date()
    
    // Create dates for upcoming sessions
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)
    
    const twoWeeksFromNow = new Date(today)
    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14)
    
    const nextMonth = new Date(today)
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    
    // Create dates for past sessions
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    const lastWeek = new Date(today)
    lastWeek.setDate(lastWeek.getDate() - 7)
    
    const lastMonth = new Date(today)
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    
    return [
      // Upcoming sessions
      {
        id: "mock-session-1",
        memberId: "user-1",
        memberName: "Alex Johnson",
        memberAvatar: DEFAULT_AVATARS.USER,
        topic: "Q1 Performance Review",
        date: tomorrow.toISOString().split('T')[0],
        time: "10:00 AM",
        duration: 60,
        status: "SCHEDULED",
        notes: null,
        organizationId: organizationUlid || "org1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: "mock-session-2",
        memberId: "user-2",
        memberName: "Sam Williams",
        memberAvatar: DEFAULT_AVATARS.USER,
        topic: "Career Development Planning",
        date: nextWeek.toISOString().split('T')[0],
        time: "02:30 PM",
        duration: 45,
        status: "SCHEDULED",
        notes: null,
        organizationId: organizationUlid || "org1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: "mock-session-6",
        memberId: "user-6",
        memberName: "Morgan Lewis",
        memberAvatar: DEFAULT_AVATARS.USER,
        topic: "Presentation Skills Workshop",
        date: twoWeeksFromNow.toISOString().split('T')[0],
        time: "11:15 AM",
        duration: 90,
        status: "SCHEDULED",
        notes: null,
        organizationId: organizationUlid || "org1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: "mock-session-7",
        memberId: "user-7",
        memberName: "Riley Chen",
        memberAvatar: DEFAULT_AVATARS.USER,
        topic: "Quarterly Team Alignment",
        date: nextMonth.toISOString().split('T')[0],
        time: "09:00 AM",
        duration: 120,
        status: "SCHEDULED",
        notes: null,
        organizationId: organizationUlid || "org1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      // Completed sessions
      {
        id: "mock-session-3",
        memberId: "user-3",
        memberName: "Jamie Smith",
        memberAvatar: DEFAULT_AVATARS.USER,
        topic: "Goal Setting Workshop",
        date: yesterday.toISOString().split('T')[0],
        time: "09:15 AM",
        duration: 90,
        status: "COMPLETED",
        notes: "Jamie demonstrated great enthusiasm for setting ambitious quarterly goals. We worked on breaking down larger objectives into manageable weekly tasks. Key focus areas include improving technical documentation and mentoring junior team members.",
        organizationId: organizationUlid || "org1",
        createdAt: lastMonth.toISOString(),
        updatedAt: yesterday.toISOString()
      },
      {
        id: "mock-session-4",
        memberId: "user-4",
        memberName: "Taylor Wong",
        memberAvatar: DEFAULT_AVATARS.USER,
        topic: "Productivity Strategies",
        date: lastWeek.toISOString().split('T')[0],
        time: "11:00 AM",
        duration: 60,
        status: "COMPLETED",
        notes: "Discussed time management techniques including the Pomodoro method and task batching. Taylor will implement a new daily planning routine and we'll review progress in our next session.",
        organizationId: organizationUlid || "org1",
        createdAt: lastMonth.toISOString(),
        updatedAt: lastWeek.toISOString()
      },
      {
        id: "mock-session-5",
        memberId: "user-5",
        memberName: "Jordan Reynolds",
        memberAvatar: DEFAULT_AVATARS.USER,
        topic: "Leadership Training",
        date: lastMonth.toISOString().split('T')[0],
        time: "03:45 PM",
        duration: 120,
        status: "COMPLETED",
        notes: "Focused on delegation skills and team communication. Jordan is preparing to lead the new product initiative and we reviewed strategies for managing cross-functional teams.",
        organizationId: organizationUlid || "org1",
        createdAt: lastMonth.toISOString(),
        updatedAt: lastMonth.toISOString()
      }
    ]
  }
  
  // Calculate stats from sessions
  const calculateStats = (sessionsData: CoachingSession[]) => {
    const completedSessions = sessionsData.filter(session => session.status === 'COMPLETED')
    const upcomingSessions = sessionsData.filter(session => 
      session.status === 'SCHEDULED' && new Date(`${session.date}T${session.time}`) >= new Date()
    )
    const totalHours = sessionsData.reduce((total, session) => total + session.duration, 0) / 60
    const completionRate = sessionsData.length > 0 
      ? Math.round((completedSessions.length / sessionsData.length) * 100) 
      : 0
    
    setStats({
      totalSessions: sessionsData.length,
      completedSessions: completedSessions.length,
      upcomingSessions: upcomingSessions.length,
      totalHours,
      completionRate
    })
  }
  
  // Filter sessions based on search query and status filter
  const filteredSessions = sessions

  // Separate upcoming and past sessions
  const upcomingSessions = filteredSessions.filter(session => {
    // Fix date parsing to ensure proper comparison
    try {
      // Parse date and time into a JavaScript Date object
      const [year, month, day] = session.date.split('-').map(Number);
      const sessionDate = new Date(year, month - 1, day); // month is 0-indexed in JS
      
      // Set the time from the session time string (e.g., "10:00 AM")
      const timeMatch = session.time.match(/(\d+):(\d+)\s*([AP]M)/i);
      if (timeMatch) {
        let [_, hours, minutes, ampm] = timeMatch;
        let hourNum = parseInt(hours, 10);
        
        // Convert 12-hour format to 24-hour
        if (ampm.toUpperCase() === 'PM' && hourNum < 12) {
          hourNum += 12;
        } else if (ampm.toUpperCase() === 'AM' && hourNum === 12) {
          hourNum = 0;
        }
        
        sessionDate.setHours(hourNum, parseInt(minutes, 10), 0, 0);
      }
      
      // Now compare with current date
      return session.status === "SCHEDULED" && sessionDate >= new Date();
    } catch (err) {
      console.error('[DATE_PARSING_ERROR]', err, session);
      // Default to status-only check if date parsing fails
      return session.status === "SCHEDULED";
    }
  });
  
  const pastSessions = filteredSessions.filter(session => {
    // Use similar logic as above but for past sessions
    try {
      const [year, month, day] = session.date.split('-').map(Number);
      const sessionDate = new Date(year, month - 1, day);
      
      const timeMatch = session.time.match(/(\d+):(\d+)\s*([AP]M)/i);
      if (timeMatch) {
        let [_, hours, minutes, ampm] = timeMatch;
        let hourNum = parseInt(hours, 10);
        
        if (ampm.toUpperCase() === 'PM' && hourNum < 12) {
          hourNum += 12;
        } else if (ampm.toUpperCase() === 'AM' && hourNum === 12) {
          hourNum = 0;
        }
        
        sessionDate.setHours(hourNum, parseInt(minutes, 10), 0, 0);
      }
      
      return session.status === "COMPLETED" || sessionDate < new Date();
    } catch (err) {
      console.error('[DATE_PARSING_ERROR]', err, session);
      return session.status === "COMPLETED";
    }
  });

  // Format date in a more readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  // Session Notes Modal Component
  function SessionNotesModal({ 
    isOpen, 
    onClose, 
    session 
  }: { 
    isOpen: boolean; 
    onClose: () => void; 
    session: CoachingSession | null;
  }) {
    if (!session) return null;
    
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Session Notes</DialogTitle>
            <DialogDescription>
              {session.topic} with {session.memberName} on {formatDate(session.date)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-start gap-4 mb-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={session.memberAvatar} alt={session.memberName} />
              <AvatarFallback>{session.memberName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-medium">{session.memberName}</h4>
              <div className="flex items-center text-sm text-muted-foreground gap-2">
                <Calendar className="h-3.5 w-3.5" />
                <span>{formatDate(session.date)}</span>
                <Clock className="h-3.5 w-3.5 ml-2" />
                <span>{session.time}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-muted/40 p-4 rounded-md whitespace-pre-wrap text-sm">
            {session.notes || "No notes were taken for this session."}
          </div>

        </DialogContent>
      </Dialog>
    );
  }

  const hasNoSessions = !isLoading && sessions.length === 0;

  return (
    <div className="flex flex-col space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Coaching Sessions</h1>
          <p className="text-muted-foreground">View and manage coaching sessions with your team members</p>
        </div>
      </div>

      {/* Stats Cards */}
      <CoachingStatsCards 
        totalSessions={stats.totalSessions}
        completedSessions={stats.completedSessions}
        upcomingSessions={stats.upcomingSessions}
        totalHours={stats.totalHours}
        completionRate={stats.completionRate}
        isLoading={isLoading}
      />

      {/* Sessions Tabs - always show */}
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
                              <AvatarImage src={session.memberAvatar} alt={session.memberName} />
                              <AvatarFallback>{session.memberName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{session.memberName}</span>
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
                                <User className="mr-2 h-4 w-4" />
                                <span>View Full Profile</span>
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
                  <CalendarX className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p>No upcoming sessions scheduled</p>
                  <Button variant="outline" size="sm" className="mt-4">
                    <CalendarPlus className="mr-2 h-4 w-4" />
                    Schedule New Session
                  </Button>
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
                              <AvatarImage src={session.memberAvatar} alt={session.memberName} />
                              <AvatarFallback>{session.memberName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{session.memberName}</span>
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
                              <DropdownMenuItem onSelect={() => openNotesModal(session)}>
                                <FileText className="mr-2 h-4 w-4" />
                                <span>View Notes</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <User className="mr-2 h-4 w-4" />
                                <span>View Full Profile</span>
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
                  <CalendarX className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p>No completed sessions yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recent Notes - Replaced with the new component */}
      <RecentSessionNotes 
        sessions={sessions}
        formatDate={formatDate}
      />
      
      {/* Session Notes Modal */}
      <SessionNotesModal 
        isOpen={isNotesModalOpen} 
        onClose={closeNotesModal} 
        session={selectedSession}
      />
    </div>
  )
} 