'use client'

import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DEFAULT_AVATARS } from '@/utils/constants'
import { TopMentee, Note, Session } from '@/utils/types/mentee'
import { fetchSessionsByMenteeId } from '@/utils/actions/sessions'
import { format } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MenteeProfileModalProps {
  mentee: TopMentee | null;
  isOpen: boolean;
  onClose: () => void;
}

export function MenteeProfileModal({ mentee, isOpen, onClose }: MenteeProfileModalProps) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [sessionPage, setSessionPage] = useState(0)
  const [notesPage, setNotesPage] = useState(0)
  
  const ITEMS_PER_PAGE = 3
  
  // Calculate pagination for sessions
  const totalSessionPages = Math.ceil(sessions.length / ITEMS_PER_PAGE)
  const currentSessionItems = sessions.slice(
    sessionPage * ITEMS_PER_PAGE, 
    (sessionPage + 1) * ITEMS_PER_PAGE
  )
  
  // For notes - we'll use dummy data for now
  const notes: Note[] = [] // Empty array since we don't have real notes yet
  const totalNotesPages = Math.ceil(notes.length / ITEMS_PER_PAGE)
  const currentNotesItems = notes.slice(
    notesPage * ITEMS_PER_PAGE,
    (notesPage + 1) * ITEMS_PER_PAGE
  )

  useEffect(() => {
    if (mentee && isOpen) {
      setIsLoading(true)
      fetchSessionsByMenteeId(mentee.ulid)
        .then(response => {
          if (response.data) {
            setSessions(response.data)
          } else {
            console.error("Error fetching sessions:", response.error)
            setSessions([])
          }
        })
        .catch(error => {
          console.error("Failed to fetch sessions:", error)
          setSessions([])
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
    
    // Reset pagination when modal opens
    setSessionPage(0)
    setNotesPage(0)
  }, [mentee, isOpen])

  if (!mentee) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Mentee Profile</DialogTitle>
          <DialogDescription>
            Details about {mentee.firstName} {mentee.lastName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          {/* Profile Header */}
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage 
                src={mentee.profileImageUrl || DEFAULT_AVATARS.PLACEHOLDER} 
                alt={`${mentee.firstName || ''} ${mentee.lastName || ''}`}
              />
              <AvatarFallback>
                {mentee.firstName?.[0] || ''}
                {mentee.lastName?.[0] || ''}
              </AvatarFallback>
            </Avatar>
            
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">{mentee.firstName} {mentee.lastName}</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{mentee.sessionsCompleted} completed sessions</span>
                <span>•</span>
                <span>${mentee.revenue.toLocaleString()}</span>
              </div>
            </div>
          </div>
          
          {/* Overview Section Header */}
          <div className="border-b pb-2">
            <h3 className="font-medium">Overview</h3>
          </div>
            
          {/* Statistics Cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-3">
              <div className="text-xs text-muted-foreground">Average Session Revenue</div>
              <div className="text-2xl font-semibold">
                ${mentee.sessionsCompleted > 0 ? (mentee.revenue / mentee.sessionsCompleted).toFixed(0) : 0}
              </div>
            </Card>
            
            <Card className="p-3">
              <div className="text-xs text-muted-foreground">Total Sessions</div>
              <div className="text-2xl font-semibold">{mentee.sessionsCompleted}</div>
            </Card>
            
            <Card className="p-3">
              <div className="text-xs text-muted-foreground">Total Revenue</div>
              <div className="text-2xl font-semibold">${mentee.revenue.toLocaleString()}</div>
            </Card>
          </div>
          
          {/* Sessions with Pagination */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium">Sessions</h3>
              {totalSessionPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6" 
                    onClick={() => setSessionPage(prev => Math.max(0, prev - 1))}
                    disabled={sessionPage === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {sessionPage + 1} / {totalSessionPages}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6" 
                    onClick={() => setSessionPage(prev => Math.min(totalSessionPages - 1, prev + 1))}
                    disabled={sessionPage === totalSessionPages - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : currentSessionItems.length > 0 ? (
              <div className="space-y-2">
                {currentSessionItems.map(session => (
                  <div key={session.ulid} className="bg-muted/50 p-3 rounded-md text-sm">
                    <div className="flex justify-between items-center">
                      <div>
                        <div>{format(new Date(session.startTime), "MMM d, yyyy • h:mm a")}</div>
                        <div className="text-xs text-muted-foreground">
                          {Math.round(
                            (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / (1000 * 60)
                          )} min
                        </div>
                      </div>
                      <Badge variant={
                        session.status === 'COMPLETED' ? 'default' :
                        session.status === 'SCHEDULED' ? 'outline' :
                        session.status === 'CANCELLED' ? 'destructive' : 'secondary'
                      }>
                        {session.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                No sessions found for this mentee.
              </div>
            )}
            
            {/* Show pagination controls below content if there are sessions */}
            {!isLoading && sessions.length > 0 && totalSessionPages > 1 && (
              <div className="flex justify-center mt-2">
                <div className="flex gap-1">
                  {Array.from({length: totalSessionPages}).map((_, index) => (
                    <Button 
                      key={index}
                      variant={sessionPage === index ? "default" : "outline"}
                      size="icon"
                      className="h-6 w-6 text-xs"
                      onClick={() => setSessionPage(index)}
                    >
                      {index + 1}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Notes with Pagination */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium">Notes</h3>
              {totalNotesPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6" 
                    onClick={() => setNotesPage(prev => Math.max(0, prev - 1))}
                    disabled={notesPage === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {notesPage + 1} / {totalNotesPages}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6" 
                    onClick={() => setNotesPage(prev => Math.min(totalNotesPages - 1, prev + 1))}
                    disabled={notesPage === totalNotesPages - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            
            {currentNotesItems.length > 0 ? (
              <div className="space-y-2">
                {currentNotesItems.map((note, index) => (
                  <div key={index} className="bg-muted/50 p-3 rounded-md text-sm">
                    {/* Note content would go here */}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                No notes added yet.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 